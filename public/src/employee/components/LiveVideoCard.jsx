const EmployeeProfileApp = window.EmployeeProfileApp || (window.EmployeeProfileApp = {});

EmployeeProfileApp.LiveVideoCard = function LiveVideoCard() {
  return (
    <div className="card live-video-card">
      <div className="live-video-frame-wrapper">
        <video
          className="live-video-frame"
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
