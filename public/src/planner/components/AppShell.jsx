const { Fragment } = React;
const { createRoot } = ReactDOM;

window.PlannerApp = window.PlannerApp || {};
window.PlannerAppShell = window.PlannerAppShell || {};

function requireShellComponent(name) {
  const component = window.PlannerAppShell?.[name];
  if (typeof component !== 'function') {
    throw new Error(`Planner shell component "${name}" is not loaded.`);
  }
  return component;
}

function AppShell() {
  const ScrollbarStyles = requireShellComponent('ScrollbarStyles');
  const MapStage = requireShellComponent('MapStage');
  const WorkerInfoModal = requireShellComponent('WorkerInfoModal');
  const WorkerSidebar = requireShellComponent('WorkerSidebar');
  const AllPlansSidebar = requireShellComponent('AllPlansSidebar');

  return (
    <Fragment>
      <ScrollbarStyles />
      <MapStage />
      <WorkerInfoModal />
      <WorkerSidebar />
      <AllPlansSidebar />
    </Fragment>
  );
}

window.PlannerApp.mountAppShell = function mountAppShell(container) {
  if (!container) {
    throw new Error('Missing app container for planner shell.');
  }

  if (typeof createRoot === 'function') {
    const root = createRoot(container);
    root.render(<AppShell />);
    return root;
  }

  if (typeof ReactDOM.render === 'function') {
    ReactDOM.render(<AppShell />, container);
    return {
      render(nextNode) {
        ReactDOM.render(nextNode, container);
      }
    };
  }

  throw new Error('ReactDOM root API is unavailable.');
};
