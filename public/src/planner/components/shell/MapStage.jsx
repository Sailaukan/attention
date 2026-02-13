(() => {
  window.PlannerAppShell = window.PlannerAppShell || {};

  const { Fragment } = React;
  const MAP_OVERLAY_STYLE = {
    background:
      'radial-gradient(circle at 88% 14%, rgba(13, 148, 136, 0.14) 0, transparent 32%), radial-gradient(circle at 11% 80%, rgba(14, 165, 233, 0.16) 0, transparent 36%)'
  };

  window.PlannerAppShell.ScrollbarStyles = function ScrollbarStyles() {
    return (
      <style>{`
        #taskPromptInput {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        #taskPromptInput::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
      `}</style>
    );
  };

  window.PlannerAppShell.MapStage = function MapStage() {
    return (
      <Fragment>
        <div id="map" className="fixed inset-0 z-[1] h-full w-full" />
        <div className="pointer-events-none fixed inset-0 z-[2]" style={MAP_OVERLAY_STYLE} />
      </Fragment>
    );
  };
})();
