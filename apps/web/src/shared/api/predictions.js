import { apiRequest, ApiClientError } from "./client";

export const PREDICTION_UNAVAILABLE = "PREDICTION_UNAVAILABLE";

export async function predictPlacement(body) {
  try {
    return await apiRequest("/api/v1/predictions/placement", {
      method: "POST",
      body: body || {}
    });
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 404 || error.status === 503)) {
      const wrapped = new ApiClientError(
        "Prediction service is unavailable.",
        error.status,
        PREDICTION_UNAVAILABLE,
        error.details
      );
      throw wrapped;
    }
    throw error;
  }
}
