export const NYUAD_WORKERS = [
  {
    id: 'W-101',
    name: 'Ahmad N.',
    role: 'Site Engineer',
    status: 'green',
    focusLevel: 'high',
    energyLevel: 'high',
    sunExposure: 'medium',
    crowdLevel: 'medium',
    zone: 'Zone A Spine',
    profileUrl: 'https://example.com/workers/W-101',
    position: [24.52395, 54.4343],
    plan: [
      { start: '07:00', end: '07:30', title: 'Safety briefing', details: 'Lead morning toolbox talk for Zone A crew.', load: 'light', zone: 'Zone A Spine', sunExposure: 'low', crowdLevel: 'medium' },
      { start: '07:30', end: '09:00', title: 'Steel frame alignment', details: 'Verify columns and beam alignment before bolting.', load: 'medium', zone: 'Zone A North', sunExposure: 'medium', crowdLevel: 'high' },
      { start: '09:00', end: '10:30', title: 'Anchor inspection', details: 'Sign off anchor points and hand over to welding team.', load: 'light', zone: 'Zone A North', sunExposure: 'medium', crowdLevel: 'medium' },
      { start: '11:00', end: '13:00', title: 'Progress walkdown', details: 'Record blocked items and update punch log.', load: 'light', zone: 'Zone A Spine', sunExposure: 'low', crowdLevel: 'low' },
      { start: '14:00', end: '16:00', title: 'As-built notes', details: 'Submit updates for structural package.', load: 'light', zone: 'Field Office', sunExposure: 'low', crowdLevel: 'low' }
    ]
  },
  {
    id: 'W-102',
    name: 'Mariam R.',
    role: 'Facade Coordinator',
    status: 'green',
    focusLevel: 'medium',
    energyLevel: 'medium',
    sunExposure: 'medium',
    crowdLevel: 'high',
    zone: 'North Elevation',
    profileUrl: 'https://example.com/workers/W-102',
    position: [24.52325, 54.43478],
    plan: [
      { start: '07:00', end: '08:00', title: 'Panel staging check', details: 'Confirm panel sequence and crane slots.', load: 'light', zone: 'North Yard', sunExposure: 'low', crowdLevel: 'medium' },
      { start: '08:00', end: '10:00', title: 'Facade panel install', details: 'Install north elevation bay 3 and bay 4.', load: 'medium', zone: 'North Elevation', sunExposure: 'high', crowdLevel: 'high' },
      { start: '10:30', end: '12:00', title: 'Sealant quality review', details: 'Inspect joints and weather seals.', load: 'light', zone: 'North Elevation', sunExposure: 'medium', crowdLevel: 'medium' },
      { start: '13:00', end: '14:30', title: 'Vendor coordination', details: 'Resolve late shipment for brackets.', load: 'light', zone: 'Site Office', sunExposure: 'low', crowdLevel: 'low' },
      { start: '15:00', end: '16:30', title: 'Daily handover report', details: 'Share completion status with PMO.', load: 'light', zone: 'Site Office', sunExposure: 'low', crowdLevel: 'low' }
    ]
  },
  {
    id: 'W-103',
    name: 'Yousef K.',
    role: 'Utilities Supervisor',
    status: 'red',
    focusLevel: 'low',
    energyLevel: 'low',
    sunExposure: 'high',
    crowdLevel: 'high',
    zone: 'Trench 2 Corridor',
    profileUrl: 'https://example.com/workers/W-103',
    position: [24.52278, 54.43422],
    plan: [
      { start: '06:30', end: '07:30', title: 'Underground permit review', details: 'Recheck excavation permits for trench 2.', load: 'light', zone: 'Utilities Desk', sunExposure: 'low', crowdLevel: 'low' },
      { start: '07:30', end: '09:30', title: 'Heavy conduit relocation', details: 'Move conduit bundles away from trench crossing.', load: 'heavy', zone: 'Trench 2 Corridor', sunExposure: 'high', crowdLevel: 'high' },
      { start: '10:00', end: '11:30', title: 'Utility clash resolution', details: 'Coordinate reroute for telecom duct conflict.', load: 'medium', zone: 'Trench 2 Corridor', sunExposure: 'high', crowdLevel: 'high' },
      { start: '12:30', end: '14:00', title: 'Inspection with consultant', details: 'Close non-compliance items from last visit.', load: 'light', zone: 'Trench 2 Corridor', sunExposure: 'medium', crowdLevel: 'medium' },
      { start: '14:30', end: '16:30', title: 'Backfill readiness', details: 'Approve readiness before compaction starts.', load: 'medium', zone: 'Trench 2 Corridor', sunExposure: 'high', crowdLevel: 'high' }
    ]
  },
  {
    id: 'W-104',
    name: 'Fatima S.',
    role: 'Concrete QA Lead',
    status: 'green',
    focusLevel: 'high',
    energyLevel: 'high',
    sunExposure: 'low',
    crowdLevel: 'low',
    zone: 'Podium East',
    profileUrl: 'https://example.com/workers/W-104',
    position: [24.52234, 54.43356],
    plan: [
      { start: '07:00', end: '08:00', title: 'Batch plant sampling', details: 'Collect and log morning concrete samples.', load: 'light', zone: 'QA Lab', sunExposure: 'low', crowdLevel: 'low' },
      { start: '08:00', end: '09:30', title: 'Slump and temperature tests', details: 'Run field tests for podium pour.', load: 'light', zone: 'Podium East', sunExposure: 'low', crowdLevel: 'low' },
      { start: '10:00', end: '12:00', title: 'Curing blanket audit', details: 'Check moisture retention and edge coverage.', load: 'light', zone: 'Podium East', sunExposure: 'low', crowdLevel: 'low' },
      { start: '13:00', end: '14:30', title: 'Cube test tracking', details: 'Prepare lab transfer and batch traceability.', load: 'light', zone: 'QA Lab', sunExposure: 'low', crowdLevel: 'low' },
      { start: '15:00', end: '16:00', title: 'Quality summary', details: 'Publish QA dashboard for daily progress.', load: 'light', zone: 'Site Office', sunExposure: 'low', crowdLevel: 'low' }
    ]
  },
  {
    id: 'W-105',
    name: 'Omar H.',
    role: 'Electrical Foreman',
    status: 'green',
    focusLevel: 'medium',
    energyLevel: 'medium',
    sunExposure: 'medium',
    crowdLevel: 'medium',
    zone: 'Block C Corridor',
    profileUrl: 'https://example.com/workers/W-105',
    position: [24.52311, 54.43298],
    plan: [
      { start: '07:00', end: '08:30', title: 'Cable tray prep', details: 'Mark route and mount supports in Block C.', load: 'medium', zone: 'Block C Corridor', sunExposure: 'medium', crowdLevel: 'medium' },
      { start: '08:30', end: '10:30', title: 'Main feeder pulling', details: 'Coordinate pull crew and tension readings.', load: 'heavy', zone: 'Block C Corridor', sunExposure: 'high', crowdLevel: 'high' },
      { start: '11:00', end: '12:30', title: 'Termination checks', details: 'Verify labeling and lug torque values.', load: 'light', zone: 'Switch Room', sunExposure: 'low', crowdLevel: 'low' },
      { start: '13:30', end: '15:00', title: 'Switch room housekeeping', details: 'Clear access and prep for energization test.', load: 'light', zone: 'Switch Room', sunExposure: 'low', crowdLevel: 'low' },
      { start: '15:00', end: '16:30', title: 'Issue log closure', details: 'Close open MEP snag items for Zone C.', load: 'light', zone: 'Site Office', sunExposure: 'low', crowdLevel: 'low' }
    ]
  },
  {
    id: 'W-106',
    name: 'Lina A.',
    role: 'Lifting Operations Lead',
    status: 'green',
    focusLevel: 'low',
    energyLevel: 'low',
    sunExposure: 'high',
    crowdLevel: 'high',
    zone: 'Heavy Lift Lane',
    profileUrl: 'https://example.com/workers/W-106',
    position: [24.52435, 54.43342],
    plan: [
      { start: '06:45', end: '07:30', title: 'Rigging inspection', details: 'Inspect slings, shackles, and spreader bar tags.', load: 'medium', zone: 'Lift Yard', sunExposure: 'medium', crowdLevel: 'medium' },
      { start: '07:30', end: '09:00', title: 'Crane setup validation', details: 'Confirm outriggers and exclusion zones.', load: 'heavy', zone: 'Heavy Lift Lane', sunExposure: 'high', crowdLevel: 'high' },
      { start: '09:30', end: '11:30', title: 'Heavy lift sequence', details: 'Supervise placement of HVAC modules.', load: 'heavy', zone: 'Heavy Lift Lane', sunExposure: 'high', crowdLevel: 'high' },
      { start: '12:30', end: '14:00', title: 'Lift-plan revision', details: 'Update plan after wind-speed restrictions.', load: 'medium', zone: 'Lift Control Cabin', sunExposure: 'low', crowdLevel: 'low' },
      { start: '14:30', end: '16:30', title: 'End-of-day controls', details: 'Lockout and secure lift equipment.', load: 'medium', zone: 'Heavy Lift Lane', sunExposure: 'high', crowdLevel: 'high' }
    ]
  },
  {
    id: 'W-107',
    name: 'Salem Q.',
    role: 'Logistics Coordinator',
    status: 'green',
    focusLevel: 'high',
    energyLevel: 'high',
    sunExposure: 'low',
    crowdLevel: 'medium',
    zone: 'Logistics Gate',
    profileUrl: 'https://example.com/workers/W-107',
    position: [24.52198, 54.43405],
    plan: [
      { start: '07:00', end: '08:00', title: 'Gate schedule sync', details: 'Assign delivery windows to suppliers.', load: 'light', zone: 'Logistics Gate', sunExposure: 'low', crowdLevel: 'medium' },
      { start: '08:00', end: '10:00', title: 'Material receiving', details: 'Check delivery notes and storage zoning.', load: 'medium', zone: 'Logistics Gate', sunExposure: 'low', crowdLevel: 'medium' },
      { start: '10:30', end: '12:00', title: 'Forklift allocation', details: 'Reassign equipment based on priority tasks.', load: 'light', zone: 'Shaded Corridor West', sunExposure: 'low', crowdLevel: 'low' },
      { start: '13:00', end: '14:30', title: 'Stock count update', details: 'Reconcile high-turnover consumables.', load: 'light', zone: 'Warehouse', sunExposure: 'low', crowdLevel: 'low' },
      { start: '15:00', end: '16:30', title: 'Tomorrow readiness', details: 'Prepare procurement list and traffic plan.', load: 'light', zone: 'Logistics Office', sunExposure: 'low', crowdLevel: 'low' }
    ]
  }
];

export function cloneWorkers(workers) {
  return workers.map((worker) => ({
    ...worker,
    position: Array.isArray(worker.position) ? [...worker.position] : worker.position,
    plan: Array.isArray(worker.plan)
      ? worker.plan.map((task) => ({ ...task }))
      : []
  }));
}
