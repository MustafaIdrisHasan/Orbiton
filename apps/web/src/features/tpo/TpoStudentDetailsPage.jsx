import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { openProtectedApiFile } from "../../shared/api/client";
import {
  fetchTpoStudent,
  fetchTpoStudentResumes,
} from "../../shared/api/tpo";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

export function TpoStudentDetailsPage() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingResumeId, setOpeningResumeId] = useState(/** @type {string|null} */ (null));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [studentData, resumeItems] = await Promise.all([
        fetchTpoStudent(id),
        fetchTpoStudentResumes(id).catch(() => []),
      ]);
      setStudent(studentData);
      setResumes(resumeItems);
    } catch (err) {
      setError(err?.message || "Could not load student");
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <section className="stack">
        <p className="muted">Loading student…</p>
      </section>
    );
  }

  if (error || !student) {
    return (
      <section className="empty-state">
        <p className="eyebrow">TPO Workspace</p>
        <h2>{error ? "Couldn't load student" : "Student not found"}</h2>
        <p className="muted">{error || "Open a student record from the student management route."}</p>
      </section>
    );
  }

  const displayName = student.name || student.full_name || student.email || "Student";

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student Details</p>
          <h2>{displayName}</h2>
          <p className="muted">
            {(student.department || student.program) || "—"} • CGPA {student.cgpa ?? "—"}
            {student.year ? ` • Year ${student.year}` : ""}
            {student.email ? ` • ${student.email}` : ""}
          </p>
        </div>
      </header>

      <div className="detail-grid">
        <div className="detail-item">
          <span className="subtle">Email</span>
          <strong>{student.email || "—"}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Phone</span>
          <strong>{student.phone || "—"}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Department</span>
          <strong>{student.department || "—"}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Program</span>
          <strong>{student.program || "—"}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Applications</span>
          <strong>{student.applicationsCount ?? "—"}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Backlogs</span>
          <strong>{student.backlogs ?? 0}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Status</span>
          <strong>{student.status || "On Track"}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Has resume</span>
          <strong>{student.hasResume || resumes.length > 0 ? "Yes" : "No"}</strong>
        </div>
      </div>

      <article className="dashboard-card">
        <h3>Resumes</h3>
        {resumes.length === 0 ? (
          <p className="muted">No resumes uploaded by this student.</p>
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
    </section>
  );
}
