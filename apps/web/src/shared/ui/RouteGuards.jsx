import { Navigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";

export function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <section className="empty-state">Loading session...</section>;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}

export function RequireRole({ roles, children }) {
  const { user, isLoading } = useAuth();
  const currentRole = user?.roles?.[0];

  if (isLoading) {
    return <section className="empty-state">Loading session...</section>;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!roles.includes(currentRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export function RoleHomeRedirect() {
  const { user, isLoading } = useAuth();
  const role = user?.roles?.[0];

  if (isLoading) {
    return <section className="empty-state">Loading session...</section>;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const target =
    {
      STUDENT: "/student",
      RECRUITER: "/recruiter",
      FACULTY: "/faculty",
      ADMIN: "/admin/dashboard",
      TPO: "/tpo/dashboard"
    }[role] || "/dashboard";

  return <Navigate to={target} replace />;
}
