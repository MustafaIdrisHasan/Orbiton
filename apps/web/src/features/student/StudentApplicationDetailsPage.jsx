import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchApplicationById } from "../../shared/api/student";
import { metaForApplicationStatus } from "../../shared/student/applicationStatus";

export function StudentApplicationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(/** @type {object|null} */ (null));
  const [error, setError] = useState(/** @type {string|null} */ (null));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const raw = await fetchApplicationById(id);
        if (!cancelled) {
          setDetail(raw);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Application not found");
          setDetail(null);
        }
      }
    }

    if (id) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <section className="dashboard-stack">
        <p className="card-note">{error}</p>
        <button type="button" className="button button-secondary" onClick={() => navigate("/student")}>
          Back to dashboard
        </button>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="dashboard-stack">
        <p className="subtle">Loading application…</p>
      </section>
    );
  }

  const statusMeta = metaForApplicationStatus(detail.status);
  const name = detail.personalDetails?.name || "Candidate";
  const pd = detail.personalDetails || {};

  return (
    <section className="dashboard-stack">
      <nav className="subtle" style={{ marginBottom: 12 }}>
        <Link to="/student">Student home</Link>
        <span> / </span>
        <span>Application</span>
      </nav>
      <article className="dashboard-card">
        <p className="eyebrow">{detail.driveTitle || "Drive"}</p>
        <h1 className="hero-title" style={{ fontSize: "1.85rem" }}>
          Application status
        </h1>
        <p>
          <span className={`status-chip ${statusMeta.chipClass}`}>{statusMeta.label}</span>
        </p>
        {detail.currentRound ? (
          <p>
            <strong>Current round:</strong> {detail.currentRound}
          </p>
        ) : null}
        <p className="card-note">{detail.notes || "Recruiter notes will appear here when shared."}</p>
      </article>

      <article className="dashboard-card">
        <h2>Candidate record</h2>
        <p>
          <strong>Name:</strong> {name}
        </p>
        <p>
          <strong>Roll:</strong> {pd.rollNumber || "—"}
        </p>
        <p>
          <strong>Branch:</strong> {pd.branch || "—"}
        </p>
        <p>
          <strong>Email:</strong> {pd.email || "—"}
        </p>
      </article>

      <button type="button" className="button button-secondary" onClick={() => navigate("/student")}>
        Back to dashboard
      </button>
    </section>
  );
}
