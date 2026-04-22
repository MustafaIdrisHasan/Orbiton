import { Link } from "react-router-dom";

export function RecruiterPortalPage() {
  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Recruiter Workspace</p>
          <h2>Recruiter Operations Hub</h2>
          <p className="muted">
            Use the dashboard for drive-level screening and this workspace for deeper recruiter workflows.
          </p>
        </div>
        <div className="actions">
          <Link className="button" to="/dashboard">
            Open Dashboard
          </Link>
          <Link className="button button-secondary" to="/drives/create">
            Create Drive
          </Link>
        </div>
      </header>

      <div className="overview-grid">
        <article className="dashboard-card">
          <span className="metric-label">Interviews</span>
          <h3>Interview Management</h3>
          <p className="card-note">Scheduled list, calendar view, and recruiter feedback capture.</p>
          <Link className="button section-action" to="/recruiter/interviews">
            Manage Interviews
          </Link>
        </article>
        <article className="dashboard-card">
          <span className="metric-label">Communications</span>
          <h3>Drive Broadcasts</h3>
          <p className="card-note">Send drive-based updates to applicants, shortlisted candidates, or interview cohorts.</p>
          <Link className="button section-action" to="/recruiter/communications">
            Open Communications
          </Link>
        </article>
        <article className="dashboard-card">
          <span className="metric-label">Reports</span>
          <h3>Exports And Reporting</h3>
          <p className="card-note">Prepare resume bundles, shortlisted exports, selected lists, and CSV downloads.</p>
          <Link className="button section-action" to="/recruiter/reports">
            View Reports
          </Link>
        </article>
        <article className="dashboard-card">
          <span className="metric-label">Drive Operations</span>
          <h3>Drive Maintenance</h3>
          <p className="card-note">Jump into create-drive or my-drives flows for future backend-connected operations.</p>
          <div className="actions">
            <Link className="button section-action" to="/drives/create">
              New Drive
            </Link>
            <Link className="button button-secondary section-action" to="/drives/mine">
              My Drives
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}

