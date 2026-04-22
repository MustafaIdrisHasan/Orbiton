import { Link, useParams } from "react-router-dom";
import { tpoDashboardData } from "./tpoData";

export function TpoDriveDetailsPage() {
  const { id } = useParams();
  const drive = tpoDashboardData.activeDrives.find((item) => item.id === id);

  if (!drive) {
    return (
      <section className="empty-state">
        <p className="eyebrow">TPO Workspace</p>
        <h2>Drive not found</h2>
        <p className="muted">Return to the drive monitor to open a valid drive record.</p>
      </section>
    );
  }

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Drive Details</p>
          <h2>
            {drive.company} - {drive.role}
          </h2>
          <p className="muted">
            Recruiter: {drive.recruiter} • Deadline: {drive.deadline}
          </p>
        </div>
        <div className="actions">
          <button className="button" type="button">
            Override Status
          </button>
          <button className="button button-secondary" type="button">
            Contact Recruiter
          </button>
        </div>
      </header>

      <div className="overview-grid">
        <article className="dashboard-card">
          <span className="metric-label">Status</span>
          <strong>{drive.status}</strong>
        </article>
        <article className="dashboard-card">
          <span className="metric-label">Applicants Count</span>
          <strong>{drive.applicantsCount}</strong>
        </article>
        <article className="dashboard-card">
          <span className="metric-label">Action</span>
          <strong>Review approval readiness</strong>
        </article>
      </div>

      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Linked Control Actions</h3>
        </div>
        <div className="detail-list">
          <div className="detail-item">
            <strong>Applicant monitoring</strong>
            <span className="subtle">Track flow analytics from the global applications workspace.</span>
          </div>
          <div className="detail-item">
            <strong>Institution response</strong>
            <span className="subtle">Coordinate announcements or approvals if deadlines are clustered.</span>
          </div>
        </div>
        <Link className="button section-action" to="/tpo/applications">
          Open application tracking
        </Link>
      </section>
    </section>
  );
}
