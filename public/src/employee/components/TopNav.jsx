const EmployeeProfileApp = window.EmployeeProfileApp || (window.EmployeeProfileApp = {});

EmployeeProfileApp.TopNav = function TopNav() {
  return (
    <div className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-teal-700 to-sky-500 text-sm font-bold text-white">
          A
        </div>
        <span className="text-lg font-semibold text-slate-900">Attention is all you need</span>
      </div>
    </div>
  );
};
