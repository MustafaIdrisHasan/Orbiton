import { Navigate, useParams } from "react-router-dom";

/** @deprecated Use global `/drives/:id` (DriveDetailsPage). */
export function StudentDriveDetailsPage() {
  const { id } = useParams();
  return <Navigate to={`/drives/${id}`} replace />;
}
