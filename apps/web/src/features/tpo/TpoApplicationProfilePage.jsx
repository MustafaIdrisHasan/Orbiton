import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { openProtectedApiFile } from "../../shared/api/client";
import { fetchTpoApplicationProfile, fetchTpoStudentResumes } from "../../shared/api/tpo";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export function TpoApplicationProfilePage() {
  const { applicationId } = useParams();
  const [profile, setProfile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingResumeId, setOpeningResumeId] = useState(/** @type {string|null} */ (null));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTpoApplicationProfile(applicationId);
      setProfile(data);

      // Backend now returns `resumes` inline (resolved via the applicant's
      // email -> users -> student_profiles -> resumes). Use those directly.
      if (Array.isArray(data?.resumes) && data.resumes.length > 0) {
        setResumes(data.resumes);
      } else if (data?.studentUserId || data?.studentProfileId) {
        // Defensive fallback: fetch with the canonical PG id if inline list
        // was empty for some reason (cold cache, race, etc).
        try {
          const items = await fetchTpoStudentResumes(data.studentUserId || data.studentProfileId);
          setResumes(items);
        } catch {
          /* leave resumes empty — show empty-state */
        }
      } else {
        setResumes([]);
      }
    } catch (err) {
      setError(err?.message || "Could not load applicant profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <section className="stack">
        <p className="muted">Loading applicant…</p>
      </section>
    );
  }

  if (error || !profile) {
    return (
      <section className="empty-state">
        <p className="eyebrow">TPO Workspace</p>
        <h2>{error ? "Couldn't load applicant" : "Application not found"}</h2>
        <p className="muted">
          {error || "The application may have been withdrawn or the ID is invalid."}
        </p>
        <Link className="button" to="/notifications">Back to notifications</Link>
      </section>
    );
  }

  const personal = profile.personalDetails || {};
  const academics = profile.academics || {};
  const displayName = personal.name || personal.email || "Student";

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Application · {profile.driveTitle || "Drive"}</p>
          <h2>{displayName}</h2>
          <p className="muted">
            {personal.email || "—"}
            {personal.branch ? ` • ${personal.branch}` : ""}
            {personal.year ? ` • Year ${personal.year}` : ""}
            {profile.status ? ` • Status: ${profile.status}` : ""}
          </p>
        </div>
        <Link className="button button-secondary" to={`/drives/${profile.driveId}`}>
          View drive
        </Link>
      </header>

      <div className="detail-grid">
        <div className="detail-item">
          <span className="subtle">Email</span>
          <strong>{personal.email || "—"}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Roll number</span>
          <strong>{personal.rollNumber || "—"}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Branch</span>
          <strong>{personal.branch || "—"}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">CGPA</span>
          <strong>{academics.cgpa ?? "—"}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Backlogs</span>
          <strong>{academics.backlogs ?? 0}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Round</span>
          <strong>{profile.currentRound || "—"}</strong>
        </div>
      </div>

      <article className="dashboard-card">
        <h3>Skills</h3>
        {Array.isArray(profile.skills) && profile.skills.length ? (
          <ul className="detail-list">
            {profile.skills.map((s) => (
              <li className="detail-item" key={s}>
                <strong>{s}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No skills listed on this application.</p>
        )}
      </article>

      <article className="dashboard-card">
        <h3>Resumes</h3>
        {profile.resumePreview ? (
          <p className="muted">Application snapshot: {profile.resumePreview}</p>
        ) : null}
        {resumes.length === 0 ? (
          <p className="muted">No persisted resume files for this student.</p>
        ) : (
          <ul className="detail-list">
            {resumes.map((r) => (
              <li className="detail-item" key={r.id}>
                <strong>
                  {r.isActive ? "★ Active · " : ""}
                  {r.fileName || r.filePath?.split("/").pop() || r.id}
                </strong>
                <span className="subtle">Uploaded {formatDate(r.uploadedAt)}</span>
                {r.filePath ? (
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={openingResumeId === r.id}
                    onClick={async () => {
                      setOpeningResumeId(r.id);
                      try {
                        await openProtectedApiFile(r.filePath);
                      } catch (e) {
                        window.alert(e?.message || "Could not open file");
                      } finally {
                        setOpeningResumeId(null);
                      }
                    }}
                  >
                    {openingResumeId === r.id ? "Opening…" : "View file"}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </article>

      {Array.isArray(profile.projects) && profile.projects.length ? (
        <article className="dashboard-card">
          <h3>Projects</h3>
          <ul className="detail-list">
            {profile.projects.map((p, i) => (
              <li className="detail-item" key={i}>
                <strong>{typeof p === "string" ? p : p.name || p.title || "Project"}</strong>
                {typeof p === "object" && p.description ? <p className="card-note">{p.description}</p> : null}
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {profile.notes ? (
        <article className="dashboard-card">
          <h3>Notes</h3>
          <p className="card-note">{profile.notes}</p>
        </article>
      ) : null}
    </section>
  );
}
