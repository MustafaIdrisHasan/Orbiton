import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-bg-geo" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} className="auth-bg-square" />
        ))}
      </div>
      <header className="auth-branding">
        <p className="eyebrow auth-brand-eyebrow">Orbiton</p>
        <h1 className="auth-brand-title">Placement workflows built for clarity</h1>
      </header>
      <section className="auth-card">
        <Outlet />
      </section>
    </div>
  );
}

