-- 004_notifications_targeting.sql
-- Extend the existing notifications table so we can persist fan-out
-- announcements + application alerts the way the in-memory store did.
-- Idempotent (safe to re-run).

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS title           text,
  ADD COLUMN IF NOT EXISTS audience_roles  text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS entity_id       text,
  ADD COLUMN IF NOT EXISTS drive_id        uuid,
  ADD COLUMN IF NOT EXISTS source          text      DEFAULT 'INSTITUTION',
  ADD COLUMN IF NOT EXISTS student_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS broadcast_id    uuid;     -- groups all rows from one fan-out

-- Existing column: type, message, is_read, created_at, user_id
-- Make `type` searchable by filter tab.
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_type
  ON notifications (user_id, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_broadcast
  ON notifications (broadcast_id);
