const EmployeeProfileApp = window.EmployeeProfileApp || (window.EmployeeProfileApp = {});

EmployeeProfileApp.TopNav = function TopNav() {
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
};
