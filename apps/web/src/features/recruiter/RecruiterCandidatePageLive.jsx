import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { recruiterStatusMeta } from "./recruiterData";
import { fetchRecruiterCandidate } from "../../shared/api/recruiter";

export function RecruiterCandidatePageLive() {
  const { candidateId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadCandidate() {
      try {
        const profile = await fetchRecruiterCandidate(candidateId);
        if (!ignore) {
          setCandidate(profile);
        }
      } catch (_error) {
        if (!ignore) {
          setCandidate(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadCandidate();

    return () => {
      ignore = true;
    };
  }, [candidateId]);

  if (isLoading) {
    return <section className="empty-state">Loading candidate profile...</section>;
  }

  if (!candidate) {
    return (
      <section className="empty-state">
        <p className="eyebrow">Recruiter Operations</p>
        <h2>Candidate not found</h2>
        <p className="muted">Use the candidate list on the recruiter dashboard to open a valid candidate record.</p>
      </section>
    );
  }

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Recruiter Operations</p>
          <h2>{candidate.name}</h2>
          <p className="muted">
            {candidate.driveTitle} • {candidate.rollNumber} • {recruiterStatusMeta[candidate.status].label}
          </p>
        </div>
      </header>

      <div className="detail-grid">
        <div className="detail-item">
          <span className="subtle">Branch</span>
          <strong>{candidate.branch}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Year</span>
          <strong>{candidate.year}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">CGPA</span>
          <strong>{candidate.cgpa}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Backlogs</span>
          <strong>{candidate.backlogs}</strong>
        </div>
      </div>

      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Skills</h3>
        </div>
        <div className="pill-row">
          {candidate.skills.map((skill) => (
            <span className="soft-pill" key={skill}>
              {skill}
            </span>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Resume Preview</h3>
        </div>
        <div className="detail-item">
          <p className="card-note">{candidate.resumePreview}</p>
        </div>
      </section>
    </section>
  );
}
