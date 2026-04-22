import { apiRequest } from "./client";

export function fetchAdminDashboard() {
  return apiRequest("/api/v1/admin/dashboard");
}
