import { apiRequest, ApiClientError } from "./client";

export async function fetchMatchingDrives() {
  try {
    return await apiRequest("/api/v1/matching/drives");
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchMatchingStudents(driveId) {
  try {
    return await apiRequest(
      `/api/v1/matching/students?driveId=${encodeURIComponent(driveId)}`
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
