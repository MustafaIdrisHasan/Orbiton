import { tpoDashboardData } from "./tpoData";

export function TpoPlacementsPage() {
  const placedRows = tpoDashboardData.offers.rows.filter((row) => row.status === "Placed" || row.status === "Accepted");

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">TPO Workspace</p>
          <h2>Final Placements</h2>
          <p className="muted">Track final placement conversions after offers are accepted and confirmed.</p>
        </div>
      </header>

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
            {placedRows.map((row) => (
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
