const { useState } = React;

// ===============================================
// MOCK DATA
// ===============================================
const MOCK_DATA = {
  employee: {
    name: "Antony Cardenas",
    position: "Construction Worker",
    zone: "Zone A - Building 3",
    emergencyContact: "+1 (555) 123-4567"
  },
  liveTracking: {
    timestamp: "4:55:24",
    currentTask: "Steel beam installation",
    focusLevel: 78
  },
  focusTimeSeries: [
    45, 52, 58, 65, 72, 78, 82, 85, 83, 79, 75, 78, 81, 84, 86,
    83, 80, 78, 75, 72, 68, 65, 70, 75, 78, 82, 85, 88, 86, 82
  ],
  strengths: [
    { name: "Welding metal joints", focus: 85 },
    { name: "Installing rebar frameworks", focus: 78 },
    { name: "Operating concrete mixer", focus: 72 }
  ],
  weaknesses: [
    { name: "Fine tile alignment", focus: 42 },
    { name: "Electrical conduit installation", focus: 38 },
    { name: "Drywall finishing", focus: 45 }
  ],
  recommendations: []
};

function buildInitialDataFromQuery() {
  const query = new URLSearchParams(window.location.search);
  const name = query.get('name');
  const role = query.get('role');
  const zone = query.get('zone');
  const task = query.get('task');

  if (!name && !role && !zone && !task) {
    return MOCK_DATA;
  }

  return {
    ...MOCK_DATA,
    employee: {
      ...MOCK_DATA.employee,
      name: name || MOCK_DATA.employee.name,
      position: role || MOCK_DATA.employee.position,
      zone: zone || MOCK_DATA.employee.zone
    },
    liveTracking: {
      ...MOCK_DATA.liveTracking,
      currentTask: task || MOCK_DATA.liveTracking.currentTask
    }
  };
}

// ===============================================
// LIVE VIDEO CARD COMPONENT
// ===============================================
function LiveVideoCard() {
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
          onLoadedMetadata={(e) => {
            if (e.currentTarget.duration > 360) {
              e.currentTarget.currentTime = 360;
            }
          }}
          onEnded={(e) => {
            if (e.currentTarget.duration > 360) {
              e.currentTarget.currentTime = 360;
              e.currentTarget.play().catch(() => { });
            }
          }}
        />
      </div>
    </div>
  );
}

// ===============================================
// EMPLOYEE TRACKING CARD COMPONENT
// ===============================================
function VideoTrackingCard({ data, onEmployeeUpdate }) {
  return (
    <div className="card">
      <div className="timestamp">{data.liveTracking.timestamp}</div>
      <div className="work-status">Working on: {data.liveTracking.currentTask}</div>

      <div className="focus-indicator">
        <div className="focus-text">
          Focus quality: {data.liveTracking.focusLevel}% (good level of focus)
        </div>
        <div className="focus-bar">
          <div
            className="focus-bar-fill"
            style={{ width: `${data.liveTracking.focusLevel}%` }}
          ></div>
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
          defaultValue={data.employee.position}
          onChange={(e) => onEmployeeUpdate('position', e.target.value)}
        />
      </div>

      <div className="profile-field">
        <label>Construction Place / Zone</label>
        <input
          type="text"
          defaultValue={data.employee.zone}
          onChange={(e) => onEmployeeUpdate('zone', e.target.value)}
        />
      </div>

      <div className="profile-field">
        <label>Emergency Contact Number</label>
        <input
          type="text"
          defaultValue={data.employee.emergencyContact}
          onChange={(e) => onEmployeeUpdate('emergencyContact', e.target.value)}
        />
      </div>
    </div>
  );
}

// ===============================================
// BRAIN SIGNALS CHART COMPONENT
// ===============================================
function BrainSignalsChart({ data }) {
  const points = data.focusTimeSeries;
  const width = 600;
  const height = 400;
  const padding = 40;
  const paddingBottom = 60;
  const maxValue = 100;

  // Determine mental state based on focus level
  const getMentalState = (focusLevel) => {
    if (focusLevel >= 75) return "Focused";
    if (focusLevel >= 50) return "Moderate";
    return "Distracted";
  };

  // Time range: show 08:00 to 18:00, data stops at 15:00
  const timeRangeStart = 8;
  const timeRangeEnd = 18;
  const dataEndHour = 15;

  // Generate time labels (hourly)
  const timeLabels = Array.from(
    { length: timeRangeEnd - timeRangeStart + 1 },
    (_value, index) => timeRangeStart + index
  );

  // Calculate bar dimensions
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding - paddingBottom;
  const totalSpanHours = timeRangeEnd - timeRangeStart;
  const dataSpanHours = dataEndHour - timeRangeStart;
  const dataWidth = (chartWidth * dataSpanHours) / totalSpanHours;
  const barWidth = dataWidth / points.length;
  const barGap = barWidth * 0.2;
  const actualBarWidth = barWidth - barGap;

  return (
    <div className="card">
      <div className="card-title">Mental State</div>
      <div className="card-subtitle">Focus level over time</div>

      <div className="current-focus">{getMentalState(data.liveTracking.focusLevel)}</div>

      <div className="chart-container">
        <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="100%" stopColor="#059669" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((value) => {
            const y = height - paddingBottom - (value * chartHeight / maxValue);
            return (
              <g key={value}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  className="chart-grid"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  className="chart-label"
                  textAnchor="end"
                >
                  {value}%
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {points.map((point, i) => {
            const x = padding + i * barWidth + barGap / 2;
            const barHeight = (point / maxValue) * chartHeight;
            const y = height - paddingBottom - barHeight;

            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={actualBarWidth}
                height={barHeight}
                fill="url(#barGradient)"
                className="chart-bar"
              />
            );
          })}

          {/* X-axis */}
          <line
            x1={padding}
            y1={height - paddingBottom}
            x2={width - padding}
            y2={height - paddingBottom}
            className="chart-axis"
          />

          {/* Y-axis */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - paddingBottom}
            className="chart-axis"
          />

          {/* Time labels on X-axis */}
          {timeLabels.map((hour) => {
            const x = padding + ((hour - timeRangeStart) / totalSpanHours) * chartWidth;
            const label = `${String(hour).padStart(2, '0')}:00`;
            return (
              <g key={label}>
                <line
                  x1={x}
                  y1={height - paddingBottom}
                  x2={x}
                  y2={height - paddingBottom + 5}
                  className="chart-axis"
                />
                <text
                  x={x}
                  y={height - paddingBottom + 20}
                  className="chart-label"
                  textAnchor="middle"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* X-axis label */}
          <text
            x={width / 2}
            y={height - 10}
            className="chart-axis-label"
            textAnchor="middle"
          >
            Time
          </text>
        </svg>
      </div>
    </div>
  );
}

// ===============================================
// TASKS & FOCUS CARD COMPONENT
// ===============================================
function TasksFocusCard({ strengths, weaknesses }) {
  return (
    <div className="card">
      <div className="card-title">Performance Analysis</div>

      <div className="tasks-section">
        <div className="section-title">Strengths</div>
        {strengths.map((task, index) => (
          <div key={index} className="task-item">
            <div className="task-left">
              <div className="task-name">{task.name}</div>
            </div>
            <div className="focus-badge">{task.focus}%</div>
          </div>
        ))}
      </div>

      <div className="tasks-section">
        <div className="section-title">Weaknesses</div>
        {weaknesses.map((task, index) => (
          <div key={index} className="task-item">
            <div className="task-left">
              <div className="task-name">{task.name}</div>
            </div>
            <div className="weakness-badge">{task.focus}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===============================================
// TOP NAV COMPONENT
// ===============================================
function TopNav() {
  return (
    <div className="top-nav">
      <div className="nav-left">
        <div className="logo">
          <div className="logo-icon">A</div>
          <span>Attention is all you need</span>
        </div>
      </div>
    </div>
  );
}

// ===============================================
// MAIN APP COMPONENT
// ===============================================
function App() {
  const [data, setData] = useState(buildInitialDataFromQuery);

  const handleEmployeeUpdate = (field, value) => {
    setData({
      ...data,
      employee: {
        ...data.employee,
        [field]: value
      }
    });
  };

  return (
    <>
      <TopNav />

      <div className="dashboard-container">
        <div className="dashboard-grid add-employee-grid">
          {/* Left Column - Live Video + Employee Tracking */}
          <div className="column-stack">
            <LiveVideoCard />
            <VideoTrackingCard
              data={data}
              onEmployeeUpdate={handleEmployeeUpdate}
            />
          </div>

          {/* Middle Column - Brain Signals + Tasks & Focus */}
          <div className="column-stack">
            <BrainSignalsChart data={data} />
            <TasksFocusCard
              strengths={data.strengths}
              weaknesses={data.weaknesses}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ===============================================
// RENDER APP
// ===============================================
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
