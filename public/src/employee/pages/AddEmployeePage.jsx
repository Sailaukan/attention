const { useState } = React;

const EmployeeProfileApp = window.EmployeeProfileApp || (window.EmployeeProfileApp = {});
const {
  TopNav,
  LiveVideoCard,
  VideoTrackingCard,
  BrainSignalsChart,
  PerformanceAnalysisCard,
  buildInitialDataFromQuery
} = EmployeeProfileApp;

function AddEmployeePage() {
  const [data, setData] = useState(buildInitialDataFromQuery);

  const handleEmployeeUpdate = (field, value) => {
    setData((previousData) => ({
      ...previousData,
      employee: {
        ...previousData.employee,
        [field]: value
      }
    }));
  };

  return (
    <>
      <TopNav />

      <div className="dashboard-container">
        <div className="dashboard-grid add-employee-grid">
          <div className="column-stack">
            <LiveVideoCard />
            <VideoTrackingCard data={data} onEmployeeUpdate={handleEmployeeUpdate} />
          </div>

          <div className="column-stack">
            <BrainSignalsChart data={data} />
            <PerformanceAnalysisCard strengths={data.strengths} weaknesses={data.weaknesses} />
          </div>
        </div>
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AddEmployeePage />);
