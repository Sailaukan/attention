window.EmployeeProfileApp = window.EmployeeProfileApp || {};

window.EmployeeProfileApp.MOCK_DATA = {
  employee: {
    name: 'Antony Cardenas',
    position: 'Construction Worker',
    zone: 'Zone A - Building 3',
    emergencyContact: '+1 (555) 123-4567'
  },
  liveTracking: {
    timestamp: '4:55:24',
    currentTask: 'Steel beam installation',
    focusLevel: 78
  },
  focusTimeSeries: [
    45, 52, 58, 65, 72, 78, 82, 85, 83, 79, 75, 78, 81, 84, 86,
    83, 80, 78, 75, 72, 68, 65, 70, 75, 78, 82, 85, 88, 86, 82
  ],
  strengths: [
    { name: 'Welding metal joints', focus: 85 },
    { name: 'Installing rebar frameworks', focus: 78 },
    { name: 'Operating concrete mixer', focus: 72 }
  ],
  weaknesses: [
    { name: 'Fine tile alignment', focus: 42 },
    { name: 'Electrical conduit installation', focus: 38 },
    { name: 'Drywall finishing', focus: 45 }
  ],
  recommendations: []
};

window.EmployeeProfileApp.buildInitialDataFromQuery = function buildInitialDataFromQuery() {
  const query = new URLSearchParams(window.location.search);
  const name = query.get('name');
  const role = query.get('role');
  const zone = query.get('zone');
  const task = query.get('task');

  if (!name && !role && !zone && !task) {
    return window.EmployeeProfileApp.MOCK_DATA;
  }

  return {
    ...window.EmployeeProfileApp.MOCK_DATA,
    employee: {
      ...window.EmployeeProfileApp.MOCK_DATA.employee,
      name: name || window.EmployeeProfileApp.MOCK_DATA.employee.name,
      position: role || window.EmployeeProfileApp.MOCK_DATA.employee.position,
      zone: zone || window.EmployeeProfileApp.MOCK_DATA.employee.zone
    },
    liveTracking: {
      ...window.EmployeeProfileApp.MOCK_DATA.liveTracking,
      currentTask: task || window.EmployeeProfileApp.MOCK_DATA.liveTracking.currentTask
    }
  };
};
