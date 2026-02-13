const EmployeeProfileApp = window.EmployeeProfileApp || (window.EmployeeProfileApp = {});

EmployeeProfileApp.PerformanceAnalysisCard = function PerformanceAnalysisCard({ strengths, weaknesses }) {
  function renderTask(task, isWeakness, key) {
    return (
      <div key={key} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2">
        <div className="text-sm text-slate-800">{task.name}</div>
        <div className={isWeakness
          ? 'rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-900'
          : 'rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900'}
        >
          {task.focus}%
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Performance Analysis</div>

      <div className="mb-5">
        <div className="mb-2 text-sm font-semibold text-slate-700">Strengths</div>
        <div className="grid gap-2">
          {strengths.map((task, index) => renderTask(task, false, `s-${index}`))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold text-slate-700">Weaknesses</div>
        <div className="grid gap-2">
          {weaknesses.map((task, index) => renderTask(task, true, `w-${index}`))}
        </div>
      </div>
    </div>
  );
};
