import { Link } from "react-router-dom";

export function ErrorPage() {
  return (
    <div className="empty-state">
      <h2>Something went wrong</h2>
      <p className="muted">This route hit an unexpected rendering error.</p>
      <Link to="/dashboard" className="button">
        Back to dashboard
      </Link>
    </div>
  );
}

