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

export async function fetchDrivesList() {
  const data = await apiRequest("/api/v1/drives");
  return unwrapItems(data);
}

export async function fetchFeaturedDrivesList() {
  const data = await apiRequest("/api/v1/drives/featured/list");
  return unwrapItems(data);
}

export function fetchDriveDetail(id) {
  return apiRequest(`/api/v1/drives/${encodeURIComponent(id)}`);
}

/** Recruiter / TPO: drives owned by the campus placement account (requires RECRUITER or TPO session). */
export async function fetchMyDrives() {
  const data = await apiRequest("/api/v1/drives?created_by=me");
  return unwrapItems(data);
}

export function createDrive(body) {
  return apiRequest("/api/v1/drives", {
    method: "POST",
    body
  });
}

export function patchDriveStatus(id, status) {
  return apiRequest(`/api/v1/drives/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { status }
  });
}

export function patchDrive(id, body) {
  return apiRequest(`/api/v1/drives/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body
  });
}

export function deleteDrive(id) {
  return apiRequest(`/api/v1/drives/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}
