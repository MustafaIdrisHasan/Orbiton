import { tpoDashboardData } from "./tpoData";

export function TpoOffersPage() {
  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">TPO Workspace</p>
          <h2>Offers Issued</h2>
          <p className="muted">Track offer status across drives before they convert into final placements.</p>
        </div>
      </header>

      <div className="status-metrics recruiter-summary-metrics">
        <article className="dashboard-card">
          <span className="metric-label">Total Offers Issued</span>
          <strong>{tpoDashboardData.offers.totalOffersIssued}</strong>
        </article>
        <article className="dashboard-card">
          <span className="metric-label">Accepted Offers</span>
          <strong>{tpoDashboardData.offers.acceptedOffers}</strong>
        </article>
        <article className="dashboard-card recruiter-highlight-card">
          <span className="metric-label">Final Placements</span>
          <strong>{tpoDashboardData.offers.finalPlacements}</strong>
        </article>
      </div>

      <div className="candidate-table-shell">
        <table className="candidate-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Company</th>
              <th>Package</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tpoDashboardData.offers.rows.map((row) => (
              <tr key={row.id}>
                <td>{row.student}</td>
                <td>{row.company}</td>
                <td>{row.package}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
