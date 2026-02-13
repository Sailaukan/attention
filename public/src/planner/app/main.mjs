import {
  getRuntimeConfig,
  fetchBuildingFeatures,
  requestAttentionSwitchProposal,
  requestPromptTaskProposal
} from '../api/client.mjs';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM
} from '../config/constants.mjs';
import { NYUAD_WORKERS, cloneWorkers } from '../data/workers.mjs';
import { buildWorkerContext, pickInitialWorkerId } from '../domain/workers.mjs';
import { findCurrentTask, replaceCurrentOrNextTask } from '../domain/tasks.mjs';
import { getFixedNow } from '../domain/time.mjs';
import { ShadeController } from '../map/shadeController.mjs';
import { WorkerOverlay } from '../map/workerOverlay.mjs';
import { getDomRefs } from '../ui/domRefs.mjs';
import { createUiController } from '../ui/controller.mjs';

const appRoot = document.getElementById('app');

if (!appRoot) {
  throw new Error('Missing #app root container.');
}

waitForAppShellAndStart();

function waitForAppShellAndStart(attempt = 0) {
  const mountAppShell = window.PlannerApp?.mountAppShell;

  if (typeof mountAppShell === 'function') {
    mountAppShell(appRoot);
    requestAnimationFrame(() => startWhenDomReady());
    return;
  }

  if (attempt >= 120) {
    appRoot.innerHTML = '<div style="padding:16px;font-family:Manrope,sans-serif;color:#7f1d1d;background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;margin:16px;">Planner shell failed to load. Hard refresh the page and check browser console.</div>';
    return;
  }

  requestAnimationFrame(() => waitForAppShellAndStart(attempt + 1));
}

function startWhenDomReady(attempt = 0) {
  const dom = getDomRefs();
  if (!document.getElementById('map')) {
    if (attempt < 5) {
      requestAnimationFrame(() => startWhenDomReady(attempt + 1));
      return;
    }

    throw new Error('App shell did not mount all required elements.');
  }

  startApp(dom);
}

function startApp(dom) {
  const ui = createUiController(dom);
  const state = {
    workers: cloneWorkers(NYUAD_WORKERS),
    selectedWorkerId: null,
    switchProposal: null,
    generatedTaskProposal: null,
    selectedModel: 'k2think',
    groqEnabled: false,
    shadeEnabled: false
  };

  const map = L.map('map', { zoomControl: false }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  const shadeController = new ShadeController({
    map,
    apiClient: { fetchBuildingFeatures },
    onStatus: (message) => ui.setStatus(message)
  });

  const workerOverlay = new WorkerOverlay(map, {
    workers: state.workers,
    onSelect: (workerId) => {
      state.selectedWorkerId = workerId;
      state.switchProposal = null;
      renderUi();
      ui.setStatus(`Selected ${getSelectedWorker()?.name || 'worker'}.`);
    }
  });

  workerOverlay.render({ focus: true });
  state.selectedWorkerId = pickInitialWorkerId(state.workers);
  renderUi();

  wireEvents();
  void bootstrap();

  async function bootstrap() {
    try {
      const runtimeConfig = await getRuntimeConfig();
      state.groqEnabled = Boolean(runtimeConfig?.groqEnabled);
      state.shadeEnabled = await shadeController.init(runtimeConfig, getFixedNow());
      renderUi();

      if (state.groqEnabled) {
        if (state.shadeEnabled) {
          ui.setStatus('Worker board ready. Shadow simulation is active. Red workers can receive AI reassignment proposals.');
        } else {
          ui.setStatus('Worker board ready. Set SHADEMAP_API_KEY to enable map shadows. Red workers can receive AI reassignment proposals.');
        }
      } else {
        if (state.shadeEnabled) {
          ui.setStatus('Worker board ready. Shadow simulation is active. Set GROQ_API_KEY on server to enable AI proposals.');
        } else {
          ui.setStatus('Worker board ready. Set SHADEMAP_API_KEY for shadows and GROQ_API_KEY for AI proposals.');
        }
      }
    } catch (error) {
      ui.setStatus(error.message || 'Failed to load runtime config.', true);
    }
  }

  function wireEvents() {
    dom.openAllPlansBtn.addEventListener('click', () => {
      ui.renderAllPlans(state.workers, getFixedNow());
      ui.toggleAllPlans(true);
    });

    dom.closeAllPlansBtn.addEventListener('click', () => {
      ui.toggleAllPlans(false);
    });

    dom.allPlansWindow.addEventListener('click', (event) => {
      if (event.target === dom.allPlansWindow) {
        ui.toggleAllPlans(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        ui.toggleAllPlans(false);
        dom.modelSelectorMenu?.classList.add('hidden');
      }
    });

    document.addEventListener('click', (event) => {
      if (!dom.modelSelectorMenu || !dom.modelSelectorBtn) {
        return;
      }

      const target = event.target;
      if (!target) {
        return;
      }

      if (dom.modelSelectorMenu.contains(target) || dom.modelSelectorBtn.contains(target)) {
        return;
      }

      dom.modelSelectorMenu.classList.add('hidden');
    });

    dom.generateSwitchBtn.addEventListener('click', () => {
      void generateSwitchProposal();
    });

    dom.acceptSwitchBtn.addEventListener('click', () => {
      acceptSwitchProposal();
    });

    dom.rejectSwitchBtn.addEventListener('click', () => {
      rejectSwitchProposal();
    });

    dom.generateTaskBtn.addEventListener('click', () => {
      void generatePromptTask();
    });

    dom.taskPromptInput.addEventListener('input', () => {
      syncPromptInputSize();
    });

    dom.modelSelectorBtn?.addEventListener('click', () => {
      if (dom.modelSelectorBtn.disabled) {
        return;
      }

      dom.modelSelectorMenu?.classList.toggle('hidden');
    });

    dom.modelSelectorMenu?.addEventListener('click', (event) => {
      const option = event.target?.closest?.('[data-model]');
      if (!option) {
        return;
      }

      const nextModel = String(option.getAttribute('data-model') || '').trim();
      if (!nextModel) {
        return;
      }

      state.selectedModel = nextModel;
      syncSelectedModelUi();
      dom.modelSelectorMenu.classList.add('hidden');
    });

    dom.fullPlanToggleBtn.addEventListener('click', () => {
      ui.toggleFullPlan();
    });

    dom.acceptGeneratedTaskBtn.addEventListener('click', () => {
      acceptGeneratedTask();
    });

    dom.rejectGeneratedTaskBtn.addEventListener('click', () => {
      rejectGeneratedTask();
    });

    dom.openWorkerDetailsBtn.addEventListener('click', () => {
      openWorkerDetails();
    });

    syncPromptInputSize();
  }

  function renderUi() {
    const now = getFixedNow();
    const selectedWorker = getSelectedWorker();
    const workerNameById = Object.fromEntries(state.workers.map((worker) => [worker.id, worker.name]));
    const aiEnabled = state.groqEnabled;

    ui.setSelectedWorker(selectedWorker, now);
    ui.renderAllPlans(state.workers, now);

    const isRedWorker = selectedWorker?.status === 'red';
    ui.setAttentionSectionVisible(isRedWorker);
    const availabilityReason = !aiEnabled
      ? 'AI features are disabled until GROQ_API_KEY is configured on the server.'
      : (isRedWorker
        ? 'This worker is losing focus. AI proposes safer two-worker swaps with lighter load and lower exposure.'
        : 'AI reassignment appears only for red workers who are losing focus.');

    ui.setAttentionAdvisorState({
      enabled: Boolean(isRedWorker && aiEnabled),
      loading: false,
      reason: availabilityReason
    });

    dom.taskPromptInput.disabled = !aiEnabled;
    if (dom.modelSelectorBtn) {
      dom.modelSelectorBtn.disabled = !aiEnabled;
    }
    dom.generateTaskBtn.disabled = !aiEnabled;
    dom.generateTaskBtn.textContent = '→';
    dom.generateTaskBtn.setAttribute('aria-label', aiEnabled ? 'Generate task from prompt' : 'Groq key required');
    dom.generateTaskBtn.setAttribute('title', aiEnabled ? 'Generate task from prompt' : 'Groq key required');

    if (state.switchProposal && isRedWorker && state.switchProposal.redWorkerId === selectedWorker.id) {
      ui.setSwitchProposal(state.switchProposal, workerNameById);
    } else {
      ui.setSwitchProgress([]);
      ui.clearSwitchProposal();
      state.switchProposal = null;
    }

    if (state.generatedTaskProposal && state.generatedTaskProposal.workerId === selectedWorker?.id) {
      ui.setGeneratedTaskProposal(state.generatedTaskProposal);
    } else {
      ui.setTaskProgress([]);
      ui.clearGeneratedTaskProposal();
      state.generatedTaskProposal = null;
    }

    syncSelectedModelUi();
    syncPromptInputSize();
  }

  async function generateSwitchProposal() {
    if (!state.groqEnabled) {
      ui.setStatus('GROQ_API_KEY is required to generate AI reassignment proposals.', true);
      return;
    }

    const selectedWorker = getSelectedWorker();
    if (!selectedWorker) {
      ui.setStatus('Select a worker first.', true);
      return;
    }

    if (selectedWorker.status !== 'red') {
      ui.setStatus('AI reassignment is available only for red workers.', true);
      return;
    }

    const candidateWorkers = state.workers.filter((worker) => worker.status === 'green' && worker.id !== selectedWorker.id);
    if (!candidateWorkers.length) {
      ui.setStatus('No green worker available for safe reassignment right now.', true);
      return;
    }

    ui.setAttentionAdvisorState({
      enabled: true,
      loading: true,
      reason: 'Analyzing worker risk, location, sunlight, and crowd profile...'
    });

    const progressLines = [];

    try {
      progressLines.push('1/4 Collecting worker context and current timeline.');
      ui.setSwitchProgress(progressLines);
      await pause(160);

      progressLines.push('2/4 Comparing nearby green workers for safe swap.');
      ui.setSwitchProgress(progressLines);
      await pause(160);

      progressLines.push('3/4 Calling Groq model for reassignment decision.');
      ui.setSwitchProgress(progressLines);

      const now = getFixedNow();
      const proposal = await requestAttentionSwitchProposal({
        siteName: 'MBZUAI campus, Masdar City',
        nowIso: now.toISOString(),
        redWorker: buildWorkerContext(selectedWorker, now),
        candidateWorkers: candidateWorkers.map((worker) => buildWorkerContext(worker, now))
      });

      progressLines.push('4/4 Preparing final impact summary (2 workers affected).');
      ui.setSwitchProgress(progressLines);

      state.switchProposal = proposal;
      ui.setSwitchProposal(proposal, Object.fromEntries(state.workers.map((worker) => [worker.id, worker.name])));
      ui.setStatus('AI reassignment proposal is ready. Review and accept/reject.');
    } catch (error) {
      ui.setStatus(error.message || 'Failed to generate reassignment proposal.', true);
    } finally {
      const latestWorker = getSelectedWorker();
      ui.setAttentionAdvisorState({
        enabled: Boolean(latestWorker?.status === 'red' && state.groqEnabled),
        loading: false,
        reason: !state.groqEnabled
          ? 'AI features are disabled until GROQ_API_KEY is configured on the server.'
          : (latestWorker?.status === 'red'
            ? 'This red worker is losing focus. AI proposes safer two-worker swaps with lighter load and lower exposure.'
            : 'AI reassignment appears only for red workers who are losing focus.')
      });
    }
  }

  function acceptSwitchProposal() {
    const selectedWorker = getSelectedWorker();
    const proposal = state.switchProposal;

    if (!selectedWorker || !proposal) {
      ui.setStatus('No reassignment proposal to accept.', true);
      return;
    }

    const now = getFixedNow();
    state.workers = state.workers.map((worker) => {
      const update = proposal.workerUpdates.find((item) => item.workerId === worker.id);
      const affected = proposal.affectedWorkerIds.includes(worker.id);
      if (!update && !affected) {
        return worker;
      }

      const nextWorker = {
        ...worker,
        status: 'yellow',
        focusLevel: 'medium',
        energyLevel: worker.energyLevel === 'low' ? 'medium' : worker.energyLevel,
        plan: Array.isArray(worker.plan) ? worker.plan.map((task) => ({ ...task })) : []
      };

      if (update?.task) {
        replaceCurrentOrNextTask(nextWorker.plan, update.task, now);
      }

      return nextWorker;
    });

    workerOverlay.setWorkers(state.workers);
    workerOverlay.render({ focus: false });

    state.switchProposal = null;
    ui.setSwitchProgress([]);
    ui.clearSwitchProposal();
    renderUi();
    ui.setStatus('Plan accepted. Both involved workers are now yellow because they switched tasks.');
  }

  function rejectSwitchProposal() {
    if (!state.switchProposal) {
      return;
    }

    state.switchProposal = null;
    ui.setSwitchProgress([]);
    ui.clearSwitchProposal();
    ui.setStatus('Reassignment proposal rejected.');
  }

  async function generatePromptTask() {
    if (!state.groqEnabled) {
      ui.setStatus('GROQ_API_KEY is required to generate prompt-based tasks.', true);
      return;
    }

    const selectedWorker = getSelectedWorker();
    const prompt = dom.taskPromptInput.value.trim();

    if (!selectedWorker) {
      ui.setStatus('Select a worker first.', true);
      return;
    }

    if (!prompt) {
      ui.setStatus('Enter a prompt to generate a new task.', true);
      return;
    }

    ui.setTaskPromptLoading(true);
    const progressLines = [];

    try {
      progressLines.push('1/4 Reading your prompt and fixed-time worker context.');
      ui.setTaskProgress(progressLines);
      await pause(160);

      progressLines.push('2/4 Applying location/sun/crowd constraints.');
      ui.setTaskProgress(progressLines);
      await pause(160);

      progressLines.push('3/4 Calling Groq model to generate an updated task.');
      ui.setTaskProgress(progressLines);

      const now = getFixedNow();
      const proposal = await requestPromptTaskProposal({
        nowIso: now.toISOString(),
        prompt,
        model: state.selectedModel,
        worker: buildWorkerContext(selectedWorker, now)
      });

      progressLines.push('4/4 Formatting final proposal for approval.');
      ui.setTaskProgress(progressLines);

      state.generatedTaskProposal = proposal;
      ui.setGeneratedTaskProposal(proposal);
      ui.setStatus('Prompt-based task proposal is ready. Review and accept/reject.');
    } catch (error) {
      ui.setStatus(error.message || 'Prompt-based task generation failed.', true);
    } finally {
      ui.setTaskPromptLoading(false);
    }
  }

  function acceptGeneratedTask() {
    const selectedWorker = getSelectedWorker();
    const proposal = state.generatedTaskProposal;

    if (!selectedWorker || !proposal || proposal.workerId !== selectedWorker.id) {
      ui.setStatus('No generated task proposal available for this worker.', true);
      return;
    }

    const now = getFixedNow();
    state.workers = state.workers.map((worker) => {
      if (worker.id !== selectedWorker.id) {
        return worker;
      }

      const nextWorker = {
        ...worker,
        plan: Array.isArray(worker.plan) ? worker.plan.map((task) => ({ ...task })) : []
      };

      replaceCurrentOrNextTask(nextWorker.plan, proposal.task, now);
      return nextWorker;
    });

    workerOverlay.setWorkers(state.workers);
    workerOverlay.render({ focus: false });

    state.generatedTaskProposal = null;
    dom.taskPromptInput.value = '';
    syncPromptInputSize();
    ui.setTaskProgress([]);
    ui.clearGeneratedTaskProposal();
    renderUi();
    ui.setStatus('Generated task accepted and applied to worker timeline.');
  }

  function rejectGeneratedTask() {
    if (!state.generatedTaskProposal) {
      return;
    }

    state.generatedTaskProposal = null;
    ui.setTaskProgress([]);
    ui.clearGeneratedTaskProposal();
    ui.setStatus('Generated task proposal rejected.');
  }

  function openWorkerDetails() {
    const selectedWorker = getSelectedWorker();
    if (!selectedWorker) {
      ui.setStatus('Select a worker to open detailed information.', true);
      return;
    }

    try {
      const now = getFixedNow();
      const currentTask = findCurrentTask(selectedWorker.plan, now);
      const params = new URLSearchParams({
        workerId: selectedWorker.id,
        name: selectedWorker.name,
        role: selectedWorker.role || '',
        zone: selectedWorker.zone || '',
        status: selectedWorker.status || ''
      });

      if (currentTask?.title) {
        params.set('task', currentTask.title);
      }

      const detailsPath = `/add_new_employee.html?${params.toString()}`;
      const popup = window.open(detailsPath, '_blank', 'noopener,noreferrer');
      if (!popup) {
        window.location.assign(detailsPath);
      }

      ui.setStatus(`Opened detailed page for ${selectedWorker.name}.`);
    } catch (_error) {
      ui.setStatus('Unable to open worker details page from this browser context.', true);
    }
  }

  function getSelectedWorker() {
    return state.workers.find((worker) => worker.id === state.selectedWorkerId) || null;
  }

  function syncSelectedModelUi() {
    const nameByModel = {
      k2think: 'K2 Think V2',
      'deepseek-r1': 'DeepSeek R1'
    };

    if (dom.selectedModelLabel) {
      dom.selectedModelLabel.textContent = nameByModel[state.selectedModel] || state.selectedModel;
    }

    const checks = document.querySelectorAll('[data-model-check]');
    checks.forEach((node) => {
      const model = node.getAttribute('data-model-check');
      node.classList.toggle('hidden', model !== state.selectedModel);
    });
  }

  function syncPromptInputSize() {
    const textarea = dom.taskPromptInput;
    if (!textarea) {
      return;
    }

    const computed = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(computed.lineHeight) || 22;
    const paddingTop = Number.parseFloat(computed.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(computed.paddingBottom) || 0;
    const borderTop = Number.parseFloat(computed.borderTopWidth) || 0;
    const borderBottom = Number.parseFloat(computed.borderBottomWidth) || 0;

    const minHeight = lineHeight + paddingTop + paddingBottom + borderTop + borderBottom;
    const maxHeight = (lineHeight * 4) + paddingTop + paddingBottom + borderTop + borderBottom;

    textarea.style.height = 'auto';
    const nextHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }
}

function pause(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
