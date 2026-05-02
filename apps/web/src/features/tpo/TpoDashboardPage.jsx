import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { tpoDashboardData } from "./tpoData";
import { PlacementPredictionWidget } from "./PlacementPredictionWidget";

function getMax(items) {
  return Math.max(...items.map((item) => item.count || item.value || item.percentage), 1);
}

export function TpoDashboardPage() {
  const [announcementAudience, setAnnouncementAudience] = useState("All students");
  const [announcementText, setAnnouncementText] = useState("");
  const [announcements, setAnnouncements] = useState(tpoDashboardData.announcements.recent);

  const cgpaMax = useMemo(() => getMax(tpoDashboardData.cgpaBands), []);
  const applicationsMax = useMemo(() => getMax(tpoDashboardData.applicationFlowAnalytics.applicationsPerDrive), []);

  function sendAnnouncement() {
    const message = announcementText.trim();
    if (!message) {
      return;
    }

    setAnnouncements((current) => [
      {
        id: `ann-${current.length + 1}`,
        audience: announcementAudience,
        time: "Just now",
        message
      },
      ...current
    ]);
    setAnnouncementText("");
  }

  return (
    <section className="dashboard-stack tpo-dashboard">
      <section className="hero-banner compact-hero">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TPO Dashboard</p>
            <h1 className="hero-title">Institution-level supervision and control</h1>
            <p className="muted">A centralized health snapshot for drives, participation, offers, placements, and action-driven alerts.</p>
          </div>
        </div>

        <div className="tpo-kpi-grid">
          <article className="dashboard-card">
            <span className="metric-label">Total Students Eligible</span>
            <strong>{tpoDashboardData.overview.totalStudentsEligible}</strong>
          </article>
          <article className="dashboard-card">
            <span className="metric-label">Total Applications</span>
            <strong>{tpoDashboardData.overview.totalApplications}</strong>
          </article>
          <article className="dashboard-card recruiter-highlight-card">
            <span className="metric-label">Students Placed</span>
            <strong>{tpoDashboardData.overview.studentsPlaced}</strong>
          </article>
          <article className="dashboard-card">
            <span className="metric-label">Placement Percentage</span>
            <strong>{tpoDashboardData.overview.placementPercentage}</strong>
          </article>
          <article className="dashboard-card">
            <span className="metric-label">Active Drives</span>
            <strong>{tpoDashboardData.overview.activeDrives}</strong>
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
          {tpoDashboardData.funnel.map((stage) => (
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
          {tpoDashboardData.alerts.map((alert) => (
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

      <PlacementPredictionWidget />

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
              {tpoDashboardData.departmentStats.map((department) => (
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
              {tpoDashboardData.cgpaBands.map((band) => (
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
              {tpoDashboardData.readiness.map((item) => (
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
            <span className="subtle">Track system efficiency, drop-offs, and stage timing across the institution.</span>
          </div>
        </div>
        <div className="tpo-analytics-grid">
          <article className="dashboard-card">
            <h3>Applications Per Drive</h3>
            <div className="detail-list">
              {tpoDashboardData.applicationFlowAnalytics.applicationsPerDrive.map((item) => (
                <div className="bar-row" key={item.label}>
                  <div className="bar-meta">
                    <strong>{item.label}</strong>
                    <span className="subtle">{item.value} applications</span>
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
              {tpoDashboardData.applicationFlowAnalytics.dropOff.map((item) => (
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
              {tpoDashboardData.applicationFlowAnalytics.stageTimes.map((item) => (
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
            <span className="subtle">A concise view of offers issued, accepted, and converted to final placements.</span>
          </div>
        </div>
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
                <th>Student Name</th>
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

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Student Management</h2>
            <span className="subtle">Entry point for recently active students and high-priority attention queues.</span>
          </div>
          <Link className="button button-secondary" to="/tpo/students">
            View All Students
          </Link>
        </div>
        <div className="overview-grid">
          <article className="dashboard-card">
            <h3>Recently Active Students</h3>
            <div className="detail-list">
              {tpoDashboardData.studentManagement.recentActive.map((student) => (
                <div className="detail-item" key={student.id}>
                  <strong>{student.name}</strong>
                  <span className="subtle">{student.detail}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="dashboard-card">
            <h3>Students Needing Attention</h3>
            <div className="detail-list">
              {tpoDashboardData.studentManagement.attentionNeeded.map((student) => (
                <div className="detail-item" key={student.id}>
                  <strong>{student.name}</strong>
                  <span className="subtle">{student.reason}</span>
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
            <span className="subtle">Critical export actions are surfaced directly instead of buried in settings.</span>
          </div>
          <Link className="button button-secondary" to="/tpo/reports">
            Open reports
          </Link>
        </div>
        <div className="overview-grid">
          {tpoDashboardData.reports.map((report) => (
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

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Communication / Announcements</h2>
            <span className="subtle">TPO is the broadcast authority for students, departments, and drive applicants.</span>
          </div>
          <Link className="button button-secondary" to="/tpo/announcements">
            Open announcements
          </Link>
        </div>
        <div className="tpo-communications-grid">
          <article className="dashboard-card">
            <label className="settings-field">
              Audience
              <select value={announcementAudience} onChange={(event) => setAnnouncementAudience(event.target.value)}>
                <option>All students</option>
                <option>Specific departments</option>
                <option>Specific drive applicants</option>
              </select>
            </label>
            <label className="settings-field">
              Announcement
              <textarea
                className="profile-input recruiter-textarea"
                value={announcementText}
                onChange={(event) => setAnnouncementText(event.target.value)}
                placeholder="Write an institution-wide update, department announcement, or drive-specific notice."
              />
            </label>
            <button className="button section-action" type="button" onClick={sendAnnouncement}>
              Send Announcement
            </button>
          </article>

          <article className="dashboard-card">
            <h3>Recent Announcements</h3>
            <div className="detail-list">
              {announcements.map((announcement) => (
                <div className="detail-item" key={announcement.id}>
                  <strong>{announcement.audience}</strong>
                  <span className="subtle">{announcement.time}</span>
                  <p className="card-note">{announcement.message}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </section>
  );
}
