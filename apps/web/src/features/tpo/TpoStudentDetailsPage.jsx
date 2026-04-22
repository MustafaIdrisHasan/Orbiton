import { useParams } from "react-router-dom";
import { tpoStudents } from "./tpoData";

export function TpoStudentDetailsPage() {
  const { id } = useParams();
  const student = tpoStudents.find((item) => item.id === id);

  if (!student) {
    return (
      <section className="empty-state">
        <p className="eyebrow">TPO Workspace</p>
        <h2>Student not found</h2>
        <p className="muted">Open a student record from the student management route.</p>
      </section>
    );
  }

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student Details</p>
          <h2>{student.name}</h2>
          <p className="muted">
            {student.department} • CGPA {student.cgpa} • {student.status}
          </p>
        </div>
      </header>

      <div className="detail-grid">
        <div className="detail-item">
          <span className="subtle">Resume</span>
          <strong>{student.resume}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Applications</span>
          <strong>{student.applications}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Backlogs</span>
          <strong>{student.backlogs}</strong>
        </div>
        <div className="detail-item">
          <span className="subtle">Action Flag</span>
          <strong>{student.status === "Attention" ? "Needs intervention" : "Healthy"}</strong>
        </div>
      </div>
    </section>
  );
}
