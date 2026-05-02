import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";

const devPortal = import.meta.env.VITE_DEV_PORTAL;

function devPortalLabel(portal) {
  if (portal === "student") return "Student (local dev)";
  if (portal === "tpo") return "TPO (local dev)";
  return null;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isLoading, authError, clearAuthError } = useAuth();
  const portalHint = devPortalLabel(devPortal);
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [formError, setFormError] = useState("");

  if (user) {
    return <Navigate to="/home" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearAuthError();
    setFormError("");

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      setFormError("Email and password are required.");
      return;
    }

    try {
      await login({ email, password });
      navigate("/home", { replace: true });
    } catch (_error) {
      // AuthProvider already exposes the human-readable error message.
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Authentication</p>
        <h2>Sign in to Orbiton</h2>
        {portalHint ? <p className="muted">{portalHint}</p> : null}
      </div>

      <label className="settings-field">
        Email
        <input
          className="profile-input"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          placeholder="you@orbiton"
          autoComplete="username"
        />
      </label>

      <label className="settings-field">
        Password
        <input
          className="profile-input"
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
      </label>

      {formError || authError ? <p className="form-error">{formError || authError}</p> : null}

      <div className="actions auth-actions">
        <button className="button" type="submit" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
        <button className="button button-secondary" type="button" onClick={() => setFormError("Forgot password flow is scaffolded and will be connected next.")}>
          Forgot password?
        </button>
      </div>
    </form>
  );
}
