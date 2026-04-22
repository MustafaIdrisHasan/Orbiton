import { apiRequest } from "./client";

export function loginRequest(credentials) {
  return apiRequest("/api/v1/auth/login", {
    method: "POST",
    body: credentials
  });
}

export function getCurrentUserRequest(token) {
  return apiRequest("/api/v1/auth/me", { token });
}
