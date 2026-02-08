const EmployeeProfileApp = window.EmployeeProfileApp || (window.EmployeeProfileApp = {});

function getMentalState(focusLevel) {
  if (focusLevel >= 75) {
    return 'Focused';
  }

  if (focusLevel >= 50) {
    return 'Moderate';
  }

  return 'Distracted';
}

EmployeeProfileApp.BrainSignalsChart = function BrainSignalsChart({ data }) {
  const points = data.focusTimeSeries;
  const width = 600;
  const height = 400;
  const padding = 40;
  const paddingBottom = 60;
  const maxValue = 100;

  const timeRangeStart = 8;
  const timeRangeEnd = 18;
  const dataEndHour = 15;

  const timeLabels = Array.from(
    { length: timeRangeEnd - timeRangeStart + 1 },
    (_value, index) => timeRangeStart + index
  );

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

          {[0, 25, 50, 75, 100].map((value) => {
            const y = height - paddingBottom - (value * chartHeight / maxValue);
            return (
              <g key={value}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} className="chart-grid" />
                <text x={padding - 10} y={y + 4} className="chart-label" textAnchor="end">
                  {value}%
                </text>
              </g>
            );
          })}

          {points.map((point, index) => {
            const x = padding + index * barWidth + barGap / 2;
            const barHeight = (point / maxValue) * chartHeight;
            const y = height - paddingBottom - barHeight;

            return (
              <rect
                key={index}
                x={x}
                y={y}
                width={actualBarWidth}
                height={barHeight}
                fill="url(#barGradient)"
                className="chart-bar"
              />
            );
          })}

          <line x1={padding} y1={height - paddingBottom} x2={width - padding} y2={height - paddingBottom} className="chart-axis" />
          <line x1={padding} y1={padding} x2={padding} y2={height - paddingBottom} className="chart-axis" />

          {timeLabels.map((hour) => {
            const x = padding + ((hour - timeRangeStart) / totalSpanHours) * chartWidth;
            const label = `${String(hour).padStart(2, '0')}:00`;
            return (
              <g key={label}>
                <line x1={x} y1={height - paddingBottom} x2={x} y2={height - paddingBottom + 5} className="chart-axis" />
                <text x={x} y={height - paddingBottom + 20} className="chart-label" textAnchor="middle">
                  {label}
                </text>
              </g>
            );
          })}

          <text x={width / 2} y={height - 10} className="chart-axis-label" textAnchor="middle">
            Time
          </text>
        </svg>
      </div>
    </div>
  );
};
