(() => {
  window.PlannerAppShell = window.PlannerAppShell || {};

  window.PlannerAppShell.AllPlansSidebar = function AllPlansSidebar() {
    return (
      <div id="allPlansWindow" className="fixed inset-0 z-[1200] hidden bg-transparent">
        <section className="absolute right-0 top-0 h-full w-[min(540px,100vw)] overflow-auto border-l border-slate-300 bg-white p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="m-0 text-sm font-bold uppercase tracking-[0.06em] text-slate-800">All Workers Daily Plan</h2>
            <button
              id="closeAllPlansBtn"
              type="button"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
          <p className="text-sm text-slate-600">
            Combined schedule view for all field workers at MBZUAI in Masdar City at fixed 2:00 PM.
          </p>
          <div id="allPlansContent" className="mt-3 grid gap-2 text-xs">
            No plans loaded.
          </div>
        </section>
      </div>
    );
  };
})();
