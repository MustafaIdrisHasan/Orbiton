const repository = require("./repository");
const audience = require("./audience");

/**
 * List notifications for the viewer.
 *
 * The PG repo scopes by user_id natively; the memory repo returns everything
 * (legacy behavior) and we role-filter here so dev environments without PG
 * still match what the UI expects.
 */
async function listNotifications(viewerUserId, viewerRole) {
  let items = await repository.listNotificationsForUser(viewerUserId, viewerRole);
  if (!viewerUserId && viewerRole) {
    // Memory backend only — keep the legacy role filter.
    items = items.filter((n) => {
      const ar = n.audienceRoles;
      if (!Array.isArray(ar) || ar.length === 0) return true;
      return ar.includes(viewerRole) || viewerRole === "ADMIN";
    });
  }
  return {
    items,
    unreadCount: items.filter((item) => !item.isRead).length,
  };
}

async function markAsRead(id, viewerUserId) {
  return repository.markAsRead(id, viewerUserId);
}

async function markAllAsRead(viewerUserId) {
  return repository.markAllAsRead(viewerUserId);
}

/**
 * Persist a single notification scoped to one user. Used for direct
 * confirmations like "your application was submitted".
 */
async function notifyUser(userId, payload = {}) {
  if (!userId) {
    return null;
  }
  return repository.createForUser(userId, {
    type: payload.type || "APPLICATION",
    title: payload.title || "Notification",
    message: payload.message || "",
    entityId: payload.entityId,
    driveId: payload.driveId,
    audienceRoles: Array.isArray(payload.audienceRoles) ? payload.audienceRoles : [],
    source: payload.source || "INSTITUTION",
    studentSnapshot: payload.studentSnapshot || null,
  });
}

/**
 * Broadcast: fan out to every user_id matching the requested roles.
 * `payload.audienceRoles` defaults to ['STUDENT'] when not specified.
 */
async function createBroadcast(payload = {}) {
  const roles = Array.isArray(payload.audienceRoles) && payload.audienceRoles.length
    ? payload.audienceRoles
    : ["STUDENT"];
  const userIds = await audience.resolveUserIdsForRoles(roles);
  if (!userIds.length) {
    return { broadcastId: null, count: 0, items: [] };
  }
  return repository.bulkCreate(userIds, {
    type: payload.type || "ANNOUNCEMENT",
    title: payload.title || "Announcement",
    message: payload.message || "",
    entityId: payload.entityId,
    driveId: payload.driveId,
    audienceRoles: roles,
    source: payload.source || "INSTITUTION",
  });
}

/**
 * Application alert: fan out to TPO+RECRUITER+ADMIN by default. Caller may
 * override `payload.audienceRoles`.
 */
async function createApplicationAlert(payload = {}) {
  const roles = Array.isArray(payload.audienceRoles) && payload.audienceRoles.length
    ? payload.audienceRoles
    : ["TPO", "RECRUITER", "ADMIN"];
  const userIds = await audience.resolveUserIdsForRoles(roles);
  if (!userIds.length) {
    // Fall back to a "no-op success" so the apply call still completes;
    // missing recipients shouldn't block a student's application.
    return { broadcastId: null, count: 0, items: [] };
  }
  return repository.bulkCreate(userIds, {
    type: "APPLICATION",
    title: payload.title || "New application",
    message: payload.message || "",
    entityId: payload.applicationId || null,
    driveId: payload.driveId || null,
    audienceRoles: roles,
    source: "STUDENT",
    studentSnapshot: payload.studentSnapshot || null,
  });
}

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
  notifyUser,
  createBroadcast,
  createApplicationAlert,
};
