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

      <div className="mx-auto max-w-[1400px] p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_9fr]">
          <div className="flex flex-col gap-6">
            <LiveVideoCard />
            <VideoTrackingCard data={data} onEmployeeUpdate={handleEmployeeUpdate} />
          </div>

          <div className="flex flex-col gap-6">
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
