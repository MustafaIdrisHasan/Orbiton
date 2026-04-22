import { useParams } from "react-router-dom";
import { adminDashboardData } from "./adminData";

export function AdminUserDetailsPage() {
  const { id } = useParams();
  const user = adminDashboardData.users.find((item) => item.id === id);

  if (!user) {
    return (
      <section className="empty-state">
        <p className="eyebrow">Admin Workspace</p>
        <h2>User not found</h2>
        <p className="muted">Open a valid record from the user management table.</p>
      </section>
    );
  }

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">User Details</p>
          <h2>{user.name}</h2>
          <p className="muted">
            {user.email} • {user.role} • {user.status}
          </p>
        </div>
        <div className="actions">
          <button className="button button-secondary" type="button">
            Reset Password
          </button>
          <button className="button" type="button">
            Change Role
          </button>
          <button className="button button-danger" type="button">
            Disable Account
          </button>
        </div>
      </header>

      <div className="detail-grid">
        <div className="detail-item">
          <span className="subtle">Phone</span>
          <strong>{user.details.phone}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Department / Org</span>
          <strong>{user.details.department}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Role Information</span>
          <strong>{user.details.roleInfo}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Account Status</span>
          <strong>{user.details.accountStatus}</strong>
        </div>
      </div>

      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Activity Summary</h3>
        </div>
        <div className="detail-item">
          <p className="card-note">{user.details.activitySummary}</p>
        </div>
      </section>
    </section>
  );
}
