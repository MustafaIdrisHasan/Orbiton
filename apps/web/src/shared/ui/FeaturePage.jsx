export function FeaturePage({ title, description, actions = [], metrics = [] }) {
  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Orbiton Workspace</p>
          <h2>{title}</h2>
          <p className="muted">{description}</p>
        </div>
        <div className="actions">
          {actions.map((action) => (
            <button key={action} className="button">
              {action}
            </button>
          ))}
        </div>
      </header>

      <div className="metrics-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <span className="metric-label">{metric.label}</span>
            <strong>{metric.value}</strong>
            <p className="muted">{metric.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

