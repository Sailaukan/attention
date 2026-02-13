const EmployeeProfileApp = window.EmployeeProfileApp || (window.EmployeeProfileApp = {});

EmployeeProfileApp.VideoTrackingCard = function VideoTrackingCard({ data, onEmployeeUpdate }) {
  const inputClass = 'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-teal-300 focus:ring';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-2xl font-semibold text-slate-900">{data.liveTracking.timestamp}</div>
      <div className="mb-5 text-sm text-slate-500">Working on: {data.liveTracking.currentTask}</div>

      <div className="mb-6">
        <div className="mb-2 text-sm text-slate-700">Focus quality: {data.liveTracking.focusLevel}% (good level of focus)</div>
        <div className="h-2 overflow-hidden rounded bg-slate-200">
          <div
            className="h-full rounded bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
            style={{ width: `${data.liveTracking.focusLevel}%` }}
          />
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-medium text-slate-500">Name</label>
        <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">
          {data.employee.name}
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-medium text-slate-500">Position</label>
        <input
          type="text"
          className={inputClass}
          value={data.employee.position}
          onChange={(event) => onEmployeeUpdate('position', event.target.value)}
        />
      </div>

      <div className="mb-5">
        <label className="block text-xs font-medium text-slate-500">Construction Place / Zone</label>
        <input
          type="text"
          className={inputClass}
          value={data.employee.zone}
          onChange={(event) => onEmployeeUpdate('zone', event.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500">Emergency Contact Number</label>
        <input
          type="text"
          className={inputClass}
          value={data.employee.emergencyContact}
          onChange={(event) => onEmployeeUpdate('emergencyContact', event.target.value)}
        />
      </div>
    </div>
  );
};
