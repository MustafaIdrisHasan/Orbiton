import { Link } from "react-router-dom";
import { adminDashboardData } from "./adminData";
import { AdminUsersTable } from "./AdminUsersTable";

export function AdminDashboardPage() {
  return (
    <section className="dashboard-stack admin-dashboard">
      <section className="hero-banner compact-hero">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h1 className="hero-title">System control and user governance</h1>
            <p className="muted">A clean control panel for user lifecycle management, audit visibility, drive oversight, and system operations.</p>
          </div>
          <div className="dashboard-card admin-health-card">
            <span className="metric-label">System Health</span>
            <strong>{adminDashboardData.overview.systemHealth}</strong>
          </div>
        </div>

        <div className="admin-kpi-grid">
          <article className="dashboard-card">
            <span className="metric-label">Total Users</span>
            <strong>{adminDashboardData.overview.totalUsers}</strong>
          </article>
          <article className="dashboard-card">
            <span className="metric-label">Active Users</span>
            <strong>{adminDashboardData.overview.activeUsers}</strong>
          </article>
          <article className="dashboard-card">
            <span className="metric-label">Total Students</span>
            <strong>{adminDashboardData.overview.totalStudents}</strong>
          </article>
          <article className="dashboard-card">
            <span className="metric-label">Total Recruiters</span>
            <strong>{adminDashboardData.overview.totalRecruiters}</strong>
          </article>
          <article className="dashboard-card">
            <span className="metric-label">Active Drives</span>
            <strong>{adminDashboardData.overview.activeDrives}</strong>
          </article>
          <article className="dashboard-card">
            <span className="metric-label">Total Applications</span>
            <strong>{adminDashboardData.overview.totalApplications}</strong>
          </article>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Alerts &amp; System Warnings</h2>
            <span className="subtle">High-priority issues are surfaced as actions, not passive information.</span>
          </div>
        </div>
        <div className="overview-grid">
          {adminDashboardData.alerts.map((alert) => (
            <article className="dashboard-card" key={alert.id}>
              <span className="metric-label">{alert.title}</span>
              <h3>{alert.value}</h3>
              <p className="card-note">{alert.note}</p>
              <Link className="button section-action" to={alert.to}>
                {alert.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>User Management</h2>
            <span className="subtle">The core admin workflow for viewing, editing, role changes, and account state management.</span>
          </div>
          <Link className="button button-secondary" to="/admin/users">
            Open full user management
          </Link>
        </div>
        <AdminUsersTable compact />
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Role &amp; Permission Management</h2>
            <span className="subtle">Simple RBAC mapping view aligned with backend capability boundaries.</span>
          </div>
          <Link className="button button-secondary" to="/admin/roles">
            Manage roles
          </Link>
        </div>
        <div className="overview-grid">
          {adminDashboardData.roles.map((role) => (
            <article className="dashboard-card" key={role.id}>
              <span className="metric-label">{role.name}</span>
              <div className="pill-row compact-pills">
                {role.permissions.map((permission) => (
                  <span className="soft-pill" key={permission}>
                    {permission}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>System Activity / Audit Logs</h2>
            <span className="subtle">Recent operational activity with security-focused visibility.</span>
          </div>
          <Link className="button button-secondary" to="/admin/logs">
            View all logs
          </Link>
        </div>
        <div className="candidate-table-shell">
          <table className="candidate-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {adminDashboardData.logs.slice(0, 4).map((log) => (
                <tr key={log.id}>
                  <td>{log.timestamp}</td>
                  <td>{log.user}</td>
                  <td>{log.action}</td>
                  <td>{log.entity}</td>
                  <td>{log.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Drive Oversight</h2>
            <span className="subtle">Admin-level visibility and override control across recruiter-created drives.</span>
          </div>
          <Link className="button button-secondary" to="/admin/drives">
            Review drives
          </Link>
        </div>
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
                      <Link className="table-icon-button table-link-button" to="/admin/drives">
                        View
                      </Link>
                      <button className="table-icon-button" type="button">
                        Override
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>System Controls</h2>
            <span className="subtle">Sensitive administrative controls are visible, grouped, and future-ready.</span>
          </div>
        </div>
        <div className="overview-grid">
          {adminDashboardData.systemControls.map((control) => (
            <article className="dashboard-card" key={control.id}>
              <h3>{control.title}</h3>
              <p className="card-note">{control.description}</p>
              <button className="button section-action" type="button">
                Open Control
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Reports &amp; Data Export</h2>
            <span className="subtle">User data, placement data, and audit logs should be directly exportable by admins.</span>
          </div>
          <Link className="button button-secondary" to="/admin/reports">
            Open reports
          </Link>
        </div>
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
    </section>
  );
}
