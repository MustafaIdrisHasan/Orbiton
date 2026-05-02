import { apiRequest } from "./client";

export function fetchAdminDashboard() {
  return apiRequest("/api/v1/admin/dashboard");
}

/**
 * @param {{ createdByRole?: string, createdByUserId?: string }} [filters]
 */
export async function fetchAdminDrives(filters = {}) {
  const qs = new URLSearchParams();
  if (filters.createdByRole) qs.set("created_by_role", filters.createdByRole);
  if (filters.createdByUserId) qs.set("created_by_user_id", filters.createdByUserId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const data = await apiRequest(`/api/v1/admin/drives${suffix}`);
  return {
    items: data?.items || [],
    source: data?.source || "unknown",
  };
}

export async function fetchAdminUsers() {
  const data = await apiRequest("/api/v1/admin/users");
  return data?.items || [];
}
