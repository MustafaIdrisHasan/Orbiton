import { useCallback, useEffect, useState } from "react";
import { fetchAdminDrives } from "../../shared/api/admin";

const FILTERS = [
  { id: "ALL", label: "All", role: null },
  { id: "TPO", label: "TPO drives", role: "TPO" },
  { id: "RECRUITER", label: "Recruiter drives", role: "RECRUITER" },
];

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return String(value);
  }
}

export function AdminDrivesPage() {
  const [filter, setFilter] = useState("ALL");
  const [drives, setDrives] = useState([]);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (chosenFilter) => {
    setLoading(true);
    setError("");
    try {
      const meta = FILTERS.find((f) => f.id === chosenFilter) || FILTERS[0];
      const result = await fetchAdminDrives({
        createdByRole: meta.role || undefined,
      });
      setDrives(result.items);
      setSource(result.source);
    } catch (err) {
      setError(err?.message || "Could not load drives");
      setDrives([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin Workspace</p>
          <h2>Drive Oversight</h2>
          <p className="muted">
            Real drives from PostgreSQL — filter by creator role to see TPO-created vs recruiter-created drives.
          </p>
          {source === "mock" ? (
            <p className="card-note">
              No drives in PostgreSQL yet — showing seed data. Create a drive as a TPO or recruiter to see live rows.
            </p>
          ) : null}
          {error ? <p className="card-note">{error}</p> : null}
        </div>
        <div className="notifications-tabs" role="tablist" aria-label="Drive filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`notifications-tab ${filter === f.id ? "is-active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="candidate-table-shell">
        <table className="candidate-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created By</th>
              <th>Deadline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="muted">Loading drives…</td>
              </tr>
            ) : null}
            {!loading && drives.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">No drives match this filter.</td>
              </tr>
            ) : null}
            {drives.map((drive) => (
              <tr key={drive.id}>
                <td>{drive.company || "—"}</td>
                <td>{drive.role || "—"}</td>
                <td>{drive.status || "DRAFT"}</td>
                <td>{drive.createdBy || "—"}</td>
                <td>{formatDate(drive.deadline)}</td>
                <td>
                  <div className="table-actions">
                    <button className="table-icon-button" type="button">View</button>
                    <button className="table-icon-button" type="button">Force Update</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
