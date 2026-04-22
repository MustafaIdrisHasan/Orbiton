import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="empty-state">
      <h2>Page not found</h2>
      <p className="muted">The requested Orbiton route does not exist yet.</p>
      <Link to="/dashboard" className="button">
        Back to dashboard
      </Link>
    </div>
  );
}

