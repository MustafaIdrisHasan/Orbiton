import { tpoDashboardData } from "./tpoData";

export function TpoAnalyticsPage() {
  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">TPO Workspace</p>
          <h2>Detailed Analytics</h2>
          <p className="muted">Department trends, readiness, and application-flow efficiency in one analytical workspace.</p>
        </div>
      </header>

      <div className="tpo-analytics-grid">
        <article className="dashboard-card">
          <h3>Department-wise Stats</h3>
          <div className="detail-list">
            {tpoDashboardData.departmentStats.map((department) => (
              <div className="detail-item" key={department.department}>
                <strong>{department.department}</strong>
                <span className="subtle">
                  Applicants: {department.applicants} • Selected: {department.selected} • Placement %: {department.placementPercentage}
                </span>
              </div>
            ))}
          </div>
        </article>
        <article className="dashboard-card">
          <h3>Placement Readiness</h3>
          <div className="detail-list">
            {tpoDashboardData.readiness.map((item) => (
              <div className="detail-item" key={item.label}>
                <strong>{item.label}</strong>
                <span className="subtle">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </article>
        <article className="dashboard-card">
          <h3>Flow Efficiency</h3>
          <div className="detail-list">
            {tpoDashboardData.applicationFlowAnalytics.stageTimes.map((item) => (
              <div className="detail-item" key={item.stage}>
                <strong>{item.stage}</strong>
                <span className="subtle">{item.value}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
