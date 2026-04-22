import { apiRequest } from "./client";

export function fetchTpoDashboard() {
  return apiRequest("/api/v1/tpo/dashboard");
}

export async function fetchTpoAnnouncements() {
  const data = await apiRequest("/api/v1/tpo/announcements");
  return data.items || [];
}

export async function createTpoAnnouncement(payload) {
  const data = await apiRequest("/api/v1/tpo/announcements", {
    method: "POST",
    body: payload
  });

  return data.item;
}
