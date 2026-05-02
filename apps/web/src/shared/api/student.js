import { apiRequest } from "./client";

const DEMO_COMPANY = "Northstar AI";

function unwrapItems(payload) {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload.items)) {
    return payload.items;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return [];
}

/** @param {string|undefined} status */
export function normalizeDriveUiStatus(status) {
  const u = String(status || "").toUpperCase();
  if (u === "ACTIVE" || u === "OPEN" || u === "PUBLISHED") {
    return "Open";
  }
  return "Closed";
}

/**
 * @param {object} raw
 * @param {string} [companyName]
 */
export function normalizeDrive(raw, companyName = DEMO_COMPANY) {
  const deadline = raw.applicationDeadline || raw.date || raw.deadlineAt;
  const pkg = raw.packageLpa ?? raw.package ?? null;
  return {
    id: raw.id,
    companyName: raw.companyName || raw.company || companyName,
    roleTitle: raw.roleTitle || raw.title || raw.role || "Placement role",
    logoUrl: raw.logoUrl || null,
    description: raw.description || "",
    packageLpa: pkg != null && pkg !== "" ? Number(pkg) : null,
    department: raw.department || null,
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    minCgpa: raw.minCgpa != null ? Number(raw.minCgpa) : null,
    deadlineAt: deadline,
    status: normalizeDriveUiStatus(raw.status),
    rawStatus: raw.status,
    isFeatured: Boolean(raw.isFeatured),
    openings: raw.openings,
    location: raw.location || "",
    eligibleDepartments: Array.isArray(raw.eligibleDepartments) ? raw.eligibleDepartments : [],
    employmentType: raw.employmentType || "FULL_TIME",
    maxBacklogs: raw.maxBacklogs != null ? Number(raw.maxBacklogs) : null,
    eligibleYears: Array.isArray(raw.eligibleYears) ? raw.eligibleYears : [],
    requiredSkills: Array.isArray(raw.requiredSkills) ? raw.requiredSkills : []
  };
}

export function fetchDrivesList() {
  return apiRequest("/api/v1/drives");
}

export function fetchFeaturedDrives() {
  return apiRequest("/api/v1/drives/featured/list");
}

export function fetchDriveById(id) {
  return apiRequest(`/api/v1/drives/${encodeURIComponent(id)}`);
}

export function fetchApplicationsList() {
  return apiRequest("/api/v1/applications");
}

export function fetchApplicationById(id) {
  return apiRequest(`/api/v1/applications/${encodeURIComponent(id)}`);
}

export function fetchRoundsList(params = {}) {
  const q = params.driveId ? `?driveId=${encodeURIComponent(params.driveId)}` : "";
  return apiRequest(`/api/v1/rounds${q}`);
}

export function fetchOffersList() {
  return apiRequest("/api/v1/offers");
}

export function fetchNotificationsList() {
  return apiRequest("/api/v1/notifications");
}

export function fetchStudentProfileMe() {
  return apiRequest("/api/v1/students/profile/me");
}

export function applyToDriveRequest(driveId) {
  return apiRequest(`/api/v1/applications/apply/${encodeURIComponent(driveId)}`, {
    method: "POST"
  });
}

export function withdrawApplicationRequest(applicationId) {
  return apiRequest(`/api/v1/applications/${encodeURIComponent(applicationId)}`, {
    method: "DELETE"
  });
}

export function updateOfferRequest(offerId, body) {
  return apiRequest(`/api/v1/offers/${encodeURIComponent(offerId)}`, {
    method: "PATCH",
    body
  });
}

/**
 * Normalize list API payloads to drive cards.
 * @param {object|null} drivesPayload
 * @param {object|null} featuredPayload
 */
export function mergeFeaturedAndAllDrives(drivesPayload, featuredPayload) {
  const allRaw = unwrapItems(drivesPayload);
  const featuredRaw = unwrapItems(featuredPayload);
  const all = allRaw.map((d) => normalizeDrive(d));
  const featured = featuredRaw.map((d) => normalizeDrive(d));
  if (featured.length > 0) {
    return { all, featured };
  }
  const urgent = [...all].filter((d) => d.status === "Open").sort((a, b) => String(a.deadlineAt).localeCompare(String(b.deadlineAt)));
  return { all, featured: urgent.slice(0, 6) };
}

export { pickRecommendedDrives } from "./studentRecommendations.js";

/**
 * @param {ReturnType<normalizeDrive>[]} drives
 * @param {object|null} profile
 */
export function countEligibleDrives(drives, profile) {
  const cgpa = profile ? Number(profile.cgpa) || 0 : 0;
  const dept = profile?.department ? String(profile.department).trim() : "";
  return drives.filter((d) => {
    if (d.status !== "Open") {
      return false;
    }
    if (d.minCgpa != null && cgpa < d.minCgpa) {
      return false;
    }
    if (dept && d.eligibleDepartments?.length && !d.eligibleDepartments.includes(dept)) {
      return false;
    }
    return true;
  }).length;
}

export function normalizeApplicationRow(raw, driveTitleFallback = "") {
  const id = raw.applicationId || raw.id;
  const status = raw.status || "APPLIED";
  return {
    id,
    driveId: raw.driveId || null,
    companyName: raw.companyName || raw.driveCompany || DEMO_COMPANY,
    roleTitle: raw.roleTitle || raw.driveTitle || driveTitleFallback,
    status,
    currentRound: raw.currentRound || "",
    email: raw.email || null,
    withdrawable: status === "APPLIED" || status === "SHORTLISTED"
  };
}

export function normalizeOfferRow(raw) {
  return {
    id: raw.offerId || raw.id,
    applicationId: raw.applicationId,
    driveId: raw.driveId,
    companyName: raw.companyName || DEMO_COMPANY,
    roleTitle: raw.driveTitle || raw.roleTitle || "Role",
    packageLpa: raw.packageLpa != null ? Number(raw.packageLpa) : null,
    joiningDate: raw.joiningDate || null,
    status: raw.status,
    email: raw.email || null
  };
}

export function normalizeRoundRow(raw, driveMap) {
  const drive = driveMap.get(raw.driveId);
  return {
    id: raw.id,
    candidateId: raw.candidateId,
    driveId: raw.driveId,
    companyName: drive?.companyName || raw.companyName || DEMO_COMPANY,
    roleTitle: drive?.roleTitle || raw.roleTitle || raw.role || "Role",
    roundName: raw.round || raw.roundName || "Round",
    dateTime: raw.slot || raw.dateTime,
    mode: raw.mode || "Online",
    locationOrLink: raw.panel || raw.locationOrLink || ""
  };
}
