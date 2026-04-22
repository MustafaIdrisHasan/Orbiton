import { employerShowcase } from "../../shared/data/dashboardData";

export function CompaniesPage() {
  return (
    <section className="dashboard-stack">
      <section className="hero-banner compact-hero">
        <div>
          <p className="eyebrow">Companies</p>
          <h1 className="hero-title">Employer Showcase</h1>
          <p className="subtle">Explore featured employers and their active opportunities.</p>
        </div>
      </section>

      <div className="drives-grid">
        {employerShowcase.map((company) => (
          <article className="dashboard-card placement-card" key={company.id}>
            <p className="eyebrow">Employer</p>
            <h3>{company.name}</h3>
            <p className="card-note">{company.tagline}</p>
            <div className="drive-footer">
              <strong>{company.activeOpenings} active openings</strong>
              <span>View company</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
