import { getCurrentMinutes, toMinutes } from './time.mjs';

export function getTaskPhaseWithMinutes(task, nowMinutes) {
  const start = toMinutes(task.start);
  const end = toMinutes(task.end);

  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(nowMinutes)) {
    return 'upcoming';
  }

  if (nowMinutes < start) {
    return 'upcoming';
  }

  if (nowMinutes >= end) {
    return 'completed';
  }

  return 'current';
}

export function getTaskPhase(task, nowDate) {
  return getTaskPhaseWithMinutes(task, getCurrentMinutes(nowDate));
}

export function findCurrentTask(plan, nowDate) {
  if (!Array.isArray(plan)) {
    return null;
  }

  const nowMinutes = getCurrentMinutes(nowDate);
  return plan.find((task) => getTaskPhaseWithMinutes(task, nowMinutes) === 'current') || null;
}

export function findUpcomingTasks(plan, nowDate) {
  if (!Array.isArray(plan)) {
    return [];
  }

  const nowMinutes = getCurrentMinutes(nowDate);
  return plan.filter((task) => getTaskPhaseWithMinutes(task, nowMinutes) === 'upcoming');
}

export function replaceCurrentOrNextTask(plan, taskUpdate, nowDate) {
  if (!Array.isArray(plan)) {
    return;
  }

  const targetIndex = plan.findIndex((task) => {
    const phase = getTaskPhase(task, nowDate);
    return phase === 'current' || phase === 'upcoming';
  });

  if (targetIndex >= 0) {
    plan[targetIndex] = {
      ...plan[targetIndex],
      ...taskUpdate
    };
    return;
  }

  plan.push({
    start: taskUpdate.start || '16:00',
    end: taskUpdate.end || '17:00',
    title: taskUpdate.title || 'New task',
    details: taskUpdate.details || '',
    load: taskUpdate.load || 'light',
    zone: taskUpdate.zone || 'General zone',
    sunExposure: taskUpdate.sunExposure || 'low',
    crowdLevel: taskUpdate.crowdLevel || 'low'
  });
}
