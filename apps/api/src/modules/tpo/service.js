const { tpoDashboardData, tpoStudents } = require("./mockData");
const pgRepo = require("./repository.postgres");
const notificationsService = require("../notifications/service");
const audience = require("../notifications/audience");
const applicationsService = require("../applications/service");
const resumeListService = require("../resumes/list.service");
const { pool } = require("../../integrations/postgres/pool");

function getDashboard() {
  return tpoDashboardData;
}

async function listStudents() {
  const pgItems = await pgRepo.listStudents().catch(() => null);
  if (Array.isArray(pgItems) && pgItems.length > 0) {
    return { items: pgItems };
  }
  // Fall back to the seed/mock list when no DB rows yet.
  return { items: tpoStudents };
}

async function getStudent(studentId) {
  const pgItem = await pgRepo.getStudent(studentId).catch(() => null);
  if (pgItem) return pgItem;
  return tpoStudents.find((s) => s.id === studentId) || null;
}

async function getStudentResumes(studentIdOrUserIdOrEmail) {
  if (!studentIdOrUserIdOrEmail) return { items: [] };

  // First try the existing tpo PG repo (handles UUID inputs).
  let items = await pgRepo.listStudentResumes(studentIdOrUserIdOrEmail).catch(() => []);
  if (Array.isArray(items) && items.length > 0) {
    return { items };
  }

  // If still nothing and the input looks like an email, resolve user_id then list.
  const looksLikeEmail = String(studentIdOrUserIdOrEmail).includes("@");
  if (looksLikeEmail && pool) {
    try {
      const userRow = await pool.query(
        `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [String(studentIdOrUserIdOrEmail).trim()],
      );
      const userId = userRow.rows[0]?.id;
      if (userId) {
        items = await resumeListService.listForUserId(userId);
        return { items: items || [] };
      }
    } catch {
      /* fall through with empty list */
    }
  }

  return { items: items || [] };
}

/**
 * Resolve the PG student identity for an applicant snapshot. Applications
 * still live in the in-memory recruiterStore so we have email/rollNumber
 * but not the canonical UUIDs; this look-up bridges that gap until the
 * applications module is migrated to PG.
 *
 * Returns `{ userId, studentProfileId, fullName, department, ... }` or null.
 */
async function _resolveStudentIdentityByEmail(email) {
  if (!email || !pool) return null;
  try {
    const result = await pool.query(
      `SELECT u.id AS user_id,
              u.email,
              sp.id AS student_profile_id,
              sp.full_name,
              sp.department,
              sp.program,
              sp.year_of_study,
              sp.cgpa,
              sp.backlog_count
         FROM users u
         LEFT JOIN student_profiles sp ON sp.user_id = u.id
        WHERE LOWER(u.email) = LOWER($1)
        LIMIT 1`,
      [String(email).trim()],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      userId: row.user_id,
      studentProfileId: row.student_profile_id,
      fullName: row.full_name,
      email: row.email,
      department: row.department,
      program: row.program,
      year: row.year_of_study,
      cgpa: row.cgpa != null ? Number(row.cgpa) : null,
      backlogs: row.backlog_count != null ? Number(row.backlog_count) : 0,
    };
  } catch {
    return null;
  }
}

async function getApplicationProfile(applicationId) {
  // Pull the in-memory candidate snapshot (created when the student applied).
  const profile = applicationsService.getCandidateProfile(applicationId);
  if (!profile) return null;

  // Enrich with PG identity + resumes when the applicant matches a user_id.
  const email = profile.personalDetails?.email || null;
  const identity = await _resolveStudentIdentityByEmail(email);

  let resumes = [];
  if (identity?.userId) {
    try {
      resumes = await resumeListService.listForUserId(identity.userId);
    } catch {
      resumes = [];
    }
  }

  return {
    ...profile,
    student: identity || null,        // canonical PG identity (may be null for non-seed students)
    studentUserId: identity?.userId || null,
    studentProfileId: identity?.studentProfileId || null,
    // Always include the resume list inline so the TPO doesn't need a 2nd round-trip.
    resumes,
    // Override the snapshot's "Student" name with the real one when we have it.
    personalDetails: {
      ...profile.personalDetails,
      name:
        identity?.fullName
        || profile.personalDetails?.name
        || (email ? email.split("@")[0] : "Student"),
    },
  };
}

function listDrives() {
  return { items: tpoDashboardData.activeDrives };
}

function getDrive(driveId) {
  return tpoDashboardData.activeDrives.find((drive) => drive.id === driveId) || null;
}

function listReports() {
  return { items: tpoDashboardData.reports };
}

async function listAnnouncements() {
  // Mock keeps a "recent" list for backwards-compatibility with the dashboard;
  // the canonical record is now in `notifications` (broadcasts), but listing
  // every fan-out row here would duplicate per-student. We return the legacy
  // tpoDashboardData.announcements.recent which the createAnnouncement call
  // appends to so the TPO sees their own post-history.
  return { items: tpoDashboardData.announcements.recent };
}

/**
 * Persist a TPO announcement: fan-out to every STUDENT user via the
 * notifications service, and also keep a thin "recent broadcasts" entry
 * for the TPO history pane.
 */
async function createAnnouncement(payload = {}) {
  const message = String(payload.message || "").trim();
  if (!message) {
    return { error: "EMPTY_MESSAGE" };
  }
  const audienceLabel = payload.audience || "All students";
  const audienceRoles = Array.isArray(payload.audienceRoles) && payload.audienceRoles.length
    ? payload.audienceRoles
    : ["STUDENT"];

  const fanOut = await notificationsService.createBroadcast({
    type: "ANNOUNCEMENT",
    title: payload.title || `TPO Announcement · ${audienceLabel}`,
    message,
    audienceRoles,
    source: "INSTITUTION",
  });

  const item = {
    id: fanOut.broadcastId || `ann-${Date.now()}`,
    audience: audienceLabel,
    time: new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    message,
    recipients: fanOut.count,
  };
  tpoDashboardData.announcements.recent.unshift(item);
  return item;
}

/**
 * Send a 1:1 message from the TPO to the student behind an application.
 * Persists as a notification scoped to the student's user_id.
 *
 * @param {string} applicationId
 * @param {{subject?:string,message:string}} payload
 */
async function contactApplicant(applicationId, payload = {}) {
  const message = String(payload.message || "").trim();
  if (!message) {
    return { error: "EMPTY_MESSAGE" };
  }

  const profile = applicationsService.getCandidateProfile(applicationId);
  if (!profile) {
    return { error: "NOT_FOUND" };
  }

  const studentEmail = profile.personalDetails?.email;
  if (!studentEmail) {
    return { error: "NO_STUDENT_EMAIL" };
  }

  const studentUserId = await audience.resolveStudentUserIdByApplicantEmail(studentEmail);
  if (!studentUserId) {
    return { error: "NO_STUDENT_USER" };
  }

  const title = payload.subject && String(payload.subject).trim()
    ? String(payload.subject).trim()
    : "Message from Placement Office";

  const notification = await notificationsService.notifyUser(studentUserId, {
    type: "ANNOUNCEMENT",
    title,
    message,
    entityId: applicationId,
    driveId: profile.driveId || null,
    source: "INSTITUTION",
  });

  return { ok: true, notification };
}

module.exports = {
  getDashboard,
  listStudents,
  getStudent,
  getStudentResumes,
  getApplicationProfile,
  listDrives,
  getDrive,
  listReports,
  listAnnouncements,
  createAnnouncement,
  contactApplicant,
};
