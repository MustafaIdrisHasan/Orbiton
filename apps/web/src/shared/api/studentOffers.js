import { apiRequest } from "./client";

export async function fetchStudentOffers() {
  const data = await apiRequest("/api/v1/offers/me");
  return Array.isArray(data?.items) ? data.items : [];
}

export function respondToOffer(offerId, response) {
  return apiRequest(`/api/v1/offers/${encodeURIComponent(offerId)}/respond`, {
    method: "POST",
    body: { response }
  });
}
