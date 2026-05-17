import { apiRequest } from "./client";

export async function fetchChatRooms() {
  const data = await apiRequest("/api/v1/chat/rooms");
  return Array.isArray(data?.rooms) ? data.rooms : [];
}

export async function fetchMessages(roomId) {
  const data = await apiRequest(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/messages`);
  return Array.isArray(data?.messages) ? data.messages : [];
}

export function sendMessage(roomId, message) {
  return apiRequest(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/messages`, {
    method: "POST",
    body: { message }
  });
}

export function ensureRoom() {
  return apiRequest("/api/v1/chat/rooms", { method: "POST" });
}
