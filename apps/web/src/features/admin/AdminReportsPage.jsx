import { adminDashboardData } from "./adminData";

export function AdminReportsPage() {
  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin Workspace</p>
          <h2>Reports &amp; Data Export</h2>
          <p className="muted">Export user data, placement data, and activity logs in admin-approved formats.</p>
        </div>
      </header>

      <div className="overview-grid">
        {adminDashboardData.reports.map((report) => (
          <article className="dashboard-card" key={report.id}>
            <span className="metric-label">{report.format}</span>
            <h3>{report.title}</h3>
            <p className="card-note">{report.note}</p>
            <button className="button section-action" type="button">
              Export
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
