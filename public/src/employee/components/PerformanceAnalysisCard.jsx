const EmployeeProfileApp = window.EmployeeProfileApp || (window.EmployeeProfileApp = {});

EmployeeProfileApp.PerformanceAnalysisCard = function PerformanceAnalysisCard({ strengths, weaknesses }) {
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
};
