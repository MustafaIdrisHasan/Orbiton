/** @typedef {"APPLICATION"|"SHORTLIST"|"ROUND"|"OFFER"|"DRIVE"|"ANNOUNCEMENT"} NotificationType */

/**
 * @param {object} raw
 * @returns {object}
 */
export function normalizeNotificationItem(raw) {
  const created = raw.sentAt || raw.created_at || raw.createdAt;
  return {
    id: raw.id,
    type: raw.type || "ANNOUNCEMENT",
    title: raw.title || inferTitleFromLegacy(raw),
    message: raw.message || "",
    entityId: raw.entityId != null ? raw.entityId : raw.entity_id,
    driveId: raw.driveId != null ? raw.driveId : raw.drive_id,
    audience: raw.audience,
    audienceRoles: raw.audienceRoles,
    studentSnapshot: raw.studentSnapshot || null,
    source: raw.source || "INSTITUTION",
    isRead: Boolean(raw.isRead ?? raw.is_read),
    sentAt: created
  };
}

function inferTitleFromLegacy(raw) {
  if (raw.audience) {
    return "Notification";
  }
  return "Update";
}
