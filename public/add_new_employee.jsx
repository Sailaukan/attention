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
  recommendations: [
    {
      id: 1,
      taskName: "Steel frame assembly",
      reason: "High focus during welding and metal work. Strong performance with structural components.",
      confidence: 89
    },
    {
      id: 2,
      taskName: "Foundation reinforcement",
      reason: "Excellent concentration when working with rebar and concrete. Consistent quality output.",
      confidence: 84
    },
    {
      id: 3,
      taskName: "Heavy equipment operation",
      reason: "Good focus on machinery tasks. Maintains attention during repetitive work.",
      confidence: 76
    }
  ]
};

// ===============================================
// VIDEO TRACKING CARD COMPONENT
// ===============================================
function VideoTrackingCard({ data, onEmployeeUpdate }) {
  return (
    <div className="card">
      <div className="video-container">
        <div className="video-label">Live activity tracking (placeholder)</div>
        <div className="play-button">
          <div className="play-icon"></div>
        </div>
        <div className="timeline-scrubber">
          <div className="timeline-progress"></div>
        </div>
      </div>

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
        <div className="profile-field-value">{data.employee.name}</div>
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
// ASSIGN TASK MODAL COMPONENT
// ===============================================
function AssignTaskModal({ task, employeeName, onClose, onConfirm }) {
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ ...task, ...formData });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Assign Task</div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Task Name</label>
            <input type="text" value={task.taskName} readOnly />
          </div>

          <div className="form-field">
            <label>Assign To</label>
            <input type="text" value={employeeName} readOnly />
          </div>

          <div className="form-field">
            <label>Start Date</label>
            <input 
              type="date" 
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label>Start Time</label>
            <input 
              type="time" 
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label>Notes (Optional)</label>
            <textarea 
              placeholder="Add any additional instructions..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn modal-btn-primary">
              Confirm Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===============================================
// AI RECOMMENDATIONS COMPONENT
// ===============================================
function AIRecommendations({ recommendations, onAssignTask }) {
  const [showRecommendations, setShowRecommendations] = useState(false);

  return (
    <div className="card ai-card">
      <div className="ai-header">
        <div className="ai-logo">
          <div className="logo-icon">AI</div>
          <span>Cognitive Intelligence</span>
        </div>
        <div className="ai-badge">Premium</div>
      </div>

      <div className="ai-title">AI Recommendations</div>
      <div className="ai-description">
        Suggested task assignments based on focus patterns, task history, and cognitive load.
      </div>

      {!showRecommendations ? (
        <button 
          className="generate-btn"
          onClick={() => setShowRecommendations(true)}
        >
          Generate recommendations
        </button>
      ) : (
        <div className="recommendations-grid">
          {recommendations.map((rec) => (
            <div key={rec.id} className="recommendation-card">
              <div className="rec-task-name">{rec.taskName}</div>
              <div className="rec-reason">{rec.reason}</div>
              <div className="rec-confidence">Confidence: {rec.confidence}%</div>
              <button 
                className="assign-btn"
                onClick={() => onAssignTask(rec)}
              >
                Assign task
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===============================================
// TOAST NOTIFICATION COMPONENT
// ===============================================
function Toast({ message, show }) {
  if (!show) return null;
  return <div className="toast">{message}</div>;
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
  const [data, setData] = useState(MOCK_DATA);
  const [modalTask, setModalTask] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '' });

  const handleEmployeeUpdate = (field, value) => {
    setData({
      ...data,
      employee: {
        ...data.employee,
        [field]: value
      }
    });
  };

  const handleAssignTask = (task) => {
    setModalTask(task);
  };

  const handleConfirmAssignment = (taskData) => {
    // Close modal
    setModalTask(null);

    // Show toast
    setToast({
      show: true,
      message: `Task assigned to ${data.employee.name}`
    });

    // Hide toast after 3 seconds
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  };

  return (
    <>
      <TopNav />
      
      <div className="dashboard-container">
        <div className="dashboard-grid">
          {/* Left Column - Video Tracking */}
          <VideoTrackingCard 
            data={data} 
            onEmployeeUpdate={handleEmployeeUpdate}
          />

          {/* Middle Column - Brain Signals */}
          <BrainSignalsChart data={data} />

          {/* Right Column - Tasks & Focus */}
          <TasksFocusCard 
            strengths={data.strengths}
            weaknesses={data.weaknesses}
          />

          {/* Bottom Section - AI Recommendations */}
          <AIRecommendations 
            recommendations={data.recommendations}
            onAssignTask={handleAssignTask}
          />
        </div>
      </div>

      {/* Modal */}
      {modalTask && (
        <AssignTaskModal
          task={modalTask}
          employeeName={data.employee.name}
          onClose={() => setModalTask(null)}
          onConfirm={handleConfirmAssignment}
        />
      )}

      {/* Toast */}
      <Toast message={toast.message} show={toast.show} />
    </>
  );
}

// ===============================================
// RENDER APP
// ===============================================
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
