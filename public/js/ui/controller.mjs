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

function renderTaskMeta(task) {
  const meta = [
    task.load ? `Load: ${task.load}` : null,
    task.zone ? `Zone: ${task.zone}` : null,
    task.sunExposure ? `Sun: ${task.sunExposure}` : null,
    task.crowdLevel ? `Crowd: ${task.crowdLevel}` : null
  ].filter(Boolean);

  return meta.length ? `<small>${escapeHtml(meta.join(' | '))}</small>` : '';
}

function renderTimeline(worker, nowDate) {
  const tasks = Array.isArray(worker?.plan) ? worker.plan : [];
  if (!tasks.length) {
    return 'No timeline defined.';
  }

  const nowMin = currentMinutes(nowDate);

  return tasks.map((task) => {
    const phase = getTaskPhase(task, nowMin);

    return `<div class="timeline-row timeline-row--${phase}">
      <div class="timeline-time">${escapeHtml(task.start)} - ${escapeHtml(task.end)}</div>
      <div class="timeline-content">
        <strong>${escapeHtml(task.title)}</strong><br>
        <span>${escapeHtml(task.details || '')}</span>
        ${renderTaskMeta(task)}
      </div>
    </div>`;
  }).join('');
}

function renderUpcoming(worker, nowDate) {
  const tasks = Array.isArray(worker?.plan) ? worker.plan : [];
  const nowMin = currentMinutes(nowDate);

  const upcoming = tasks.filter((task) => {
    const startMin = toMinutes(task.start);
    return Number.isFinite(startMin) && Number.isFinite(nowMin) && startMin > nowMin;
  });

  if (!upcoming.length) {
    return 'No upcoming tasks left for today.';
  }

  return upcoming.map((task) => `
    <div class="upcoming-row">
      <strong>${escapeHtml(task.start)} - ${escapeHtml(task.end)}</strong>
      <div>${escapeHtml(task.title)}</div>
      <small>${escapeHtml(task.details || '')}</small>
      ${renderTaskMeta(task)}
    </div>
  `).join('');
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

    return `<article class="all-plan-worker">
      <div class="all-plan-head">
        <strong>${escapeHtml(worker.name)}</strong>
        <span class="status-pill status-pill--${escapeHtml(worker.status)}">${escapeHtml(STATUS_LABEL[worker.status] || 'Unknown')}</span>
      </div>
      <div class="all-plan-role">${escapeHtml(worker.role)} (${escapeHtml(worker.id)})</div>
      <div class="all-plan-next">
        ${nextTask ? `<strong>Next:</strong> ${escapeHtml(nextTask.start)} ${escapeHtml(nextTask.title)}` : '<strong>Next:</strong> Completed for today'}
      </div>
      <div class="all-plan-mini-timeline">${renderTimeline(worker, nowDate)}</div>
    </article>`;
  }).join('');
}

function renderProgressLines(lines) {
  if (!Array.isArray(lines) || !lines.length) {
    return '';
  }

  return lines.map((line) => `<div class="progress-line">${escapeHtml(line)}</div>`).join('');
}

export function createUiController(dom) {
  let selectedWorker = null;
  let workersSnapshot = [];

  function setStatus(message, isError = false) {
    dom.statusBox.textContent = message;
    dom.statusBox.style.borderColor = isError ? 'rgba(185, 28, 28, 0.45)' : 'rgba(11, 23, 33, 0.14)';
    dom.statusBox.style.background = isError ? '#fee2e2' : '#f8fafc';
    dom.statusBox.style.color = isError ? '#7f1d1d' : '#334155';
  }

  function setSelectedWorker(worker, nowDate = new Date()) {
    selectedWorker = worker || null;

    if (!selectedWorker) {
      dom.workerName.textContent = 'Select a worker from the map';
      dom.workerRole.textContent = '-';
      dom.workerNowTime.textContent = '-';
      dom.workerTimeline.textContent = 'No worker selected yet.';
      dom.upcomingTasks.textContent = 'No worker selected yet.';
      dom.openWorkerDetailsBtn.disabled = true;
      return;
    }

    const status = selectedWorker.status === 'green' || selectedWorker.status === 'yellow' || selectedWorker.status === 'red'
      ? selectedWorker.status
      : 'yellow';

    dom.workerName.textContent = selectedWorker.name;
    dom.workerRole.textContent = `${selectedWorker.role} (${selectedWorker.id})`;
    dom.workerNowTime.textContent = formatClock(nowDate);
    dom.workerStatusBadge.className = `status-pill status-pill--${status}`;
    dom.workerStatusBadge.textContent = STATUS_LABEL[status];
    dom.workerTimeline.innerHTML = renderTimeline(selectedWorker, nowDate);
    dom.upcomingTasks.innerHTML = renderUpcoming(selectedWorker, nowDate);
    dom.openWorkerDetailsBtn.disabled = false;
  }

  function setAttentionAdvisorState({ enabled, reason, loading }) {
    dom.attentionHint.textContent = reason;
    dom.generateSwitchBtn.disabled = !enabled || Boolean(loading);
    dom.generateSwitchBtn.textContent = loading ? 'Generating...' : 'Generate Reassignment Proposal';
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
    dom.generateTaskBtn.textContent = loading ? 'Generating...' : 'Generate Task From Prompt';
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
