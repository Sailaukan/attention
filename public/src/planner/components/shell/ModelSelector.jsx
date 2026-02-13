(() => {
  window.PlannerAppShell = window.PlannerAppShell || {};

  const MODEL_OPTIONS = [
    { value: 'k2think', label: 'K2 Think V2', checked: true },
    { value: 'deepseek-r1', label: 'DeepSeek R1', checked: false }
  ];

  window.PlannerAppShell.ModelSelector = function ModelSelector() {
    return (
      <div className="relative">
        <button
          id="modelSelectorBtn"
          type="button"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span id="selectedModelLabel">K2 Think V2</span>
          <span className="h-4 w-4 text-gray-500">▾</span>
        </button>
        <div
          id="modelSelectorMenu"
          className="absolute bottom-full right-0 z-50 mb-2 hidden w-48 overflow-hidden rounded-xl border border-gray-200 bg-white px-1 py-0.5 shadow-xl"
        >
          <div className="py-1">
            {MODEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                data-model={option.value}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-gray-50"
              >
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };
})();
