(() => {
  window.PlannerAppShell = window.PlannerAppShell || {};

  window.PlannerAppShell.TimelineSection = function TimelineSection() {
    return (
      <section className="mb-2">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">Today&apos;s Timeline</h3>
          <div className="flex items-center gap-2">
            <button
              id="openAllPlansBtn"
              type="button"
              className="rounded-md border-0 bg-slate-700 px-2.5 py-1 text-[11px] font-extrabold text-white hover:from-teal-800 hover:to-sky-600"
            >
              Show plans
            </button>
            <button
              id="fullPlanToggleBtn"
              type="button"
              disabled
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-65"
            >
              Full Plan
            </button>
          </div>
        </div>
        <div id="workerTimeline" className="hidden grid gap-2 rounded-xl border border-slate-200 bg-white p-2 text-xs">
          No worker selected yet.
        </div>
      </section>
    );
  };
})();
