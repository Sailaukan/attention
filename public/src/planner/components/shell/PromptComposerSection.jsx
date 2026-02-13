(() => {
  window.PlannerAppShell = window.PlannerAppShell || {};

  window.PlannerAppShell.PromptComposerSection = function PromptComposerSection() {
    const ModelSelector = window.PlannerAppShell?.ModelSelector;
    if (typeof ModelSelector !== 'function') {
      throw new Error('Planner component ModelSelector is not loaded.');
    }

    return (
      <section className="shrink-0 bg-white/95 px-3 pb-3">
        <div id="taskProgress" className="mb-2 hidden bg-white/90 p-2 text-xs" />
        <div id="generatedTaskProposal" className="mb-2 hidden rounded-xl border bg-white p-3 text-xs">
          <div id="generatedTaskSummary" className="mb-1 text-slate-900" />
          <div id="generatedTaskDetails" className="mb-1 text-slate-900" />
          <div id="generatedTaskRationale" className="text-slate-900" />
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              id="acceptGeneratedTaskBtn"
              type="button"
              className="w-full rounded-lg border-0 bg-slate-800 px-3 py-1 text-sm text-white hover:from-teal-800 hover:to-sky-600"
            >
              Accept Task Change
            </button>
            <button
              id="rejectGeneratedTaskBtn"
              type="button"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 hover:bg-slate-50"
            >
              Reject
            </button>
          </div>
        </div>
        <div className="mx-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-gray-400/15 transition-all duration-500 ease-in-out">
          <div className="relative rounded-lg">
            <div className="flex flex-col space-y-2">
              <div className="relative rounded-lg bg-white/5 p-2">
                <textarea
                  id="taskPromptInput"
                  rows={1}
                  className="w-full resize-none overflow-hidden bg-transparent text-sm outline-none transition-all duration-200 ease-in-out focus:border-transparent focus:outline-none focus:ring-0 focus:ring-transparent focus:shadow-none focus-visible:outline-none sm:text-base"
                  style={{ minHeight: '42px', transition: 'height 200ms ease-in-out' }}
                  placeholder="Example: reduce sun exposure and replace lifting with inspection near shaded corridor."
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div />
                <div className="flex items-center space-x-2">
                  <ModelSelector />
                  <button
                    id="generateTaskBtn"
                    type="button"
                    aria-label="Generate task from prompt"
                    title="Generate task from prompt"
                    className="inline-flex items-center rounded-xl border border-transparent bg-[#433f3a] px-1.5 py-1.5 font-medium text-white transition-colors hover:bg-[#433f3a]/80 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };
})();
