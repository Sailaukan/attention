const EmployeeProfileApp = window.EmployeeProfileApp || (window.EmployeeProfileApp = {});

EmployeeProfileApp.LiveVideoCard = function LiveVideoCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="w-full min-h-[280px] aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
        <video
          className="h-full w-full"
          src="lifting-cargo-platform-pov.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(event) => {
            if (event.currentTarget.duration > 360) {
              event.currentTarget.currentTime = 360;
            }
          }}
          onEnded={(event) => {
            if (event.currentTarget.duration > 360) {
              event.currentTarget.currentTime = 360;
              event.currentTarget.play().catch(() => {});
            }
          }}
        />
      </div>
    </div>
  );
};
