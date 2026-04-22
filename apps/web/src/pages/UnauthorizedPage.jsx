import { Link } from "react-router-dom";

export function UnauthorizedPage() {
  return (
    <div className="empty-state">
      <h2>Unauthorized</h2>
      <p className="muted">Your current role does not have access to this workspace.</p>
      <Link to="/dashboard" className="button">
        Back to dashboard
      </Link>
    </div>
  );
}

