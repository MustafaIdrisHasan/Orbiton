import { apiRequest } from "./client";

function unwrapItems(payload) {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload.items)) {
    return payload.items;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return [];
}

export async function fetchCompanies() {
  const data = await apiRequest("/api/v1/companies");
  return unwrapItems(data);
}

export function fetchCompanyById(id) {
  return apiRequest(`/api/v1/companies/${encodeURIComponent(id)}`);
}
