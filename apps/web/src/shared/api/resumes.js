import { apiRequest, ApiClientError, getStoredAuthToken } from "./client";

export const RESUME_FEATURE_DISABLED = "RESUME_FEATURE_DISABLED";

function rethrowFeatureFlag(error) {
  if (error instanceof ApiClientError && error.status === 404) {
    const wrapped = new ApiClientError(
      "Resume scoring is disabled in this environment.",
      404,
      RESUME_FEATURE_DISABLED
    );
    throw wrapped;
  }
  throw error;
}

export async function fetchStudentProfileFull() {
  try {
    return await apiRequest("/api/v1/students/profile/me/full");
  } catch (error) {
    rethrowFeatureFlag(error);
    return null;
  }
}

export async function putResumeProfile(profile) {
  try {
    return await apiRequest("/api/v1/resumes/me/profile", {
      method: "PUT",
      body: profile
    });
  } catch (error) {
    rethrowFeatureFlag(error);
    return null;
  }
}

export async function analyzeResume(resumeId, body) {
  try {
    return await apiRequest(`/api/v1/resumes/${encodeURIComponent(resumeId)}/analyze`, {
      method: "POST",
      body: body || {}
    });
  } catch (error) {
    rethrowFeatureFlag(error);
    return null;
  }
}

export async function fetchResumeScore(resumeId) {
  try {
    return await apiRequest(`/api/v1/resumes/${encodeURIComponent(resumeId)}/score`);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function uploadResumePdf(file) {
  const baseUrl = import.meta.env.VITE_API_URL || "";
  const token = getStoredAuthToken();
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${baseUrl}/api/v1/resumes/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (response.status === 404) {
    throw new ApiClientError(
      "Resume scoring is disabled in this environment.",
      404,
      RESUME_FEATURE_DISABLED
    );
  }
  if (response.status === 413) {
    throw new ApiClientError(
      "File too large. Maximum size is 5 MB.",
      413,
      "FILE_TOO_LARGE",
      payload
    );
  }
  if (!response.ok) {
    throw new ApiClientError(
      payload?.message || "Upload failed",
      response.status,
      payload?.code || "UPLOAD_FAILED",
      payload
    );
  }
  return payload;
}
