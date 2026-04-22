import { Link } from "react-router-dom";
import { tpoStudents } from "./tpoData";

export function TpoStudentsPage() {
  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">TPO Workspace</p>
          <h2>All Students</h2>
          <p className="muted">Manage placement readiness, profile completeness, and institution-level student attention queues.</p>
        </div>
      </header>

      <div className="candidate-table-shell">
        <table className="candidate-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>CGPA</th>
              <th>Resume</th>
              <th>Applications</th>
              <th>Backlogs</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tpoStudents.map((student) => (
              <tr key={student.id}>
                <td>
                  <Link className="candidate-link" to={`/tpo/students/${student.id}`}>
                    {student.name}
                  </Link>
                </td>
                <td>{student.department}</td>
                <td>{student.cgpa}</td>
                <td>{student.resume}</td>
                <td>{student.applications}</td>
                <td>{student.backlogs}</td>
                <td>{student.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
