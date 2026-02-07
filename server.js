const express = require('express');
const path = require('path');
const SunCalc = require('suncalc');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SHADEMAP_API_KEY = String(process.env.SHADEMAP_API_KEY || '').trim();
const USER_AGENT = 'CoolRoutesHackathon/1.0 (hackathon@local.dev)';
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
    shadeMapEnabled: Boolean(SHADEMAP_API_KEY)
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

app.get('/api/geocode', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 3) {
    res.status(400).json({ error: 'Query must be at least 3 characters.' });
    return;
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '5');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('countrycodes', 'ae');

  try {
    const results = await fetchJson(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en'
      }
    });

    const items = results.map((item) => ({
      label: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon)
    })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

    res.json({ items });
  } catch (error) {
    res.status(502).json({ error: `Geocoding failed: ${error.message}` });
  }
});

app.get('/api/reverse-geocode', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    res.status(400).json({ error: 'Invalid coordinates. Expect lat and lng query params.' });
    return;
  }

  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('zoom', '18');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', 'en');

  try {
    const item = await fetchJson(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en'
      }
    });

    res.json({
      label: item?.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      lat: Number(item?.lat ?? lat),
      lng: Number(item?.lon ?? lng)
    });
  } catch (error) {
    res.status(502).json({ error: `Reverse geocoding failed: ${error.message}` });
  }
});

app.post('/api/optimize-route', async (req, res) => {
  const from = normalizePoint(req.body?.from);
  const to = normalizePoint(req.body?.to);
  const autoPod = Boolean(req.body?.autoPod);

  if (!from || !to) {
    res.status(400).json({ error: 'Invalid coordinates. Expect {from:{lat,lng}, to:{lat,lng}}.' });
    return;
  }

  try {
    const now = new Date();
    const routeCandidates = await buildRouteCandidates(from, to);

    if (!routeCandidates.length) {
      res.status(502).json({ error: 'No walking routes found between the selected points.' });
      return;
    }

    const bbox = expandBBox(computeRoutesBBox(routeCandidates), 0.0025);
    let buildings = [];
    let buildingDataWarning = null;
    try {
      buildings = await fetchBuildingsFromOverpass(bbox);
    } catch (error) {
      buildingDataWarning = `Building shadow data unavailable (${error.message}). Using route-only fallback.`;
    }
    const projection = buildProjectionContext(bbox);
    const projectedBuildings = projectBuildings(buildings, projection);

    const evaluated = routeCandidates.map((route) => evaluateRouteShade(route, projectedBuildings, projection, now));
    const shortestDistance = Math.min(...evaluated.map((route) => route.distance));

    for (const route of evaluated) {
      const extraFactor = (route.distance - shortestDistance) / Math.max(shortestDistance, 1);
      route.score = route.shadeRatio - (Math.max(0, extraFactor) * 0.38);
    }

    evaluated.sort((a, b) => b.score - a.score);
    const best = evaluated[0];

    const remainingAfterShadeM = best.shadowEnd ? Math.max(0, best.distance - best.shadowEnd.distanceAlong) : best.distance;
    const podPickup = best.shadowEnd
      ? { lat: best.shadowEnd.point[0], lng: best.shadowEnd.point[1] }
      : { lat: best.latLngGeometry[0][0], lng: best.latLngGeometry[0][1] };
    let podDispatch = null;

    if (autoPod && remainingAfterShadeM >= 500) {
      podDispatch = simulatePodDispatch({
        pickup: podPickup,
        destination: to,
        remainingMeters: remainingAfterShadeM,
        now
      });
    }

    res.json({
      generatedAt: now.toISOString(),
      sun: {
        altitudeDeg: Number(best.sun.altitudeDeg.toFixed(2)),
        azimuthDeg: Number(best.sun.azimuthDeg.toFixed(2)),
        isDaylight: best.sun.altitudeDeg > 0
      },
      summary: {
        distanceMeters: Math.round(best.distance),
        durationMinutes: Math.round(estimateWalkingDurationSeconds(best.distance) / 60),
        shadedMeters: Math.round(best.shadedDistance),
        sunnyMeters: Math.round(best.distance - best.shadedDistance),
        shadeRatio: Number((best.shadeRatio * 100).toFixed(1))
      },
      bestRoute: {
        name: best.name,
        geometry: best.latLngGeometry,
        segmentGroups: best.segmentGroups,
        shadowEnd: best.shadowEnd ? {
          point: best.shadowEnd.point,
          remainingMeters: Math.round(remainingAfterShadeM)
        } : null
      },
      alternatives: evaluated.slice(0, 5).map((route) => ({
        name: route.name,
        distanceMeters: Math.round(route.distance),
        durationMinutes: Math.round(estimateWalkingDurationSeconds(route.distance) / 60),
        shadeRatio: Number((route.shadeRatio * 100).toFixed(1)),
        score: Number(route.score.toFixed(3))
      })),
      podDispatch,
      warnings: buildingDataWarning ? [buildingDataWarning] : []
    });
  } catch (error) {
    res.status(500).json({ error: `Route optimization failed: ${error.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Cool Routes server running at http://localhost:${PORT}`);
});

function normalizePoint(point) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

async function buildRouteCandidates(from, to) {
  const directRoutes = await fetchOsrmRoutes([from, to], { alternatives: true });
  const collected = [...directRoutes];

  if (!directRoutes.length) {
    return [];
  }

  const bearing = bearingDegrees(from, to);
  const midpoint = {
    lat: (from.lat + to.lat) / 2,
    lng: (from.lng + to.lng) / 2
  };

  const offsetsMeters = [120, -120, 220, -220, 320, -320];
  const viaPoints = offsetsMeters.map((offset) => {
    const perpendicular = normalizeBearing(bearing + (offset >= 0 ? 90 : -90));
    return destinationPoint(midpoint, perpendicular, Math.abs(offset));
  });

  const detourRequests = viaPoints.map(async (via) => {
    const routes = await fetchOsrmRoutes([from, via, to], { alternatives: false });
    return routes[0] || null;
  });

  const detours = await Promise.allSettled(detourRequests);
  for (const result of detours) {
    if (result.status === 'fulfilled' && result.value) {
      collected.push(result.value);
    }
  }

  const shortest = Math.min(...collected.map((route) => route.distance));
  const deduped = dedupeRoutes(collected)
    .filter((route) => route.distance <= shortest * 1.65)
    .map((route, index) => ({
      ...route,
      name: index === 0 ? 'Primary' : `Candidate ${index}`
    }));

  return deduped;
}

async function fetchOsrmRoutes(points, options = {}) {
  const coords = points.map((point) => `${point.lng},${point.lat}`).join(';');
  const url = new URL(`https://router.project-osrm.org/route/v1/foot/${coords}`);
  url.searchParams.set('overview', 'full');
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('steps', 'false');
  url.searchParams.set('alternatives', options.alternatives ? 'true' : 'false');

  const data = await fetchJson(url.toString(), {
    headers: {
      'User-Agent': USER_AGENT
    }
  });

  const routes = Array.isArray(data.routes) ? data.routes : [];
  return routes
    .filter((route) => route.geometry?.coordinates?.length >= 2)
    .map((route) => ({
      distance: Number(route.distance),
      duration: Number(route.duration),
      geometry: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))
    }));
}

function dedupeRoutes(routes) {
  const seen = new Set();
  const out = [];

  for (const route of routes) {
    const hash = routeHash(route.geometry);
    if (seen.has(hash)) {
      continue;
    }
    seen.add(hash);
    out.push(route);
  }

  return out;
}

function routeHash(geometry) {
  const stride = Math.max(1, Math.floor(geometry.length / 25));
  const points = [];

  for (let i = 0; i < geometry.length; i += stride) {
    const point = geometry[i];
    points.push(`${point.lat.toFixed(4)},${point.lng.toFixed(4)}`);
  }

  const end = geometry[geometry.length - 1];
  points.push(`${end.lat.toFixed(4)},${end.lng.toFixed(4)}`);
  return points.join('|');
}

function evaluateRouteShade(route, buildings, projection, now) {
  const latLngGeometry = route.geometry.map((point) => [point.lat, point.lng]);
  const sunRef = route.geometry[Math.floor(route.geometry.length / 2)] || route.geometry[0];
  const sunPosition = SunCalc.getPosition(now, sunRef.lat, sunRef.lng);
  const altitudeDeg = radiansToDegrees(sunPosition.altitude);
  const azimuthDeg = normalizeBearing(radiansToDegrees(sunPosition.azimuth) + 180);
  const tanAltitude = Math.tan(sunPosition.altitude);
  const sunlightDirection = bearingToUnitVector(azimuthDeg);

  const samples = sampleRoute(route.geometry, projection, 12);
  if (!samples.length) {
    return {
      ...route,
      latLngGeometry,
      sun: { altitudeDeg, azimuthDeg },
      shadedDistance: 0,
      shadeRatio: 0,
      segmentGroups: [],
      shadowEnd: null
    };
  }

  if (altitudeDeg <= 0) {
    const allShadedGroups = buildSegmentGroups(samples, true);
    return {
      ...route,
      latLngGeometry,
      sun: { altitudeDeg, azimuthDeg },
      shadedDistance: route.distance,
      shadeRatio: 1,
      segmentGroups: allShadedGroups,
      shadowEnd: {
        point: samples[samples.length - 1].latLng,
        distanceAlong: route.distance
      }
    };
  }

  const enrichedBuildings = buildings.map((building) => ({
    ...building,
    maxShadowLength: Math.max(0, Math.min(500, building.height / Math.max(tanAltitude, 0.01)))
  }));

  for (const sample of samples) {
    sample.shaded = isPointShaded(sample.xy, enrichedBuildings, sunlightDirection);
  }

  let shadedDistance = 0;
  for (let i = 1; i < samples.length; i += 1) {
    const segmentDistance = samples[i].distanceAlong - samples[i - 1].distanceAlong;
    if (samples[i - 1].shaded && samples[i].shaded) {
      shadedDistance += segmentDistance;
    }
  }

  const segmentGroups = buildSegmentGroups(samples, false);
  const coolPathEnd = determineCoolPathEnd(samples);

  return {
    ...route,
    latLngGeometry,
    sun: { altitudeDeg, azimuthDeg },
    shadedDistance,
    shadeRatio: shadedDistance / Math.max(route.distance, 1),
    segmentGroups,
    shadowEnd: coolPathEnd ? {
      point: coolPathEnd.latLng,
      distanceAlong: coolPathEnd.distanceAlong
    } : null
  };
}

function determineCoolPathEnd(samples) {
  if (!samples.length) {
    return null;
  }

  // "Cool path" is the initial shade-first walking section.
  if (!samples[0].shaded) {
    return null;
  }

  let best = samples[0];
  let sunnyBreak = 0;

  for (let i = 1; i < samples.length; i += 1) {
    const segmentDistance = samples[i].distanceAlong - samples[i - 1].distanceAlong;
    if (samples[i - 1].shaded && samples[i].shaded) {
      best = samples[i];
      sunnyBreak = 0;
      continue;
    }

    sunnyBreak += segmentDistance;
    if (sunnyBreak >= 50) {
      break;
    }
  }

  return best;
}

function buildSegmentGroups(samples, forceShaded) {
  if (samples.length < 2) {
    return [];
  }

  const groups = [];
  let active = null;

  for (let i = 1; i < samples.length; i += 1) {
    const prev = samples[i - 1];
    const current = samples[i];
    const shaded = forceShaded ? true : (prev.shaded && current.shaded);

    if (!active || active.shaded !== shaded) {
      active = {
        shaded,
        points: [prev.latLng, current.latLng]
      };
      groups.push(active);
    } else {
      active.points.push(current.latLng);
    }
  }

  return groups;
}

function sampleRoute(routeGeometry, projection, stepMeters) {
  if (!Array.isArray(routeGeometry) || routeGeometry.length < 2) {
    return [];
  }

  const projected = routeGeometry.map((point) => projection.project(point));
  const output = [];
  let distanceAlong = 0;

  output.push({
    latLng: [routeGeometry[0].lat, routeGeometry[0].lng],
    xy: projected[0],
    distanceAlong: 0
  });

  let carry = stepMeters;
  for (let i = 1; i < projected.length; i += 1) {
    const a = projected[i - 1];
    const b = projected[i];
    const segLength = distance2d(a, b);

    if (segLength < 0.001) {
      continue;
    }

    while (carry <= segLength) {
      const t = carry / segLength;
      const xy = {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t
      };
      const latLng = projection.unproject(xy);
      output.push({
        latLng: [latLng.lat, latLng.lng],
        xy,
        distanceAlong: distanceAlong + carry
      });
      carry += stepMeters;
    }

    distanceAlong += segLength;
    carry -= segLength;
  }

  const lastPoint = routeGeometry[routeGeometry.length - 1];
  const lastProjected = projected[projected.length - 1];
  const lastSample = output[output.length - 1];

  if (!lastSample || distance2d(lastSample.xy, lastProjected) > 1.0) {
    output.push({
      latLng: [lastPoint.lat, lastPoint.lng],
      xy: lastProjected,
      distanceAlong
    });
  }

  return output;
}

function isPointShaded(point, buildings, sunlightDirection) {
  for (const building of buildings) {
    if (pointInPolygon(point, building.ring)) {
      return true;
    }

    const bboxDistance = minDistanceToBBox(point, building.bbox);
    if (bboxDistance > building.maxShadowLength + 3) {
      continue;
    }

    const hitDistance = rayPolygonFirstHit(point, sunlightDirection, building.ring);
    if (hitDistance !== null && hitDistance <= building.maxShadowLength + 2) {
      return true;
    }
  }

  return false;
}

function rayPolygonFirstHit(origin, dir, ring) {
  let nearest = null;

  for (let i = 1; i < ring.length; i += 1) {
    const hit = intersectRayWithSegment(origin, dir, ring[i - 1], ring[i]);
    if (hit !== null && (nearest === null || hit < nearest)) {
      nearest = hit;
    }
  }

  return nearest;
}

function intersectRayWithSegment(origin, dir, a, b) {
  const v = { x: b.x - a.x, y: b.y - a.y };
  const ap = { x: a.x - origin.x, y: a.y - origin.y };
  const denominator = cross2d(dir, v);

  if (Math.abs(denominator) < 1e-9) {
    return null;
  }

  const t = cross2d(ap, v) / denominator;
  const u = cross2d(ap, dir) / denominator;

  if (t >= 0 && u >= 0 && u <= 1) {
    return t;
  }

  return null;
}

function pointInPolygon(point, ring) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i].x;
    const yi = ring[i].y;
    const xj = ring[j].x;
    const yj = ring[j].y;

    const intersects = ((yi > point.y) !== (yj > point.y))
      && (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 1e-12) + xi);

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function cross2d(a, b) {
  return a.x * b.y - a.y * b.x;
}

function minDistanceToBBox(point, bbox) {
  const dx = point.x < bbox.minX ? bbox.minX - point.x : (point.x > bbox.maxX ? point.x - bbox.maxX : 0);
  const dy = point.y < bbox.minY ? bbox.minY - point.y : (point.y > bbox.maxY ? point.y - bbox.maxY : 0);
  return Math.hypot(dx, dy);
}

async function fetchBuildingsFromOverpass(bbox) {
  const cacheKey = [bbox.south, bbox.west, bbox.north, bbox.east].map((v) => v.toFixed(4)).join(',');
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

function buildProjectionContext(bbox) {
  const lat0 = (bbox.north + bbox.south) / 2;
  const lng0 = (bbox.east + bbox.west) / 2;
  const latScale = 110540;
  const lngScale = 111320 * Math.cos(degreesToRadians(lat0));

  return {
    project(point) {
      return {
        x: (point.lng - lng0) * lngScale,
        y: (point.lat - lat0) * latScale
      };
    },
    unproject(point) {
      return {
        lat: lat0 + point.y / latScale,
        lng: lng0 + point.x / lngScale
      };
    }
  };
}

function projectBuildings(buildings, projection) {
  const projected = [];

  for (const building of buildings) {
    const ring = building.ring.map((point) => projection.project(point));

    if (ring.length < 4) {
      continue;
    }

    const bbox = {
      minX: Math.min(...ring.map((point) => point.x)),
      maxX: Math.max(...ring.map((point) => point.x)),
      minY: Math.min(...ring.map((point) => point.y)),
      maxY: Math.max(...ring.map((point) => point.y))
    };

    projected.push({
      ring,
      bbox,
      height: building.height
    });
  }

  return projected;
}

function computeRoutesBBox(routes) {
  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;

  for (const route of routes) {
    for (const point of route.geometry) {
      north = Math.max(north, point.lat);
      south = Math.min(south, point.lat);
      east = Math.max(east, point.lng);
      west = Math.min(west, point.lng);
    }
  }

  return { north, south, east, west };
}

function expandBBox(bbox, paddingDeg) {
  return {
    north: bbox.north + paddingDeg,
    south: bbox.south - paddingDeg,
    east: bbox.east + paddingDeg,
    west: bbox.west - paddingDeg
  };
}

function bearingToUnitVector(bearingDeg) {
  const radians = degreesToRadians(bearingDeg);
  return {
    x: Math.sin(radians),
    y: Math.cos(radians)
  };
}

function bearingDegrees(a, b) {
  const lat1 = degreesToRadians(a.lat);
  const lat2 = degreesToRadians(b.lat);
  const dLng = degreesToRadians(b.lng - a.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2)
    - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return normalizeBearing(radiansToDegrees(Math.atan2(y, x)));
}

function destinationPoint(start, bearingDeg, distanceMeters) {
  const angularDistance = distanceMeters / 6371000;
  const bearingRad = degreesToRadians(bearingDeg);
  const lat1 = degreesToRadians(start.lat);
  const lng1 = degreesToRadians(start.lng);

  const sinLat1 = Math.sin(lat1);
  const cosLat1 = Math.cos(lat1);
  const sinAd = Math.sin(angularDistance);
  const cosAd = Math.cos(angularDistance);

  const lat2 = Math.asin(sinLat1 * cosAd + cosLat1 * sinAd * Math.cos(bearingRad));
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearingRad) * sinAd * cosLat1,
    cosAd - sinLat1 * Math.sin(lat2)
  );

  return {
    lat: radiansToDegrees(lat2),
    lng: radiansToDegrees(lng2)
  };
}

function normalizeBearing(value) {
  return ((value % 360) + 360) % 360;
}

function distance2d(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
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

function simulatePodDispatch({ pickup, destination, remainingMeters, now }) {
  const vehicleType = remainingMeters > 1200 ? 'micro-pod' : 'e-scooter';
  const etaMinutes = clamp(Math.round(2 + remainingMeters / 260), 3, 14);
  const dispatchId = `POD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const etaAt = new Date(now.getTime() + etaMinutes * 60000);

  return {
    dispatched: true,
    dispatchId,
    vehicleType,
    etaMinutes,
    etaAt: etaAt.toISOString(),
    pickup,
    destination,
    message: `${vehicleType} auto-dispatched to shadow exit point (${Math.round(remainingMeters)}m remaining in direct sun).`
  };
}

function estimateWalkingDurationSeconds(distanceMeters) {
  // 1.32 m/s ~= 4.75 km/h urban walking pace.
  return distanceMeters / 1.32;
}

function degreesToRadians(value) {
  return value * (Math.PI / 180);
}

function radiansToDegrees(value) {
  return value * (180 / Math.PI);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

async function fetchJson(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${body.slice(0, 200)}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}
