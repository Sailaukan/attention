import React from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';

const e = React.createElement;

function AppShell() {
  return e(
    React.Fragment,
    null,
    e('div', { id: 'map' }),
    e('div', { className: 'map-glow' }),

    e(
      'aside',
      { className: 'card plans-launcher-card' },
      e('h2', null, 'Plans Hub'),
      e('p', null, 'Open the combined schedule window for all workers.'),
      e('button', { id: 'openAllPlansBtn', type: 'button', className: 'primary' }, 'Show All Plans')
    ),

    e(
      'aside',
      { className: 'card worker-card' },
      e(
        'header',
        { className: 'card-head stack' },
        e('h1', null, 'NYUAD Worker Board'),
        e('p', null, 'Planner time is fixed at 2:00 PM for consistent testing.'),
        e('span', { className: 'pill fixed-pill' }, 'Fixed Time: 2:00 PM')
      ),
      e('div', { id: 'status', className: 'status' }, 'Loading worker planner...'),

      e(
        'section',
        { className: 'worker-profile box' },
        e('div', { id: 'workerName', className: 'worker-name' }, 'Select a worker from the map'),
        e('div', { id: 'workerRole', className: 'worker-role' }, '-'),
        e(
          'div',
          { className: 'worker-meta' },
          e('span', { id: 'workerStatusBadge', className: 'status-pill status-pill--yellow' }, 'Needs Attention'),
          e('span', null, 'Now: '),
          e('strong', { id: 'workerNowTime' }, '-')
        ),
        e('button', { id: 'openWorkerDetailsBtn', type: 'button', className: 'ghost worker-info-btn' }, 'Open Worker Info Page')
      ),

      e('section', null, e('h3', null, "Today's Timeline"), e('div', { id: 'workerTimeline', className: 'box timeline-box' }, 'No worker selected yet.')),

      e('section', null, e('h3', null, 'Upcoming Tasks'), e('div', { id: 'upcomingTasks', className: 'box' }, 'No worker selected yet.')),

      e(
        'section',
        { className: 'ai-rebalancer box' },
        e('h3', null, 'AI Focus Rebalancer'),
        e('p', { className: 'ai-intro' }, 'For red workers, AI proposes a safer two-worker swap with lighter load, lower sun exposure, and lower crowd risk.'),
        e('div', { id: 'attentionHint', className: 'ai-hint' }, 'Select a red worker to request an AI reassignment proposal.'),
        e('button', { id: 'generateSwitchBtn', type: 'button', className: 'primary ai-main-btn', disabled: true }, 'Generate Reassignment Proposal'),
        e('div', { id: 'switchProgress', className: 'ai-progress hidden' }, ''),
        e(
          'div',
          { id: 'switchProposal', className: 'ai-proposal hidden' },
          e('div', { id: 'switchSummary', className: 'ai-proposal-row' }, ''),
          e('div', { id: 'switchAffected', className: 'ai-proposal-row' }, ''),
          e('div', { id: 'switchRationale', className: 'ai-proposal-row' }, ''),
          e(
            'div',
            { className: 'decision-row' },
            e('button', { id: 'acceptSwitchBtn', type: 'button', className: 'primary decision-btn' }, 'Accept Reassignment'),
            e('button', { id: 'rejectSwitchBtn', type: 'button', className: 'ghost decision-btn' }, 'Reject')
          )
        )
      ),

      e(
        'section',
        null,
        e('h3', null, 'Prompt-Based Task Edit'),
        e('textarea', {
          id: 'taskPromptInput',
          className: 'task-prompt',
          rows: 3,
          placeholder: 'Example: reduce sun exposure and replace lifting with inspection near shaded corridor.'
        }),
        e('button', { id: 'generateTaskBtn', type: 'button', className: 'primary' }, 'Generate Task From Prompt'),
        e('div', { id: 'taskProgress', className: 'box hidden' }, ''),
        e(
          'div',
          { id: 'generatedTaskProposal', className: 'box hidden' },
          e('div', { id: 'generatedTaskSummary' }, ''),
          e('div', { id: 'generatedTaskDetails' }, ''),
          e('div', { id: 'generatedTaskRationale' }, ''),
          e(
            'div',
            { className: 'decision-row' },
            e('button', { id: 'acceptGeneratedTaskBtn', type: 'button', className: 'primary decision-btn' }, 'Accept Task Change'),
            e('button', { id: 'rejectGeneratedTaskBtn', type: 'button', className: 'ghost decision-btn' }, 'Reject')
          )
        )
      )
    ),

    e(
      'div',
      { id: 'allPlansWindow', className: 'all-plans-window hidden' },
      e(
        'section',
        { className: 'all-plans-card' },
        e(
          'div',
          { className: 'card-head' },
          e('h2', null, 'All Workers Daily Plan'),
          e('button', { id: 'closeAllPlansBtn', type: 'button', className: 'ghost' }, 'Close')
        ),
        e('p', null, 'Combined schedule view for all field workers at NYU Abu Dhabi at fixed 2:00 PM.'),
        e('div', { id: 'allPlansContent', className: 'all-plans-content' }, 'No plans loaded.')
      )
    )
  );
}

export function mountAppShell(container) {
  const root = createRoot(container);
  root.render(e(AppShell));
  return root;
}
