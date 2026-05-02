import { apiRequest } from "./client";

export function fetchNotifications() {
  return apiRequest("/api/v1/notifications");
}

export function markNotificationRead(id) {
  return apiRequest(`/api/v1/notifications/${encodeURIComponent(id)}/read`, {
    method: "POST"
  });
}

export function markAllNotificationsRead() {
  return apiRequest("/api/v1/notifications/read-all", {
    method: "POST"
  });
}
