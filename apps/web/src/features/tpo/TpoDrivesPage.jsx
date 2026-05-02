import { Link } from "react-router-dom";
import { tpoDashboardData } from "./tpoData";

export function TpoDrivesPage() {
  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">TPO Workspace</p>
          <h2>All Drives</h2>
          <p className="muted">Institute-wide drive monitoring with approval, override, and recruiter contact actions.</p>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            To add a drive students can open on <Link to="/drives">Placements</Link>, use{" "}
            <Link to="/drives/create">Create drive</Link> (publish it) or{" "}
            <Link to="/drives/mine">Manage drives</Link>.
          </p>
        </div>
      </header>

      <div className="candidate-table-shell">
        <table className="candidate-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              <th>Applicants</th>
              <th>Deadline</th>
              <th>Recruiter</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tpoDashboardData.activeDrives.map((drive) => (
              <tr key={drive.id}>
                <td>{drive.company}</td>
                <td>{drive.role}</td>
                <td>{drive.status}</td>
                <td>{drive.applicantsCount}</td>
                <td>{drive.deadline}</td>
                <td>{drive.recruiter}</td>
                <td>
                  <div className="table-actions">
                    <Link className="table-icon-button table-link-button" to={`/tpo/drives/${drive.id}`}>
                      View Drive
                    </Link>
                    <button className="table-icon-button" type="button">
                      Override Status
                    </button>
                    <button className="table-icon-button" type="button">
                      Contact Recruiter
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
