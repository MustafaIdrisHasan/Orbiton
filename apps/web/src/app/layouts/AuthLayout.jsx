import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="auth-shell">
      <section className="hero-card">
        <p className="eyebrow">Orbiton</p>
        <h1>Placement workflows built for clarity</h1>
        <p className="muted">
          Start with role-aware access, modular CRUD flows, and a clean path into analytics and
          intelligence.
        </p>
      </section>
      <section className="auth-card">
        <Outlet />
      </section>
    </div>
  );
}

