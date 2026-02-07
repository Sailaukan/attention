const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SHADEMAP_API_KEY = String(process.env.SHADEMAP_API_KEY || '').trim();
const GROQ_API_KEY = String(process.env.GROQ_API_KEY || '').trim();
const GROQ_MODEL = String(process.env.GROQ_MODEL || 'llama-3.3-70b-versatile').trim();
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const USER_AGENT = 'NYUADWorkerPlanner/1.0 (hackathon@local.dev)';
const BUILDING_CACHE_TTL_MS = 5 * 60 * 1000;

const buildingCache = new Map();

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.get('/api/runtime-config', (_req, res) => {
  res.json({
    shadeMapApiKey: SHADEMAP_API_KEY,
    shadeMapEnabled: Boolean(SHADEMAP_API_KEY),
    groqEnabled: Boolean(GROQ_API_KEY),
    groqModel: GROQ_MODEL
  });
});

app.get('/api/buildings', async (req, res) => {
  const south = Number(req.query.south);
  const west = Number(req.query.west);
  const north = Number(req.query.north);
  const east = Number(req.query.east);

  if (![south, west, north, east].every(Number.isFinite)) {
    res.status(400).json({ error: 'Invalid bbox. Expect south,west,north,east query params.' });
    return;
  }

  if (south >= north || west >= east) {
    res.status(400).json({ error: 'Invalid bbox ordering.' });
    return;
  }

  const latSpan = north - south;
  const lngSpan = east - west;
  if (latSpan > 0.24 || lngSpan > 0.24) {
    res.status(400).json({ error: 'BBox too large. Zoom in further.' });
    return;
  }

  try {
    const buildings = await fetchBuildingsFromOverpass({ south, west, north, east });
    const maxFeatures = 1600;
    const features = buildings.slice(0, maxFeatures).map((building, index) => ({
      type: 'Feature',
      id: `b-${index}`,
      properties: {
        height: building.height
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[...simplifyRing(building.ring).map((point) => [point.lng, point.lat])]]
      }
    }));

    res.json({ type: 'FeatureCollection', features });
  } catch (error) {
    res.status(502).json({ error: `Building fetch failed: ${error.message}` });
  }
});

app.post('/api/llm/propose-switch', async (req, res) => {
  if (!GROQ_API_KEY) {
    res.status(503).json({ error: 'GROQ_API_KEY is not configured on the server.' });
    return;
  }

  const redWorker = normalizeWorkerContext(req.body?.redWorker);
  const candidates = Array.isArray(req.body?.candidateWorkers)
    ? req.body.candidateWorkers.map(normalizeWorkerContext).filter(Boolean)
    : [];

  if (!redWorker || redWorker.status !== 'red') {
    res.status(400).json({ error: 'Invalid red worker payload.' });
    return;
  }

  if (!candidates.length) {
    res.status(400).json({ error: 'At least one green candidate worker is required.' });
    return;
  }

  try {
    const promptPayload = {
      siteName: String(req.body?.siteName || 'NYU Abu Dhabi campus'),
      nowIso: String(req.body?.nowIso || new Date().toISOString()),
      redWorker,
      candidateWorkers: candidates
    };

    const modelOutput = await callGroqForJson({
      systemPrompt: [
        'You are an operations safety planner for construction sites.',
        'Return strict JSON only.',
        'You must reduce fatigue and risk for red-status workers losing focus.',
        'Prefer shaded zones, lighter loads, and lower crowd areas.',
        'The reassignment must affect exactly two workers: one red and one green.'
      ].join(' '),
      userPayload: promptPayload,
      schemaHint: {
        summary: 'string',
        rationale: 'string',
        helperWorkerId: 'string',
        redWorkerTask: {
          start: 'HH:MM',
          end: 'HH:MM',
          title: 'string',
          details: 'string',
          load: 'light|medium|heavy',
          zone: 'string',
          sunExposure: 'low|medium|high',
          crowdLevel: 'low|medium|high'
        },
        helperWorkerTask: {
          start: 'HH:MM',
          end: 'HH:MM',
          title: 'string',
          details: 'string',
          load: 'light|medium|heavy',
          zone: 'string',
          sunExposure: 'low|medium|high',
          crowdLevel: 'low|medium|high'
        }
      }
    });

    const proposal = normalizeSwitchProposal(modelOutput, redWorker, candidates);
    res.json({ proposal });
  } catch (error) {
    res.status(502).json({ error: `Failed to generate reassignment proposal: ${error.message}` });
  }
});

app.post('/api/llm/generate-task', async (req, res) => {
  if (!GROQ_API_KEY) {
    res.status(503).json({ error: 'GROQ_API_KEY is not configured on the server.' });
    return;
  }

  const worker = normalizeWorkerContext(req.body?.worker);
  const prompt = String(req.body?.prompt || '').trim();

  if (!worker) {
    res.status(400).json({ error: 'Invalid worker payload.' });
    return;
  }

  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required.' });
    return;
  }

  try {
    const promptPayload = {
      nowIso: String(req.body?.nowIso || new Date().toISOString()),
      instruction: prompt,
      worker
    };

    const modelOutput = await callGroqForJson({
      systemPrompt: [
        'You are an operations planner assistant for construction tasks.',
        'Return strict JSON only.',
        'Generate one improved task based on user prompt and worker context.',
        'Task must reduce operational risk where possible.'
      ].join(' '),
      userPayload: promptPayload,
      schemaHint: {
        summary: 'string',
        rationale: 'string',
        task: {
          start: 'HH:MM',
          end: 'HH:MM',
          title: 'string',
          details: 'string',
          load: 'light|medium|heavy',
          zone: 'string',
          sunExposure: 'low|medium|high',
          crowdLevel: 'low|medium|high'
        }
      }
    });

    const proposal = normalizeGeneratedTaskProposal(modelOutput, worker);
    res.json({ proposal });
  } catch (error) {
    res.status(502).json({ error: `Failed to generate prompt-based task: ${error.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Cool Routes server running at http://localhost:${PORT}`);
});

function normalizeWorkerContext(input) {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const id = String(input.id || '').trim();
  const name = String(input.name || '').trim();
  const role = String(input.role || '').trim();
  const status = String(input.status || '').trim();

  if (!id || !name || !role || !status) {
    return null;
  }

  const location = {
    lat: Number(input.location?.lat),
    lng: Number(input.location?.lng)
  };

  const currentTask = normalizeTask(input.currentTask || null);
  const upcomingTasks = Array.isArray(input.upcomingTasks)
    ? input.upcomingTasks.map((task) => normalizeTask(task)).filter(Boolean)
    : [];

  return {
    id,
    name,
    role,
    status,
    focusLevel: normalizeEnum(input.focusLevel, ['low', 'medium', 'high'], 'medium'),
    energyLevel: normalizeEnum(input.energyLevel, ['low', 'medium', 'high'], 'medium'),
    sunExposure: normalizeEnum(input.sunExposure, ['low', 'medium', 'high'], 'medium'),
    crowdLevel: normalizeEnum(input.crowdLevel, ['low', 'medium', 'high'], 'medium'),
    zone: String(input.zone || 'General zone').trim(),
    location,
    currentTask,
    upcomingTasks
  };
}

function normalizeTask(input, fallback = null) {
  if (!input || typeof input !== 'object') {
    if (!fallback) {
      return null;
    }

    return {
      start: fallback.start,
      end: fallback.end,
      title: fallback.title,
      details: fallback.details,
      load: fallback.load,
      zone: fallback.zone,
      sunExposure: fallback.sunExposure,
      crowdLevel: fallback.crowdLevel
    };
  }

  const base = fallback || {
    start: '13:00',
    end: '14:00',
    title: 'Adjusted site task',
    details: 'Updated by AI planner.',
    load: 'light',
    zone: 'Shaded corridor',
    sunExposure: 'low',
    crowdLevel: 'low'
  };

  return {
    start: normalizeClock(input.start, base.start),
    end: normalizeClock(input.end, base.end),
    title: String(input.title || base.title).trim(),
    details: String(input.details || base.details).trim(),
    load: normalizeEnum(input.load, ['light', 'medium', 'heavy'], base.load),
    zone: String(input.zone || base.zone).trim(),
    sunExposure: normalizeEnum(input.sunExposure, ['low', 'medium', 'high'], base.sunExposure),
    crowdLevel: normalizeEnum(input.crowdLevel, ['low', 'medium', 'high'], base.crowdLevel)
  };
}

function normalizeSwitchProposal(raw, redWorker, candidates) {
  const nearestCandidate = findNearestWorker(redWorker.location, candidates);
  const helperCandidate = candidates.find((worker) => worker.id === String(raw?.helperWorkerId || '').trim()) || nearestCandidate || candidates[0];

  const redSlotFallback = redWorker.currentTask || redWorker.upcomingTasks[0] || {
    start: '13:00',
    end: '14:00',
    title: 'Shaded inspection walk',
    details: 'Lower-risk focus recovery task.',
    load: 'light',
    zone: 'Shaded corridor',
    sunExposure: 'low',
    crowdLevel: 'low'
  };

  const helperSlotFallback = helperCandidate.currentTask || helperCandidate.upcomingTasks[0] || {
    start: redSlotFallback.start,
    end: redSlotFallback.end,
    title: 'Task takeover in active zone',
    details: 'Temporary takeover to stabilize progress.',
    load: 'medium',
    zone: redWorker.zone,
    sunExposure: 'medium',
    crowdLevel: 'medium'
  };

  const redWorkerTask = normalizeTask(raw?.redWorkerTask || raw?.redWorkerReplacementTask, redSlotFallback);
  const helperWorkerTask = normalizeTask(raw?.helperWorkerTask || raw?.greenWorkerTask, helperSlotFallback);

  return {
    id: `switch-${Date.now()}`,
    redWorkerId: redWorker.id,
    helperWorkerId: helperCandidate.id,
    summary: String(raw?.summary || `Switch ${redWorker.name} to a lighter task in a safer zone and assign takeover to ${helperCandidate.name}.`).trim(),
    rationale: String(raw?.rationale || 'Reassignment reduces fatigue risk, heat exposure, and crowd pressure while preserving output.').trim(),
    affectedWorkerIds: [redWorker.id, helperCandidate.id],
    workerUpdates: [
      {
        workerId: redWorker.id,
        status: 'yellow',
        task: redWorkerTask
      },
      {
        workerId: helperCandidate.id,
        status: 'yellow',
        task: helperWorkerTask
      }
    ]
  };
}

function normalizeGeneratedTaskProposal(raw, worker) {
  const fallbackTask = worker.currentTask || worker.upcomingTasks[0] || {
    start: '14:00',
    end: '15:00',
    title: 'AI-adjusted support task',
    details: 'Generated from prompt with risk-aware constraints.',
    load: 'light',
    zone: 'Shaded corridor',
    sunExposure: 'low',
    crowdLevel: 'low'
  };

  return {
    id: `prompt-${Date.now()}`,
    workerId: worker.id,
    summary: String(raw?.summary || 'Generated a revised task from your prompt.').trim(),
    rationale: String(raw?.rationale || 'Task tuned for safer workload, zone, and exposure conditions.').trim(),
    task: normalizeTask(raw?.task || raw?.generatedTask || raw?.proposedTask, fallbackTask)
  };
}

function normalizeClock(value, fallback) {
  const text = String(value || '').trim();
  if (/^\d{2}:\d{2}$/.test(text)) {
    return text;
  }

  return fallback;
}

function normalizeEnum(value, allowed, fallback) {
  const text = String(value || '').trim().toLowerCase();
  return allowed.includes(text) ? text : fallback;
}

function findNearestWorker(origin, workers) {
  if (!origin || !Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) {
    return workers[0] || null;
  }

  let nearest = null;
  let bestDistance = Infinity;

  for (const worker of workers) {
    const lat = Number(worker.location?.lat);
    const lng = Number(worker.location?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    const distance = haversineMeters(origin.lat, origin.lng, lat, lng);
    if (distance < bestDistance) {
      bestDistance = distance;
      nearest = worker;
    }
  }

  return nearest;
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const r = 6371000;
  const dLat = degreesToRadians(lat2 - lat1);
  const dLng = degreesToRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * (Math.sin(dLng / 2) ** 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return r * c;
}

async function callGroqForJson({ systemPrompt, userPayload, schemaHint }) {
  const body = {
    model: GROQ_MODEL,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: [
          'Return JSON using this schema shape:',
          JSON.stringify(schemaHint),
          'Context payload:',
          JSON.stringify(userPayload)
        ].join('\n')
      }
    ]
  };

  const response = await fetchWithTimeout(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'User-Agent': USER_AGENT
    },
    body: JSON.stringify(body)
  }, 25000);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq HTTP ${response.status}: ${text.slice(0, 240)}`);
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;
  const parsed = safeJsonParse(rawContent);
  if (!parsed) {
    throw new Error('Groq response did not contain valid JSON content.');
  }

  return parsed;
}

function safeJsonParse(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url, options = {}, timeoutMs = 15000) {
  const response = await fetchWithTimeout(url, options, timeoutMs);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${body.slice(0, 240)}`);
  }

  return await response.json();
}

async function fetchBuildingsFromOverpass(bbox) {
  const cacheKey = [bbox.south, bbox.west, bbox.north, bbox.east].map((value) => value.toFixed(4)).join(',');
  const cached = buildingCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp) < BUILDING_CACHE_TTL_MS) {
    return cached.data;
  }

  const query = `[out:json][timeout:25];\n(\n  way["building"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});\n);\nout body;\n>;\nout skel qt;`;

  const response = await fetchJson('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'User-Agent': USER_AGENT
    },
    body: query
  }, 30000);

  const elements = Array.isArray(response.elements) ? response.elements : [];
  const nodes = new Map();

  for (const element of elements) {
    if (element.type === 'node' && Number.isFinite(element.lat) && Number.isFinite(element.lon)) {
      nodes.set(element.id, { lat: element.lat, lng: element.lon });
    }
  }

  const buildings = [];

  for (const element of elements) {
    if (element.type !== 'way' || !element.tags?.building || !Array.isArray(element.nodes)) {
      continue;
    }

    const ring = element.nodes
      .map((nodeId) => nodes.get(nodeId))
      .filter(Boolean);

    if (ring.length < 3) {
      continue;
    }

    if (!samePoint(ring[0], ring[ring.length - 1])) {
      ring.push({ ...ring[0] });
    }

    if (ring.length < 4) {
      continue;
    }

    buildings.push({
      ring,
      height: parseBuildingHeight(element.tags)
    });
  }

  buildingCache.set(cacheKey, {
    timestamp: Date.now(),
    data: buildings
  });

  return buildings;
}

function parseBuildingHeight(tags) {
  const explicitHeight = parseMetric(tags.height);
  if (explicitHeight !== null) {
    return clamp(explicitHeight, 3, 350);
  }

  const levels = Number(tags['building:levels']);
  if (Number.isFinite(levels) && levels > 0) {
    return clamp(levels * 3.2, 3, 350);
  }

  return 12;
}

function parseMetric(raw) {
  if (typeof raw !== 'string') {
    return null;
  }

  const normalized = raw.trim().toLowerCase().replace(',', '.');
  if (!normalized) {
    return null;
  }

  const value = Number(normalized.replace('m', '').trim());
  if (Number.isFinite(value)) {
    return value;
  }

  const feetMatch = normalized.match(/^([\d.]+)\s*ft$/);
  if (feetMatch) {
    return Number(feetMatch[1]) * 0.3048;
  }

  return null;
}

function samePoint(a, b) {
  return Math.abs(a.lat - b.lat) < 1e-9 && Math.abs(a.lng - b.lng) < 1e-9;
}

function simplifyRing(ring) {
  if (!Array.isArray(ring) || ring.length < 4) {
    return ring || [];
  }

  const reduced = [];
  let previous = null;

  for (const point of ring) {
    if (!previous) {
      reduced.push(point);
      previous = point;
      continue;
    }

    const latDiff = Math.abs(point.lat - previous.lat);
    const lngDiff = Math.abs(point.lng - previous.lng);
    if (latDiff > 0.000005 || lngDiff > 0.000005) {
      reduced.push(point);
      previous = point;
    }
  }

  if (!samePoint(reduced[0], reduced[reduced.length - 1])) {
    reduced.push({ ...reduced[0] });
  }

  return reduced.length >= 4 ? reduced : ring;
}

function degreesToRadians(value) {
  return value * (Math.PI / 180);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
