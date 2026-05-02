import { Navigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { roleDashboardContent } from "../../shared/data/dashboardData";
import { RecruiterDashboardLive as RecruiterDashboard } from "../recruiter/RecruiterDashboardLive";

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

  if (role === "STUDENT") {
    return <Navigate to="/student" replace />;
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
