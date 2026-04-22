import { adminDashboardData } from "./adminData";

export function AdminRolesPage() {
  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin Workspace</p>
          <h2>Role &amp; Permission Management</h2>
          <p className="muted">Simple RBAC mapping view for role-permission visibility and future permission editing.</p>
        </div>
      </header>

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
            <button className="button section-action" type="button">
              Modify Permissions
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
