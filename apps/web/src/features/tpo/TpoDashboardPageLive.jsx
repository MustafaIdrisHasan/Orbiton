import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { tpoDashboardData } from "./tpoData";
import { createTpoAnnouncement, fetchTpoDashboard } from "../../shared/api/tpo";

function getMax(items) {
  return Math.max(...items.map((item) => item.count || item.value || item.percentage), 1);
}

export function TpoDashboardPageLive() {
  const [dashboard, setDashboard] = useState(tpoDashboardData);
  const [announcementAudience, setAnnouncementAudience] = useState("All students");
  const [announcementText, setAnnouncementText] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        const data = await fetchTpoDashboard();
        if (!ignore) {
          setDashboard(data);
        }
      } catch (_error) {
        // Keep the fallback dashboard visible if the live endpoint is unavailable.
      }
    }

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  const cgpaMax = useMemo(() => getMax(dashboard.cgpaBands), [dashboard.cgpaBands]);
  const applicationsMax = useMemo(() => getMax(dashboard.applicationFlowAnalytics.applicationsPerDrive), [dashboard.applicationFlowAnalytics.applicationsPerDrive]);

  async function sendAnnouncement() {
    const message = announcementText.trim();
    if (!message) {
      return;
    }

    try {
      const created = await createTpoAnnouncement({
        audience: announcementAudience,
        message
      });

      setDashboard((current) => ({
        ...current,
        announcements: {
          ...current.announcements,
          recent: [created, ...current.announcements.recent]
        }
      }));
      setAnnouncementText("");
    } catch (_error) {
      // Keep the current content and allow retry from the same form.
    }
  }

  return (
    <section className="dashboard-stack tpo-dashboard">
      <section className="hero-banner compact-hero">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TPO Dashboard</p>
            <h1 className="hero-title">Institution-level supervision and control</h1>
            <p className="muted">The main TPO dashboard now loads its overview and action strips from the authenticated backend route.</p>
          </div>
        </div>

        <div className="tpo-kpi-grid">
          <article className="dashboard-card">
            <span className="metric-label">Total Students Eligible</span>
            <strong>{dashboard.overview.totalStudentsEligible}</strong>
          </article>
          <article className="dashboard-card">
            <span className="metric-label">Total Applications</span>
            <strong>{dashboard.overview.totalApplications}</strong>
          </article>
          <article className="dashboard-card recruiter-highlight-card">
            <span className="metric-label">Students Placed</span>
            <strong>{dashboard.overview.studentsPlaced}</strong>
          </article>
          <article className="dashboard-card">
            <span className="metric-label">Placement Percentage</span>
            <strong>{dashboard.overview.placementPercentage}</strong>
          </article>
          <article className="dashboard-card">
            <span className="metric-label">Active Drives</span>
            <strong>{dashboard.overview.activeDrives}</strong>
          </article>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Placement Funnel</h2>
            <span className="subtle">Aggregated across all drives: the most important institution-level placement visualization.</span>
          </div>
        </div>
        <div className="funnel-grid tpo-funnel-grid">
          {dashboard.funnel.map((stage) => (
            <article className="funnel-stage" key={stage.stage}>
              <span className="metric-label">{stage.stage}</span>
              <strong>{stage.count}</strong>
              <p className="card-note">{stage.conversion} conversion</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Alerts &amp; Control Strip</h2>
            <span className="subtle">This section is action-driven and prioritized above passive observation.</span>
          </div>
        </div>
        <div className="overview-grid">
          {dashboard.alerts.map((alert) => (
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
            <h2>Active Drives Monitor</h2>
            <span className="subtle">Centralized control over recruiter drives and institutional workflow status.</span>
          </div>
          <Link className="button button-secondary" to="/tpo/drives">
            View all drives
          </Link>
        </div>
        <div className="candidate-table-shell">
          <table className="candidate-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Applicants Count</th>
                <th>Deadline</th>
                <th>Recruiter</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.activeDrives.map((drive) => (
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
                        View
                      </Link>
                      <button className="table-icon-button" type="button">
                        Override
                      </button>
                      <button className="table-icon-button" type="button">
                        Contact
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
            <h2>Student Performance Overview</h2>
            <span className="subtle">Department outcomes, CGPA spread, and placement readiness at a glance.</span>
          </div>
        </div>
        <div className="tpo-analytics-grid">
          <article className="dashboard-card">
            <h3>Department-wise Stats</h3>
            <div className="detail-list">
              {dashboard.departmentStats.map((department) => (
                <div className="detail-item" key={department.department}>
                  <strong>{department.department}</strong>
                  <span className="subtle">
                    Applicants: {department.applicants} • Selected: {department.selected} • Placement %: {department.placementPercentage}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card">
            <h3>CGPA Distribution</h3>
            <div className="detail-list">
              {dashboard.cgpaBands.map((band) => (
                <div className="bar-row" key={band.label}>
                  <div className="bar-meta">
                    <strong>{band.label}</strong>
                    <span className="subtle">{band.count} students</span>
                  </div>
                  <div className="bar-track">
                    <span className="bar-fill" style={{ width: `${(band.count / cgpaMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card">
            <h3>Placement Readiness</h3>
            <div className="detail-list">
              {dashboard.readiness.map((item) => (
                <div className="bar-row" key={item.label}>
                  <div className="bar-meta">
                    <strong>{item.label}</strong>
                    <span className="subtle">{item.percentage}%</span>
                  </div>
                  <div className="bar-track">
                    <span className="bar-fill success-fill" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Application Flow Analytics</h2>
            <span className="subtle">Applications per drive, stage drop-off, and turnaround times.</span>
          </div>
        </div>
        <div className="tpo-analytics-grid">
          <article className="dashboard-card">
            <h3>Applications Per Drive</h3>
            <div className="detail-list">
              {dashboard.applicationFlowAnalytics.applicationsPerDrive.map((item) => (
                <div className="bar-row" key={item.label}>
                  <div className="bar-meta">
                    <strong>{item.label}</strong>
                    <span className="subtle">{item.value}</span>
                  </div>
                  <div className="bar-track">
                    <span className="bar-fill" style={{ width: `${(item.value / applicationsMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card">
            <h3>Drop-off Per Stage</h3>
            <div className="detail-list">
              {dashboard.applicationFlowAnalytics.dropOff.map((item) => (
                <div className="detail-item" key={item.stage}>
                  <strong>{item.stage}</strong>
                  <span className="subtle">{item.value}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card">
            <h3>Time Taken Per Stage</h3>
            <div className="detail-list">
              {dashboard.applicationFlowAnalytics.stageTimes.map((item) => (
                <div className="detail-item" key={item.stage}>
                  <strong>{item.stage}</strong>
                  <span className="subtle">{item.value}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Offers &amp; Placements Tracking</h2>
          </div>
        </div>
        <div className="status-metrics recruiter-summary-metrics">
          <article className="dashboard-card">
            <span className="metric-label">Total Offers Issued</span>
            <strong>{dashboard.offers.totalOffersIssued}</strong>
          </article>
          <article className="dashboard-card">
            <span className="metric-label">Accepted Offers</span>
            <strong>{dashboard.offers.acceptedOffers}</strong>
          </article>
          <article className="dashboard-card recruiter-highlight-card">
            <span className="metric-label">Final Placements</span>
            <strong>{dashboard.offers.finalPlacements}</strong>
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
              {dashboard.offers.rows.map((row) => (
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

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Student Management</h2>
          </div>
          <Link className="button button-secondary" to="/tpo/students">
            View All Students
          </Link>
        </div>
        <div className="tpo-analytics-grid">
          <article className="dashboard-card">
            <h3>Recently Active Students</h3>
            <div className="detail-list">
              {dashboard.studentManagement.recentActive.map((student) => (
                <div className="detail-item" key={student.id}>
                  <strong>{student.name}</strong>
                  <p className="card-note">{student.detail}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="dashboard-card">
            <h3>Students Needing Attention</h3>
            <div className="detail-list">
              {dashboard.studentManagement.attentionNeeded.map((student) => (
                <div className="detail-item" key={student.id}>
                  <strong>{student.name}</strong>
                  <p className="card-note">{student.reason}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Reports &amp; Export</h2>
          </div>
        </div>
        <div className="overview-grid">
          {dashboard.reports.map((report) => (
            <article className="dashboard-card" key={report.id}>
              <span className="metric-label">{report.format}</span>
              <h3>{report.title}</h3>
              <p className="card-note">{report.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Communication / Announcements Panel</h2>
          </div>
        </div>
        <div className="detail-grid">
          <label className="settings-field">
            Audience
            <select value={announcementAudience} onChange={(event) => setAnnouncementAudience(event.target.value)}>
              <option>All students</option>
              <option>Specific departments</option>
              <option>Specific drive applicants</option>
            </select>
          </label>
        </div>
        <label className="settings-field">
          Announcement Draft
          <textarea className="profile-input recruiter-textarea" value={announcementText} onChange={(event) => setAnnouncementText(event.target.value)} />
        </label>
        <button className="button section-action" type="button" onClick={sendAnnouncement}>
          Send Announcement
        </button>
        <div className="detail-list">
          {dashboard.announcements.recent.map((announcement) => (
            <div className="detail-item" key={announcement.id}>
              <strong>{announcement.audience}</strong>
              <span className="subtle">{announcement.time}</span>
              <p className="card-note">{announcement.message}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
