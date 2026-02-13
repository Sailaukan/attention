(() => {
  window.PlannerAppShell = window.PlannerAppShell || {};

  window.PlannerAppShell.WorkerInfoModal = function WorkerInfoModal() {
    return (
      <div className="fixed left-3 top-3 z-[1000] grid w-[min(360px,calc(100vw-24px))] gap-2.5 md:left-3.5 md:top-3.5">
        <aside>
          <section className="rounded-xl border border-slate-200 bg-white p-2">
            <div id="workerName" className="text-base font-extrabold text-slate-900">
              Select a worker from the map
            </div>
            <div id="workerRole" className="text-sm text-slate-700">-</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-700">
              <span
                id="workerStatusBadge"
                className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-amber-900"
              >
                Needs Attention
              </span>
              <span>Now:</span>
              <strong id="workerNowTime">-</strong>
            </div>
            <button
              id="openWorkerDetailsBtn"
              type="button"
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
            >
              Open Worker Info Page
            </button>
          </section>

          <section className="mt-2">
            <div id="workerInsights" className="rounded-xl border border-slate-200 bg-white p-2 text-xs">
              No worker selected yet.
            </div>
          </section>
        </aside>
      </div>
    );
  };
})();
