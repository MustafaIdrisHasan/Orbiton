import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminDashboardData } from "./adminData";

function UserDrawer({ user, onClose }) {
  if (!user) {
    return null;
  }

  return (
    <>
      <button aria-label="Close user drawer" className="drawer-backdrop" type="button" onClick={onClose} />
      <aside className="candidate-drawer">
        <header className="drawer-header">
          <div>
            <p className="eyebrow">User Profile</p>
            <h2>{user.name}</h2>
            <p className="muted">
              {user.email} • {user.role}
            </p>
            <Link className="subtle" to={`/admin/users/${user.id}`}>
              Open full user page
            </Link>
          </div>
          <button className="drawer-close" type="button" onClick={onClose}>
            Close
          </button>
        </header>

        <section className="candidate-drawer-section">
          <h3>Personal Details</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="subtle">Phone</span>
              <strong>{user.details.phone}</strong>
            </div>
            <div className="detail-item">
              <span className="subtle">Department / Org</span>
              <strong>{user.details.department}</strong>
            </div>
          </div>
        </section>

        <section className="candidate-drawer-section">
          <h3>Role Information</h3>
          <div className="detail-item">
            <strong>{user.role}</strong>
            <p className="card-note">{user.details.roleInfo}</p>
          </div>
        </section>

        <section className="candidate-drawer-section">
          <h3>Account Status</h3>
          <div className="detail-item">
            <strong>{user.status}</strong>
            <p className="card-note">{user.details.accountStatus}</p>
          </div>
        </section>

        <section className="candidate-drawer-section">
          <h3>Activity Summary</h3>
          <div className="detail-item">
            <p className="card-note">{user.details.activitySummary}</p>
          </div>
        </section>

        <div className="drawer-actions">
          <button className="button button-secondary" type="button">
            Reset Password
          </button>
          <button className="button" type="button">
            Change Role
          </button>
          <button className="button button-danger" type="button">
            Disable Account
          </button>
        </div>
      </aside>
    </>
  );
}

export function AdminUsersTable({ compact = false, usersData = adminDashboardData.users }) {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return usersData.filter((user) => {
      if (roleFilter !== "All" && user.role !== roleFilter) {
        return false;
      }
      if (statusFilter !== "All" && user.status !== statusFilter) {
        return false;
      }
      if (!query) {
        return true;
      }

      return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
    });
  }, [roleFilter, search, statusFilter, usersData]);

  const users = compact ? filteredUsers.slice(0, 4) : filteredUsers;
  const selectedUser = usersData.find((user) => user.id === selectedUserId) || null;

  return (
    <>
      <div className="filters-bar recruiter-filter-bar">
        <label>
          Search
          <input type="text" placeholder="Search name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label>
          Role
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option>All</option>
            <option>STUDENT</option>
            <option>RECRUITER</option>
            <option>TPO</option>
            <option>FACULTY</option>
            <option>ADMIN</option>
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All</option>
            <option>Active</option>
            <option>Disabled</option>
          </select>
        </label>
      </div>

      <div className="candidate-table-shell">
        <table className="candidate-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <button className="candidate-link" type="button" onClick={() => setSelectedUserId(user.id)}>
                    {user.name}
                  </button>
                </td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.status}</td>
                <td>{user.lastLogin}</td>
                <td>
                  <div className="table-actions admin-table-actions">
                    <Link className="table-icon-button table-link-button" to={`/admin/users/${user.id}`}>
                      View
                    </Link>
                    <button className="table-icon-button" type="button">
                      Edit
                    </button>
                    <button className="table-icon-button" type="button">
                      Reset
                    </button>
                    <button className="table-icon-button" type="button">
                      Role
                    </button>
                    <button className="table-icon-button danger" type="button">
                      {user.status === "Active" ? "Disable" : "Enable"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!compact ? <p className="subtle">Pagination-ready scaffold: showing {users.length} filtered users.</p> : null}

      <UserDrawer user={selectedUser} onClose={() => setSelectedUserId(null)} />
    </>
  );
}
