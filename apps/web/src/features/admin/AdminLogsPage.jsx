import { useMemo, useState } from "react";
import { adminDashboardData } from "./adminData";

export function AdminLogsPage() {
  const [actionFilter, setActionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("");

  const logs = useMemo(() => {
    const query = userFilter.trim().toLowerCase();

    return adminDashboardData.logs.filter((log) => {
      if (actionFilter !== "All" && log.action !== actionFilter) {
        return false;
      }
      if (statusFilter !== "All" && log.status !== statusFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return log.user.toLowerCase().includes(query);
    });
  }, [actionFilter, statusFilter, userFilter]);

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin Workspace</p>
          <h2>System Activity / Audit Logs</h2>
          <p className="muted">Filter operational activity by action, user, or result status to review security-sensitive events.</p>
        </div>
      </header>

      <div className="filters-bar recruiter-filter-bar">
        <label>
          User
          <input type="text" placeholder="Search user" value={userFilter} onChange={(event) => setUserFilter(event.target.value)} />
        </label>
        <label>
          Action Type
          <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
            <option>All</option>
            <option>LOGIN</option>
            <option>ROLE_UPDATE</option>
            <option>DISABLE_USER</option>
            <option>EXPORT_REPORT</option>
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All</option>
            <option>Success</option>
            <option>Failure</option>
          </select>
        </label>
      </div>

      <div className="candidate-table-shell">
        <table className="candidate-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity Affected</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.timestamp}</td>
                <td>{log.user}</td>
                <td>{log.action}</td>
                <td>{log.entity}</td>
                <td>{log.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="subtle">Date-range and pagination hooks can be added directly to this scaffold during API integration.</p>
    </section>
  );
}
