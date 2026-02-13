(() => {
  window.PlannerAppShell = window.PlannerAppShell || {};

  window.PlannerAppShell.RebalancerSection = function RebalancerSection() {
    return (
      <section id="aiRebalancerSection" className="shrink-0 from-emerald-50 to-sky-50 px-3 pb-2">
        <button
          id="generateSwitchBtn"
          type="button"
          className="mb-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 disabled:cursor-not-allowed disabled:opacity-65"
        >
          Adapt the plan
        </button>
        <div id="switchProgress" className="mb-2 hidden bg-white/90 p-2 text-xs" />
        <div id="switchProposal" className="hidden rounded-xl border bg-white p-3 text-xs">
          <div id="switchSummary" className="mb-1 text-slate-900" />
          <div id="switchAffected" className="mb-1 text-slate-900" />
          <div id="switchRationale" className="text-slate-900" />
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              id="acceptSwitchBtn"
              type="button"
              className="w-full rounded-lg border-0 bg-slate-800 px-3 py-1 text-sm text-white hover:from-teal-800 hover:to-sky-600"
            >
              Accept
            </button>
            <button
              id="rejectSwitchBtn"
              type="button"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 hover:bg-slate-50"
            >
              Reject
            </button>
          </div>
        </div>
      </section>
    );
  };
})();
