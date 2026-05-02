import { normalizeDrive } from "../api/student";

export const CLOSING_SOON_DAYS = 7;

/** How often to refetch published drives while student drive UIs are open (ms). */
export const DRIVES_LIST_POLL_MS = 20000;

/**
 * Open | Closing soon | Closed — derived from API status and deadline.
 * @param {string|undefined} rawStatus
 * @param {string|undefined} deadlineIso
 */
export function computeDisplayStatus(rawStatus, deadlineIso) {
  const u = String(rawStatus || "").toUpperCase();
  const deadlineMs = deadlineIso ? new Date(deadlineIso).getTime() : NaN;

  if (u === "CLOSED" || u === "DRAFT") {
    return "Closed";
  }

  if (!Number.isNaN(deadlineMs) && deadlineMs < Date.now()) {
    return "Closed";
  }

  if (u === "ACTIVE" || u === "OPEN" || u === "PUBLISHED") {
    if (!Number.isNaN(deadlineMs)) {
      const days = (deadlineMs - Date.now()) / 86400000;
      if (days >= 0 && days <= CLOSING_SOON_DAYS) {
        return "Closing soon";
      }
    }
    return "Open";
  }

  return "Closed";
}

/**
 * @param {object} raw API drive list or detail item
 */
export function normalizeListingDrive(raw) {
  const base = normalizeDrive(raw);
  const displayStatus = computeDisplayStatus(raw.status, base.deadlineAt);
  return {
    ...base,
    displayStatus,
    requiredSkills: base.requiredSkills?.length ? base.requiredSkills : base.skills
  };
}

/**
 * @param {object} raw API drive detail
 */
export function normalizeDetailDrive(raw) {
  const listing = normalizeListingDrive(raw);
  return {
    ...listing,
    roundDeadlines: Array.isArray(raw.roundDeadlines)
      ? raw.roundDeadlines.map((r) => ({
          id: r.id,
          label: r.label,
          date: r.date
        }))
      : [],
    recruiter: raw.recruiter || null
  };
}

/**
 * @param {object|null} profile from /students/profile/me
 * @param {ReturnType<normalizeListingDrive>} drive
 * @returns {"neutral"|"eligible"|"borderline"|"ineligible"}
 */
/**
 * Same rule as API skill gate: drives with no required skills always qualify;
 * otherwise the student must list every required skill (case-insensitive).
 * @param {object|null} profile
 * @param {object} drive listing drive with requiredSkills
 */
export function skillsAlignWithProfile(profile, drive) {
  const required = (drive.requiredSkills || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  if (required.length === 0) {
    return true;
  }
  const have = new Set((profile?.skills || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean));
  return required.every((r) => have.has(r));
}

export function eligibilityTier(profile, drive) {
  if (!profile || !profile.department) {
    return "neutral";
  }

  const dept = String(profile.department).trim();
  const cgpa = Number(profile.cgpa);
  const backlogs = Number(profile.backlogs ?? 0);

  if (drive.eligibleDepartments?.length && dept && !drive.eligibleDepartments.includes(dept)) {
    return "ineligible";
  }

  if (drive.minCgpa != null) {
    if (Number.isNaN(cgpa)) {
      return "neutral";
    }
    if (cgpa < drive.minCgpa) {
      return "ineligible";
    }
  }

  if (drive.maxBacklogs != null && backlogs > drive.maxBacklogs) {
    return "ineligible";
  }

  if (drive.minCgpa != null && !Number.isNaN(cgpa) && cgpa >= drive.minCgpa && cgpa < drive.minCgpa + 0.5) {
    return "borderline";
  }

  return "eligible";
}
