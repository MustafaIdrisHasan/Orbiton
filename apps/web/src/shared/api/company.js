import { apiRequest } from "./client";

export function fetchCompanyProfile() {
  return apiRequest("/api/v1/companies/me/profile");
}

export function updateCompanyProfile(payload) {
  return apiRequest("/api/v1/companies/me/profile", {
    method: "PUT",
    body: payload,
  });
}

export async function fetchCompanyDrives() {
  const data = await apiRequest("/api/v1/companies/me/drives");
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    companyName: data?.companyName || "",
  };
}

export async function fetchCompanyApplicants() {
  const data = await apiRequest("/api/v1/companies/me/applicants");
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    companyName: data?.companyName || "",
  };
}

export function contactCompanyApplicant(payload) {
  return apiRequest("/api/v1/companies/me/contact", {
    method: "POST",
    body: payload,
  });
}

export function giveOffer(payload) {
  return apiRequest("/api/v1/companies/me/offer", {
    method: "POST",
    body: payload,
  });
}

export async function fetchMyOffers() {
  const data = await apiRequest("/api/v1/companies/me/offers");
  return Array.isArray(data?.items) ? data.items : [];
}
