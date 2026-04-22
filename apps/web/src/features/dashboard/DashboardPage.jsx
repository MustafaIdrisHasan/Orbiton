import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { roleDashboardContent, statusStyles, studentDashboardData } from "../../shared/data/dashboardData";
import { RecruiterDashboardLive as RecruiterDashboard } from "../recruiter/RecruiterDashboardLive";

function StudentDashboard({ name }) {
  const [filters, setFilters] = useState({
    department: "All",
    status: "All",
    packageMin: ""
  });

  const filteredDrives = useMemo(() => {
    return [...studentDashboardData.drives]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .filter((drive) => filters.department === "All" || drive.department === filters.department)
      .filter((drive) => filters.status === "All" || drive.status === filters.status)
      .filter((drive) => !filters.packageMin || drive.package >= Number(filters.packageMin));
  }, [filters]);

  return (
    <section className="dashboard-stack">
      <section className="hero-banner">
        <div>
          <p className="eyebrow">Student Dashboard</p>
          <h1 className="hero-title">
            <em>Hello {name}</em>
          </h1>
        </div>
      </section>

      <section className="status-panel">
        <div className="section-heading">
          <h2>Current Status</h2>
        </div>
        <div className="status-metrics">
          <article className="dashboard-card emphasis-card">
            <span className="metric-label">Applications Submitted</span>
            <strong>{studentDashboardData.summary.applicationsSubmitted}</strong>
          </article>
          <article className="dashboard-card emphasis-card">
            <span className="metric-label">Offers Received</span>
            <strong>{studentDashboardData.summary.offersReceived}</strong>
          </article>
        </div>
        <Link className="button full-width" to="/drives">
          View Drives
        </Link>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>Featured Placements</h2>
          <span className="subtle">Personalized featured opportunities</span>
        </div>
        <div className="carousel-row">
          {studentDashboardData.featuredPlacements.map((placement) => (
            <article className="dashboard-card placement-card" key={placement.id}>
              <p className="eyebrow">{placement.company}</p>
              <h3>{placement.title}</h3>
              <p className="muted">
                {placement.package} • {placement.location}
              </p>
              <div className="pill-row">
                {placement.skills.map((skill) => (
                  <span className="soft-pill" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
              <p className="card-note">{placement.personalizedReason}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>My Applications</h2>
          <span className="subtle">Color-coded by workflow state</span>
        </div>
        <div className="application-grid">
          {studentDashboardData.applications.map((application) => {
            const style = statusStyles[application.status];
            return (
              <article className={`dashboard-card application-card ${style.className}`} key={application.id}>
                <div className="application-head">
                  <div>
                    <h3>{application.company}</h3>
                    <p className="muted">{application.role}</p>
                  </div>
                  <span className="status-chip">{style.label}</span>
                </div>
                <button className="button button-secondary" type="button">
                  More Details
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>Upcoming Rounds</h2>
          <span className="subtle">Time-sensitive awareness</span>
        </div>
        <div className="rounds-list">
          {studentDashboardData.rounds.map((round) => (
            <article className="dashboard-card round-card" key={round.id}>
              <h3>{round.roundName}</h3>
              <div className="round-meta">
                <span>{round.dateTime}</span>
                <span>{round.mode}</span>
              </div>
              <p className="card-note">{round.locationOrLink}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>All Drives</h2>
          <span className="subtle">Chronological feed with quick filters</span>
        </div>
        <div className="filters-bar">
          <label>
            Department
            <select value={filters.department} onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))}>
              <option>All</option>
              <option>CSE</option>
              <option>IT</option>
              <option>EEE</option>
            </select>
          </label>
          <label>
            Status
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option>All</option>
              <option>Open</option>
              <option>Closed</option>
            </select>
          </label>
          <label>
            Package Min
            <input
              type="number"
              min="0"
              placeholder="e.g. 10"
              value={filters.packageMin}
              onChange={(event) => setFilters((current) => ({ ...current, packageMin: event.target.value }))}
            />
          </label>
        </div>
        <div className="drives-grid">
          {filteredDrives.map((drive) => (
            <article className="dashboard-card drive-card" key={drive.id}>
              <p className="eyebrow">{drive.company}</p>
              <h3>{drive.role}</h3>
              <p className="muted">
                {drive.department} • {drive.status}
              </p>
              <div className="drive-footer">
                <strong>{drive.package} LPA</strong>
                <span>{drive.date}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function RoleDashboard({ role }) {
  const content = roleDashboardContent[role];

  return (
    <section className="dashboard-stack">
      <section className="hero-banner compact-hero">
        <div>
          <p className="eyebrow">Role Dashboard</p>
          <h1 className="hero-title">{content.title}</h1>
        </div>
      </section>

      <div className="overview-grid">
        {content.metrics.map((metric) => (
          <article className="dashboard-card" key={metric.label}>
            <span className="metric-label">{metric.label}</span>
            <strong>{metric.value}</strong>
            <p className="card-note">{metric.note}</p>
          </article>
        ))}
      </div>

      <div className="overview-grid three-columns">
        {content.sections.map((section) => (
          <article className="dashboard-card" key={section.title}>
            <h3>{section.title}</h3>
            <div className="detail-list">
              {section.items.map((item) => (
                <p className="card-note" key={item}>
                  {item}
                </p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const role = user?.roles?.[0];
  const name = user?.email?.split("@")[0] || "Student";

  if (role === "STUDENT") {
    return <StudentDashboard name={name} />;
  }

  if (role === "RECRUITER") {
    return <RecruiterDashboard />;
  }

  if (role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (role === "TPO") {
    return <Navigate to="/tpo/dashboard" replace />;
  }

  return <RoleDashboard role={role} />;
}
