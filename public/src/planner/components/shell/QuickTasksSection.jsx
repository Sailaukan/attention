(() => {
  window.PlannerAppShell = window.PlannerAppShell || {};

  window.PlannerAppShell.QuickTasksSection = function QuickTasksSection() {
    return (
      <section className="mb-2">
        <div id="workerQuickTasks" className="grid gap-2 rounded-xl border border-slate-200 bg-white p-2 text-xs">
          No worker selected yet.
        </div>
      </section>
    );
  };
})();
