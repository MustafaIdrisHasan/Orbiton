import { AdminUsersTable } from "./AdminUsersTable";

export function AdminUsersPage() {
  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin Workspace</p>
          <h2>User Management</h2>
          <p className="muted">Search, filter, review, edit, and secure all users from a single admin-controlled workspace.</p>
        </div>
      </header>

      <AdminUsersTable />
    </section>
  );
}
