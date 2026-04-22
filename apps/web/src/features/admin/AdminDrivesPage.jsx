import { adminDashboardData } from "./adminData";

export function AdminDrivesPage() {
  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin Workspace</p>
          <h2>Drive Oversight</h2>
          <p className="muted">Lightweight admin visibility over drives with view and force-update status control points.</p>
        </div>
      </header>

      <div className="candidate-table-shell">
        <table className="candidate-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {adminDashboardData.drives.map((drive) => (
              <tr key={drive.id}>
                <td>{drive.company}</td>
                <td>{drive.role}</td>
                <td>{drive.status}</td>
                <td>{drive.createdBy}</td>
                <td>
                  <div className="table-actions">
                    <button className="table-icon-button" type="button">
                      View
                    </button>
                    <button className="table-icon-button" type="button">
                      Force Update
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
