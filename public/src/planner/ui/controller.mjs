import { escapeHtml, formatClock } from '../utils/format.mjs';

const STATUS_LABEL = {
  green: 'On Track',
  yellow: 'Needs Attention',
  red: 'Losing Focus'
};

function toMinutes(hhmm) {
  const parts = String(hhmm).split(':');
  if (parts.length !== 2) {
    return Number.NaN;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return Number.NaN;
  }

  return (hours * 60) + minutes;
}

function currentMinutes(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return Number.NaN;
  }

  return (date.getHours() * 60) + date.getMinutes();
}

function getTaskPhase(task, nowMin) {
  const startMin = toMinutes(task.start);
  const endMin = toMinutes(task.end);

  if (!Number.isFinite(startMin) || !Number.isFinite(endMin) || !Number.isFinite(nowMin)) {
    return 'upcoming';
  }

  if (nowMin < startMin) {
    return 'upcoming';
  }

  if (nowMin >= endMin) {
    return 'completed';
  }

  return 'current';
}

function statusPillClasses(status) {
  const base = 'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-extrabold tracking-wide';
  if (status === 'green') {
    return `${base} border-emerald-300 bg-emerald-100 text-emerald-900`;
  }

  if (status === 'red') {
    return `${base} border-rose-300 bg-rose-100 text-rose-900`;
  }

  return `${base} border-amber-300 bg-amber-100 text-amber-900`;
}

function renderTaskMeta(task) {
  const meta = [
    task.load ? `Load: ${task.load}` : null,
    task.zone ? `Zone: ${task.zone}` : null,
    task.sunExposure ? `Sun: ${task.sunExposure}` : null,
    task.crowdLevel ? `Crowd: ${task.crowdLevel}` : null
  ].filter(Boolean);

  return meta.length
    ? `<div class="mt-1 text-[11px] text-slate-700">${escapeHtml(meta.join(' | '))}</div>`
    : '';
}

function timelinePhaseClasses(phase) {
  if (phase === 'completed') {
    return 'opacity-60 border-slate-200 bg-white';
  }

  if (phase === 'current') {
    return 'border-teal-300 bg-teal-50/80';
  }

  return 'border-sky-300 bg-white';
}

function renderTimeline(worker, nowDate) {
  const tasks = Array.isArray(worker?.plan) ? worker.plan : [];
  if (!tasks.length) {
    return 'No timeline defined.';
  }

  const nowMin = currentMinutes(nowDate);

  return tasks.map((task) => {
    const phase = getTaskPhase(task, nowMin);

    return `<div class="grid grid-cols-[92px_1fr] gap-2 rounded-md border p-2 max-sm:grid-cols-1 ${timelinePhaseClasses(phase)}">
      <div class="font-mono text-[11px] text-slate-700">${escapeHtml(task.start)} - ${escapeHtml(task.end)}</div>
      <div>
        <div class="text-xs font-semibold text-slate-900">${escapeHtml(task.title || 'Untitled task')}</div>
        <div class="text-xs text-slate-600">${escapeHtml(task.details || '')}</div>
        ${renderTaskMeta(task)}
      </div>
    </div>`;
  }).join('');
}

function findCurrentTask(tasks, nowMin) {
  return tasks.find((task) => {
    const startMin = toMinutes(task.start);
    const endMin = toMinutes(task.end);
    return Number.isFinite(startMin) && Number.isFinite(endMin) && Number.isFinite(nowMin) && nowMin >= startMin && nowMin < endMin;
  }) || null;
}

function findNextTask(tasks, nowMin) {
  return tasks
    .filter((task) => {
      const startMin = toMinutes(task.start);
      return Number.isFinite(startMin) && Number.isFinite(nowMin) && startMin > nowMin;
    })
    .sort((left, right) => toMinutes(left.start) - toMinutes(right.start))[0] || null;
}

function renderQuickTask(task, label, variant) {
  const variantClass = variant === 'current'
    ? 'border-teal-300 bg-teal-50/80'
    : 'border-slate-600 bg-white';

  if (!task) {
    return `<article class="rounded-md border border-dashed border-slate-300 bg-white p-2 text-slate-600">
      <div class="text-[11px] font-bold uppercase tracking-[0.07em] text-slate-600">${escapeHtml(label)}</div>
      <div class="mt-1 text-xs font-semibold">No task</div>
      <div class="text-xs">No matching task for this time window.</div>
    </article>`;
  }

  return `<article class="rounded-md border p-2 ${variantClass}">
    <div class="flex items-center justify-between gap-2">
      <div class="text-[11px] font-bold uppercase tracking-[0.07em] text-slate-600">${escapeHtml(label)}</div>
      <div class="whitespace-nowrap font-mono text-[11px] text-slate-700">${escapeHtml(task.start)} - ${escapeHtml(task.end)}</div>
    </div>
    <div class="mt-1 text-xs font-semibold text-slate-900">${escapeHtml(task.title || 'Untitled task')}</div>
    <div class="text-xs text-slate-600">${escapeHtml(task.details || '')}</div>
    ${renderTaskMeta(task)}
  </article>`;
}

function renderQuickTasks(worker, nowDate) {
  const tasks = Array.isArray(worker?.plan) ? worker.plan : [];
  if (!tasks.length) {
    return 'No timeline defined.';
  }

  const nowMin = currentMinutes(nowDate);
  const currentTask = findCurrentTask(tasks, nowMin);
  const nextTask = findNextTask(tasks, nowMin);

  return [
    renderQuickTask(currentTask, 'Current Task', 'current'),
    renderQuickTask(nextTask, 'Upcoming Task', 'upcoming')
  ].join('');
}

function buildInsightGuidance(worker) {
  if (worker.status === 'red') {
    return 'High risk. Prioritize shaded zones, lower crowd density, and lighter load tasks.';
  }

  if (worker.focusLevel === 'low' || worker.energyLevel === 'low') {
    return 'Fatigue indicators detected. Consider shorter cycles and more frequent checks.';
  }

  if (worker.sunExposure === 'high' || worker.crowdLevel === 'high') {
    return 'Environmental pressure is elevated. Shift to calmer, lower-exposure zones where possible.';
  }

  return 'Conditions are stable. Keep current pace with routine safety checks.';
}

function renderWorkerInsights(worker) {
  if (!worker) {
    return 'No worker selected yet.';
  }

  const chips = [
    `Status: ${STATUS_LABEL[worker.status] || 'Unknown'}`,
    `Focus: ${worker.focusLevel || 'unknown'}`,
    `Energy: ${worker.energyLevel || 'unknown'}`,
    `Sun: ${worker.sunExposure || 'unknown'}`,
    `Crowd: ${worker.crowdLevel || 'unknown'}`,
    `Zone: ${worker.zone || 'Unknown'}`
  ];

  return `<div class="text-xs text-slate-800">${escapeHtml(buildInsightGuidance(worker))}</div>
    <div class="mt-2 flex flex-wrap gap-1.5">
      ${chips.map((chip) => `<span class="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-800">${escapeHtml(chip)}</span>`).join('')}
    </div>`;
}

function renderAllPlansTable(workers, nowDate) {
  if (!Array.isArray(workers) || !workers.length) {
    return 'No plans available.';
  }

  const nowMin = currentMinutes(nowDate);

  return workers.map((worker) => {
    const nextTask = (worker.plan || []).find((task) => {
      const startMin = toMinutes(task.start);
      return Number.isFinite(startMin) && Number.isFinite(nowMin) && startMin >= nowMin;
    });

    return `<article class="rounded-none border border-slate-300 bg-white p-2">
      <div class="flex items-center justify-between gap-2">
        <strong class="text-sm text-slate-900">${escapeHtml(worker.name)}</strong>
        <span class="${statusPillClasses(worker.status)}">${escapeHtml(STATUS_LABEL[worker.status] || 'Unknown')}</span>
      </div>
      <div class="mt-1 text-xs text-slate-700">${escapeHtml(worker.role)} (${escapeHtml(worker.id)})</div>
      <div class="mt-2 text-xs text-slate-800">
        ${nextTask ? `<strong>Next:</strong> ${escapeHtml(nextTask.start)} ${escapeHtml(nextTask.title)}` : '<strong>Next:</strong> Completed for today'}
      </div>
      <div class="mt-2 grid gap-1.5">${renderTimeline(worker, nowDate)}</div>
    </article>`;
  }).join('');
}

function renderProgressLines(lines) {
  if (!Array.isArray(lines) || !lines.length) {
    return '';
  }

  return lines
    .map((line) => `<div class="border-b border-dashed border-slate-200 py-1 text-xs text-slate-700 last:border-b-0">${escapeHtml(line)}</div>`)
    .join('');
}

function setBaseCardTone(dom) {
  dom.workerCard.classList.remove('bg-rose-50/95', 'border-slate-200');
  dom.workerCard.classList.add('bg-white/95', 'border-slate-200');
  dom.workerInfoCard?.classList.remove('bg-white/95', 'border-slate-200');
  dom.workerInfoCard?.classList.add('bg-white/95', 'border-slate-200');
}

function setRedCardTone(dom) {
  dom.workerCard.classList.remove('bg-white/95', 'border-slate-300');
  dom.workerCard.classList.add('bg-white/95', 'border-slate-300');
  dom.workerInfoCard?.classList.remove('bg-white/95', 'border-slate-200');
  dom.workerInfoCard?.classList.add('bg-white/95', 'border-rose-300');
}

export function createUiController(dom) {
  let selectedWorker = null;
  let workersSnapshot = [];
  let selectedWorkerId = null;
  let fullPlanExpanded = false;

  function syncWorkerCardTone(status) {
    if (!dom.workerCard) {
      return;
    }

    if (status === 'red') {
      setRedCardTone(dom);
      return;
    }

    setBaseCardTone(dom);
  }

  function setStatus(message, isError = false) {
    if (!dom.statusBox) {
      return;
    }

    dom.statusBox.textContent = message;
    dom.statusBox.className = isError
      ? 'mt-2 rounded-md border border-rose-300 bg-rose-100 p-2 text-xs text-rose-900'
      : 'mt-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700';
  }

  function setSelectedWorker(worker, nowDate = new Date()) {
    selectedWorker = worker || null;
    const nextWorkerId = selectedWorker?.id || null;
    const workerChanged = nextWorkerId !== selectedWorkerId;
    selectedWorkerId = nextWorkerId;

    if (!selectedWorker) {
      syncWorkerCardTone(null);
      dom.workerName.textContent = 'Select a worker from the map';
      dom.workerRole.textContent = '-';
      dom.workerNowTime.textContent = '-';
      dom.workerQuickTasks.textContent = 'No worker selected yet.';
      dom.workerInsights.textContent = 'No worker selected yet.';
      dom.workerTimeline.textContent = 'No worker selected yet.';
      dom.workerTimeline.classList.add('hidden');
      dom.fullPlanToggleBtn.disabled = true;
      dom.fullPlanToggleBtn.textContent = 'Full Plan';
      dom.workerStatusBadge.className = statusPillClasses('yellow');
      dom.workerStatusBadge.textContent = STATUS_LABEL.yellow;
      fullPlanExpanded = false;
      dom.openWorkerDetailsBtn.disabled = true;
      return;
    }

    if (workerChanged) {
      fullPlanExpanded = false;
    }

    const status = selectedWorker.status === 'green' || selectedWorker.status === 'yellow' || selectedWorker.status === 'red'
      ? selectedWorker.status
      : 'yellow';
    syncWorkerCardTone(status);

    dom.workerName.textContent = selectedWorker.name;
    dom.workerRole.textContent = `${selectedWorker.role} (${selectedWorker.id})`;
    dom.workerNowTime.textContent = formatClock(nowDate);
    dom.workerStatusBadge.className = statusPillClasses(status);
    dom.workerStatusBadge.textContent = STATUS_LABEL[status];
    dom.workerQuickTasks.innerHTML = renderQuickTasks(selectedWorker, nowDate);
    dom.workerInsights.innerHTML = renderWorkerInsights(selectedWorker);
    dom.workerTimeline.innerHTML = renderTimeline(selectedWorker, nowDate);
    dom.workerTimeline.classList.toggle('hidden', !fullPlanExpanded);
    dom.fullPlanToggleBtn.disabled = false;
    dom.fullPlanToggleBtn.textContent = fullPlanExpanded ? 'Hide Full Plan' : 'Full Plan';
    dom.openWorkerDetailsBtn.disabled = false;
  }

  function toggleFullPlan() {
    if (!selectedWorker) {
      return;
    }

    fullPlanExpanded = !fullPlanExpanded;
    dom.workerTimeline.classList.toggle('hidden', !fullPlanExpanded);
    dom.fullPlanToggleBtn.textContent = fullPlanExpanded ? 'Hide Full Plan' : 'Full Plan';
  }

  function setAttentionSectionVisible(visible) {
    dom.aiRebalancerSection.classList.toggle('hidden', !visible);
  }

  function setAttentionAdvisorState({ enabled, reason, loading }) {
    if (dom.attentionHint) {
      dom.attentionHint.textContent = reason;
    }

    dom.generateSwitchBtn.disabled = !enabled || Boolean(loading);
    dom.generateSwitchBtn.textContent = loading ? 'Generating...' : 'Adapt the plan to decrease risks';
    dom.generateSwitchBtn.setAttribute('title', reason || '');
    dom.generateSwitchBtn.setAttribute('aria-label', reason || 'Adapt the plan to decrease risks');
  }

  function setSwitchProgress(lines) {
    const html = renderProgressLines(lines);
    dom.switchProgress.innerHTML = html;
    dom.switchProgress.classList.toggle('hidden', !html);
  }

  function setSwitchProposal(proposal, workerNameById = {}) {
    if (!proposal) {
      dom.switchProposal.classList.add('hidden');
      return;
    }

    const affected = Array.isArray(proposal.affectedWorkerIds)
      ? proposal.affectedWorkerIds.map((workerId) => workerNameById[workerId] || workerId)
      : [];

    dom.switchSummary.innerHTML = `<strong>Proposal:</strong> ${escapeHtml(proposal.summary || 'AI generated a reassignment.')}`;
    dom.switchAffected.innerHTML = `<strong>Affects 2 workers:</strong> ${escapeHtml(affected.join(' and '))}`;
    dom.switchRationale.innerHTML = `<strong>Reasoning:</strong> ${escapeHtml(proposal.rationale || 'Risk reduction and focus recovery.')}`;
    dom.switchProposal.classList.remove('hidden');
  }

  function clearSwitchProposal() {
    dom.switchProposal.classList.add('hidden');
    dom.switchSummary.textContent = '';
    dom.switchAffected.textContent = '';
    dom.switchRationale.textContent = '';
  }

  function setTaskPromptLoading(loading) {
    dom.generateTaskBtn.disabled = loading;
    dom.generateTaskBtn.textContent = loading ? '…' : '→';
    dom.generateTaskBtn.setAttribute('aria-label', loading ? 'Generating task' : 'Generate task from prompt');
    dom.generateTaskBtn.setAttribute('title', loading ? 'Generating task' : 'Generate task from prompt');
  }

  function setTaskProgress(lines) {
    const html = renderProgressLines(lines);
    dom.taskProgress.innerHTML = html;
    dom.taskProgress.classList.toggle('hidden', !html);
  }

  function setGeneratedTaskProposal(proposal) {
    if (!proposal) {
      dom.generatedTaskProposal.classList.add('hidden');
      return;
    }

    const task = proposal.task || {};
    dom.generatedTaskSummary.innerHTML = `<strong>Generated Task:</strong> ${escapeHtml(proposal.summary || task.title || 'New task proposal')}`;
    dom.generatedTaskDetails.innerHTML = `${escapeHtml(task.start || '--:--')} - ${escapeHtml(task.end || '--:--')} | ${escapeHtml(task.title || '')}<br>${escapeHtml(task.details || '')}`;
    dom.generatedTaskRationale.innerHTML = `<strong>AI Notes:</strong> ${escapeHtml(proposal.rationale || 'Generated from your prompt and worker context.')}`;
    dom.generatedTaskProposal.classList.remove('hidden');
  }

  function clearGeneratedTaskProposal() {
    dom.generatedTaskProposal.classList.add('hidden');
    dom.generatedTaskSummary.textContent = '';
    dom.generatedTaskDetails.textContent = '';
    dom.generatedTaskRationale.textContent = '';
  }

  function renderAllPlans(workers, nowDate = new Date()) {
    workersSnapshot = Array.isArray(workers) ? workers : [];
    dom.allPlansContent.innerHTML = renderAllPlansTable(workersSnapshot, nowDate);
  }

  function refreshTimeline(nowDate = new Date()) {
    if (selectedWorker) {
      setSelectedWorker(selectedWorker, nowDate);
    }

    if (!dom.allPlansWindow.classList.contains('hidden')) {
      renderAllPlans(workersSnapshot, nowDate);
    }
  }

  function toggleAllPlans(show) {
    dom.allPlansWindow.classList.toggle('hidden', !show);
  }

  return {
    setStatus,
    setSelectedWorker,
    toggleFullPlan,
    setAttentionSectionVisible,
    setAttentionAdvisorState,
    setSwitchProgress,
    setSwitchProposal,
    clearSwitchProposal,
    setTaskPromptLoading,
    setTaskProgress,
    setGeneratedTaskProposal,
    clearGeneratedTaskProposal,
    renderAllPlans,
    refreshTimeline,
    toggleAllPlans
  };
}
