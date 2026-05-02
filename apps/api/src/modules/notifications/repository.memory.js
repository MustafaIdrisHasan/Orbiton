// Memory-backed notifications repo (the original implementation).
// Kept as a fallback for environments without Postgres so dev still
// works. The dispatcher in repository.js picks this when `pool` is null.

const { recruiterStore } = require("../recruiters/mockData");

const backend = "memory";

async function listNotificationsForUser(_userId, _viewerRole) {
  // Memory repo doesn't actually filter per user; it's the legacy behavior
  // that was role-filtered in service.js.
  return recruiterStore.notifications.slice();
}

async function markAsRead(id, _userId) {
  const notification = recruiterStore.notifications.find((item) => item.id === id);
  if (!notification) {
    return null;
  }
  notification.isRead = true;
  return notification;
}

async function markAllAsRead(_userId) {
  recruiterStore.notifications.forEach((item) => {
    item.isRead = true;
  });
  return recruiterStore.notifications.length;
}

async function createForUser(userId, payload) {
  const notification = {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    userId,
    type: payload.type || "ANNOUNCEMENT",
    title: payload.title || "Notification",
    message: payload.message || "",
    entityId: payload.entityId != null ? payload.entityId : payload.driveId || null,
    driveId: payload.driveId || null,
    audience: payload.audience,
    audienceRoles: payload.audienceRoles || [],
    source: payload.source || "INSTITUTION",
    studentSnapshot: payload.studentSnapshot || null,
    broadcastId: payload.broadcastId || null,
    sentAt: new Date().toISOString(),
    isRead: false,
  };
  recruiterStore.notifications.unshift(notification);
  return notification;
}

async function bulkCreate(userIds, payload) {
  const broadcastId = payload.broadcastId || `bc-${Date.now()}`;
  const out = [];
  for (const uid of userIds) {
    out.push(await createForUser(uid, { ...payload, broadcastId }));
  }
  return { broadcastId, count: out.length, items: out };
}

module.exports = {
  backend,
  listNotificationsForUser,
  markAsRead,
  markAllAsRead,
  createForUser,
  bulkCreate,
};
