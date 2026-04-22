import { studentDashboardData } from "../../shared/data/dashboardData";

export function DrivesPage() {
  return (
    <section className="dashboard-stack">
      <section className="hero-banner compact-hero">
        <div>
          <p className="eyebrow">Placements</p>
          <h1 className="hero-title">Drive Discovery</h1>
          <p className="subtle">Browse open and featured placements with filters and role context.</p>
        </div>
      </section>

      <div className="drives-grid">
        {studentDashboardData.drives.map((drive) => (
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
  );
}
