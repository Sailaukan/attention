const EmployeeProfileApp = window.EmployeeProfileApp || (window.EmployeeProfileApp = {});

EmployeeProfileApp.VideoTrackingCard = function VideoTrackingCard({ data, onEmployeeUpdate }) {
  return (
    <div className="card">
      <div className="timestamp">{data.liveTracking.timestamp}</div>
      <div className="work-status">Working on: {data.liveTracking.currentTask}</div>

      <div className="focus-indicator">
        <div className="focus-text">Focus quality: {data.liveTracking.focusLevel}% (good level of focus)</div>
        <div className="focus-bar">
          <div className="focus-bar-fill" style={{ width: `${data.liveTracking.focusLevel}%` }} />
        </div>
      </div>

      <div className="profile-field">
        <label>Name</label>
        <div className="profile-identity">
          <div className="profile-field-value">{data.employee.name}</div>
        </div>
      </div>

      <div className="profile-field">
        <label>Position</label>
        <input
          type="text"
          value={data.employee.position}
          onChange={(event) => onEmployeeUpdate('position', event.target.value)}
        />
      </div>

      <div className="profile-field">
        <label>Construction Place / Zone</label>
        <input
          type="text"
          value={data.employee.zone}
          onChange={(event) => onEmployeeUpdate('zone', event.target.value)}
        />
      </div>

      <div className="profile-field">
        <label>Emergency Contact Number</label>
        <input
          type="text"
          value={data.employee.emergencyContact}
          onChange={(event) => onEmployeeUpdate('emergencyContact', event.target.value)}
        />
      </div>
    </div>
  );
};
