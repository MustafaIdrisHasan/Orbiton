import { apiRequest } from "./client";

/** Returns the authenticated student's uploaded resumes. */
export async function fetchMyResumes() {
  const data = await apiRequest("/api/v1/resumes/me/list");
  return data?.items || [];
}

export function setActiveResume(resumeId) {
  return apiRequest(`/api/v1/resumes/${encodeURIComponent(resumeId)}/activate`, {
    method: "POST"
  });
}

/** Permanently removes an uploaded resume the current user owns. */
export function deleteMyResume(resumeId) {
  return apiRequest(`/api/v1/resumes/${encodeURIComponent(resumeId)}`, {
    method: "DELETE"
  });
}
