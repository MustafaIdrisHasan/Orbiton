// Audience resolver: turns audienceRoles like ['STUDENT'] into actual user_ids.
//
// Used by tpo/service.createAnnouncement (fan-out to all STUDENTs) and by
// applications/service.applyToDrive (fan-out to TPO+RECRUITER+ADMIN).

const { pool } = require("../../integrations/postgres/pool");

async function resolveUserIdsForRoles(roles = []) {
  if (!pool) return [];
  if (!Array.isArray(roles) || roles.length === 0) return [];
  const upper = roles.map((r) => String(r || "").toUpperCase()).filter(Boolean);
  if (upper.length === 0) return [];
  const result = await pool.query(
    `SELECT DISTINCT u.id
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
      WHERE r.name = ANY($1::text[])
        AND u.is_active = true`,
    [upper],
  );
  return result.rows.map((row) => row.id);
}

async function resolveStudentUserIdByApplicantEmail(email) {
  if (!pool || !email) return null;
  const result = await pool.query(
    `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [String(email).trim()],
  );
  return result.rows[0] ? result.rows[0].id : null;
}

module.exports = {
  resolveUserIdsForRoles,
  resolveStudentUserIdByApplicantEmail,
};
