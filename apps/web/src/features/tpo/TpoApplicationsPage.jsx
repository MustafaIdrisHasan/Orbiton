import { tpoDashboardData } from "./tpoData";

export function TpoApplicationsPage() {
  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">TPO Workspace</p>
          <h2>Global Application Tracking</h2>
          <p className="muted">Monitor applications per drive, stage drop-off, and the operational speed of the application funnel.</p>
        </div>
      </header>

      <div className="tpo-analytics-grid">
        <article className="dashboard-card">
          <h3>Applications Per Drive</h3>
          <div className="detail-list">
            {tpoDashboardData.applicationFlowAnalytics.applicationsPerDrive.map((item) => (
              <div className="detail-item" key={item.label}>
                <strong>{item.label}</strong>
                <span className="subtle">{item.value} applications</span>
              </div>
            ))}
          </div>
        </article>
        <article className="dashboard-card">
          <h3>Drop-off Per Stage</h3>
          <div className="detail-list">
            {tpoDashboardData.applicationFlowAnalytics.dropOff.map((item) => (
              <div className="detail-item" key={item.stage}>
                <strong>{item.stage}</strong>
                <span className="subtle">{item.value}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="dashboard-card">
          <h3>Time Taken Per Stage</h3>
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
