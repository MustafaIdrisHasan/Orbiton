import { apiRequest } from "./client";

export function fetchTpoDashboard() {
  return apiRequest("/api/v1/tpo/dashboard");
}

export async function fetchTpoAnnouncements() {
  const data = await apiRequest("/api/v1/tpo/announcements");
  return data?.items || [];
}

export async function createTpoAnnouncement(payload) {
  const data = await apiRequest("/api/v1/tpo/announcements", {
    method: "POST",
    body: payload,
  });
  return data?.item;
}

export async function fetchTpoStudents() {
  const data = await apiRequest("/api/v1/tpo/students");
  return data?.items || [];
}

export function fetchTpoStudent(id) {
  return apiRequest(`/api/v1/tpo/students/${encodeURIComponent(id)}`);
}

export async function fetchTpoStudentResumes(id) {
  const data = await apiRequest(`/api/v1/tpo/students/${encodeURIComponent(id)}/resumes`);
  return data?.items || [];
}

export function fetchTpoApplicationProfile(applicationId) {
  return apiRequest(`/api/v1/tpo/applications/${encodeURIComponent(applicationId)}/profile`);
}
