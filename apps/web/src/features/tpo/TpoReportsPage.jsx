import { tpoDashboardData } from "./tpoData";

export function TpoReportsPage() {
  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">TPO Workspace</p>
          <h2>Reports &amp; Export</h2>
          <p className="muted">Generate placement, department-wise, and drive-wise exports without burying them behind other menus.</p>
        </div>
      </header>

      <div className="overview-grid">
        {tpoDashboardData.reports.map((report) => (
          <article className="dashboard-card" key={report.id}>
            <span className="metric-label">{report.format}</span>
            <h3>{report.title}</h3>
            <p className="card-note">{report.note}</p>
            <button className="button section-action" type="button">
              Generate Report
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
