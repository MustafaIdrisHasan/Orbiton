import { useEffect, useState } from "react";
import { fetchRecruiterExports } from "../../shared/api/recruiter";

export function RecruiterReportsPageLive() {
  const [exportsList, setExportsList] = useState([]);

  useEffect(() => {
    let ignore = false;

    async function loadExports() {
      const items = await fetchRecruiterExports();
      if (!ignore) {
        setExportsList(items);
      }
    }

    loadExports();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Recruiter Operations</p>
          <h2>Exports And Reports</h2>
          <p className="muted">Report options now load from the recruiter export endpoint instead of the static UI module.</p>
        </div>
      </header>

      <div className="overview-grid">
        {exportsList.map((item) => (
          <article className="dashboard-card" key={item.id}>
            <span className="metric-label">{item.format}</span>
            <h3>{item.label}</h3>
            <p className="card-note">Prepared as a recruiter export for the currently selected drive.</p>
            <button className="button section-action" type="button">
              Generate Export
            </button>
          </article>
        ))}
      </div>

      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Report Notes</h3>
        </div>
        <div className="detail-list">
          <div className="detail-item">
            <strong>CSV export</strong>
            <p className="card-note">Include candidate identity, academics, status, round progression, and timestamps for reporting.</p>
          </div>
          <div className="detail-item">
            <strong>Shortlisted and selected packets</strong>
            <p className="card-note">Group exported resumes with summary sheets so they can be shared with hiring panels quickly.</p>
          </div>
          <div className="detail-item">
            <strong>Audit readiness</strong>
            <p className="card-note">Backend export actions can later record who generated each packet and for which drive.</p>
          </div>
        </div>
      </section>
    </section>
  );
}
