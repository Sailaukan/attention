(() => {
  window.PlannerAppShell = window.PlannerAppShell || {};

  window.PlannerAppShell.WorkerSidebar = function WorkerSidebar() {
    const TimelineSection = window.PlannerAppShell?.TimelineSection;
    const QuickTasksSection = window.PlannerAppShell?.QuickTasksSection;
    const RebalancerSection = window.PlannerAppShell?.RebalancerSection;
    const PromptComposerSection = window.PlannerAppShell?.PromptComposerSection;

    if (typeof TimelineSection !== 'function'
      || typeof QuickTasksSection !== 'function'
      || typeof RebalancerSection !== 'function'
      || typeof PromptComposerSection !== 'function') {
      throw new Error('Planner sidebar sections are not loaded.');
    }

    return (
      <aside
        id="workerCard"
        className="fixed right-0 top-0 z-[1000] flex h-screen w-[min(460px,100vw)] flex-col border-l border-slate-300 bg-white/95 shadow-none backdrop-blur"
      >
        <div className="flex-1 overflow-auto p-4">
          <TimelineSection />
          <QuickTasksSection />
        </div>
        <RebalancerSection />
        <PromptComposerSection />
      </aside>
    );
  };
})();
