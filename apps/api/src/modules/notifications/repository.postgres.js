// Postgres-backed notifications repository.
//
// Schema lives in:
//   infrastructure/db/postgres/001_initial_schema.sql  (base notifications)
//   infrastructure/db/postgres/004_notifications_targeting.sql (added columns)
//
// We additionally self-heal at runtime: the `ensureSchema()` step runs
// ALTER TABLE … IF NOT EXISTS for the new columns/indexes before the first
// query so deploys without the migration applied still work.
//
// All writes happen here; lists are scoped to one user_id.

const { pool } = require("../../integrations/postgres/pool");
const { ApiError } = require("../../core/errors/ApiError");

const backend = "postgres";

/** `notifications.drive_id` is uuid; mock/in-memory drives use string slugs — only persist real UUIDs. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toUuidParam(value) {
  if (value == null || value === "") {
    return null;
  }
  const s = String(value).trim();
  return UUID_RE.test(s) ? s : null;
}

function getPool() {
  if (!pool) {
    throw new ApiError(500, "DB_NOT_CONFIGURED", "PostgreSQL connection is not configured");
  }
  return pool;
}

// ---------------------------------------------------------------------------
// Self-healing schema: the same statements as
// infrastructure/db/postgres/004_notifications_targeting.sql, run once per
// process. Fully idempotent — every statement is `IF NOT EXISTS`.
// ---------------------------------------------------------------------------
let schemaReadyPromise = null;

async function ensureSchema() {
  if (schemaReadyPromise) return schemaReadyPromise;
  const db = getPool();
  schemaReadyPromise = (async () => {
    await db.query(`
      ALTER TABLE notifications
        ADD COLUMN IF NOT EXISTS title             text,
        ADD COLUMN IF NOT EXISTS audience_roles    text[]    DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS entity_id         text,
        ADD COLUMN IF NOT EXISTS drive_id          uuid,
        ADD COLUMN IF NOT EXISTS source            text      DEFAULT 'INSTITUTION',
        ADD COLUMN IF NOT EXISTS student_snapshot  jsonb,
        ADD COLUMN IF NOT EXISTS broadcast_id      uuid
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
        ON notifications (user_id, is_read, created_at DESC)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_type
        ON notifications (user_id, type, created_at DESC)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_broadcast
        ON notifications (broadcast_id)
    `);
  })().catch((err) => {
    // Don't cache a failed promise — let the next call retry.
    schemaReadyPromise = null;
    // eslint-disable-next-line no-console
    console.error("[notifications] schema self-heal failed:", err.message);
    throw err;
  });
  return schemaReadyPromise;
}

function rowToNotification(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type || "ANNOUNCEMENT",
    title: row.title || "Notification",
    message: row.message || "",
    entityId: row.entity_id || null,
    driveId: row.drive_id || null,
    audienceRoles: row.audience_roles || [],
    source: row.source || "INSTITUTION",
    studentSnapshot: row.student_snapshot || null,
    broadcastId: row.broadcast_id || null,
    isRead: Boolean(row.is_read),
    sentAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

async function listNotificationsForUser(userId, _viewerRole) {
  if (!userId) return [];
  const db = getPool();
  await ensureSchema();
  const result = await db.query(
    `SELECT id, user_id, type, title, message, entity_id, drive_id,
            audience_roles, source, student_snapshot, broadcast_id,
            is_read, created_at
       FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 200`,
    [userId],
  );
  return result.rows.map(rowToNotification);
}

async function markAsRead(id, userId) {
  const db = getPool();
  await ensureSchema();
  const result = await db.query(
    `UPDATE notifications
        SET is_read = true
      WHERE id = $1
        AND ($2::uuid IS NULL OR user_id = $2)
      RETURNING id, user_id, type, title, message, entity_id, drive_id,
                audience_roles, source, student_snapshot, broadcast_id,
                is_read, created_at`,
    [id, userId || null],
  );
  return result.rows[0] ? rowToNotification(result.rows[0]) : null;
}

async function markAllAsRead(userId) {
  const db = getPool();
  await ensureSchema();
  const result = await db.query(
    `UPDATE notifications SET is_read = true
      WHERE user_id = $1 AND is_read = false`,
    [userId],
  );
  return result.rowCount;
}

async function createForUser(userId, payload) {
  if (!userId) {
    throw new ApiError(400, "NOTIFICATION_NO_USER", "userId is required to persist a notification");
  }
  const db = getPool();
  await ensureSchema();
  const result = await db.query(
    `INSERT INTO notifications
       (user_id, type, title, message, entity_id, drive_id,
        audience_roles, source, student_snapshot, broadcast_id, is_read)
     VALUES ($1, $2, $3, $4, $5, $6::uuid, $7::text[], $8, $9::jsonb, $10::uuid, false)
     RETURNING id, user_id, type, title, message, entity_id, drive_id,
               audience_roles, source, student_snapshot, broadcast_id,
               is_read, created_at`,
    [
      userId,
      payload.type || "ANNOUNCEMENT",
      payload.title || "Notification",
      payload.message || "",
      payload.entityId != null ? String(payload.entityId) : (payload.driveId || null),
      toUuidParam(payload.driveId),
      Array.isArray(payload.audienceRoles) ? payload.audienceRoles : [],
      payload.source || "INSTITUTION",
      payload.studentSnapshot ? JSON.stringify(payload.studentSnapshot) : null,
      payload.broadcastId || null,
    ],
  );
  return rowToNotification(result.rows[0]);
}

async function bulkCreate(userIds, payload) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { broadcastId: null, count: 0, items: [] };
  }
  const db = getPool();
  await ensureSchema();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const broadcastResult = await client.query(`SELECT gen_random_uuid() AS id`);
    const broadcastId = payload.broadcastId || broadcastResult.rows[0].id;

    const items = [];
    for (const uid of userIds) {
      const r = await client.query(
        `INSERT INTO notifications
           (user_id, type, title, message, entity_id, drive_id,
            audience_roles, source, student_snapshot, broadcast_id, is_read)
         VALUES ($1, $2, $3, $4, $5, $6::uuid, $7::text[], $8, $9::jsonb, $10, false)
         RETURNING id, user_id, type, title, message, entity_id, drive_id,
                   audience_roles, source, student_snapshot, broadcast_id,
                   is_read, created_at`,
        [
          uid,
          payload.type || "ANNOUNCEMENT",
          payload.title || "Notification",
          payload.message || "",
          payload.entityId != null ? String(payload.entityId) : (payload.driveId || null),
          toUuidParam(payload.driveId),
          Array.isArray(payload.audienceRoles) ? payload.audienceRoles : [],
          payload.source || "INSTITUTION",
          payload.studentSnapshot ? JSON.stringify(payload.studentSnapshot) : null,
          broadcastId,
        ],
      );
      items.push(rowToNotification(r.rows[0]));
    }
    await client.query("COMMIT");
    return { broadcastId, count: items.length, items };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  backend,
  listNotificationsForUser,
  markAsRead,
  markAllAsRead,
  createForUser,
  bulkCreate,
};
