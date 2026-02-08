import { findCurrentTask, findUpcomingTasks } from './tasks.mjs';

export function pickInitialWorkerId(workers) {
  const firstRed = workers.find((worker) => worker.status === 'red');
  if (firstRed) {
    return firstRed.id;
  }

  return workers[0]?.id || null;
}

export function buildWorkerContext(worker, nowDate) {
  const currentTask = findCurrentTask(worker.plan, nowDate);
  const upcomingTasks = findUpcomingTasks(worker.plan, nowDate).slice(0, 3);

  return {
    id: worker.id,
    name: worker.name,
    role: worker.role,
    status: worker.status,
    focusLevel: worker.focusLevel,
    energyLevel: worker.energyLevel,
    sunExposure: worker.sunExposure,
    crowdLevel: worker.crowdLevel,
    zone: worker.zone,
    location: {
      lat: Number(worker.position?.[0]),
      lng: Number(worker.position?.[1])
    },
    currentTask,
    upcomingTasks
  };
}
