// Postgres-backed read-only queries for the Admin dashboard.
//
// Returns null when `pool` is not configured so the service can fall back
// to mockData. Keeps the existing mock-driven `alerts`, `roles`, `logs`,
// `reports`, `systemControls` because those are still product-stub data.

const { pool } = require("../../integrations/postgres/pool");

async function getOverview() {
  if (!pool) return null;
  const [users, drives, apps] = await Promise.all([
    pool.query(`SELECT
        COUNT(*) FILTER (WHERE is_active) AS active_users,
        COUNT(*) AS total_users
      FROM users`),
    pool.query(`SELECT
        COUNT(*) AS total_drives,
        COUNT(*) FILTER (WHERE status = 'PUBLISHED') AS active_drives
      FROM placement_drives`),
    pool.query(`SELECT COUNT(*) AS total_applications FROM applications`),
  ]);

  const studentRows = await pool.query(
    `SELECT COUNT(*) AS total_students FROM student_profiles`,
  );
  const recruiterRows = await pool.query(
    `SELECT COUNT(*) AS total_recruiters FROM recruiter_profiles`,
  );

  return {
    totalUsers: Number(users.rows[0].total_users),
    activeUsers: Number(users.rows[0].active_users),
    totalStudents: Number(studentRows.rows[0].total_students),
    totalRecruiters: Number(recruiterRows.rows[0].total_recruiters),
    activeDrives: Number(drives.rows[0].active_drives),
    totalApplications: Number(apps.rows[0].total_applications),
    systemHealth: "Normal",
  };
}

async function listDrives(filters = {}) {
  if (!pool) return null;
  // Optional ?created_by_role=TPO scoping
  const params = [];
  let where = "";
  if (filters.createdByRole) {
    params.push(String(filters.createdByRole).toUpperCase());
    where = `
      WHERE pd.created_by IN (
        SELECT u.id
          FROM users u
          JOIN user_roles ur ON ur.user_id = u.id
          JOIN roles r ON r.id = ur.role_id
         WHERE r.name = $${params.length}
      )
    `;
  }
  if (filters.createdByUserId) {
    params.push(filters.createdByUserId);
    where = where ? `${where} AND pd.created_by = $${params.length}` : `WHERE pd.created_by = $${params.length}`;
  }

  const sql = `
    SELECT pd.id,
           pd.title,
           pd.description,
           pd.status,
           pd.application_deadline,
           pd.location,
           pd.created_at,
           pd.created_by,
           pd.recruiter_id,
           u.email AS created_by_email,
           rp.company_name
      FROM placement_drives pd
      LEFT JOIN users u ON u.id = pd.created_by
      LEFT JOIN recruiter_profiles rp ON rp.id = pd.recruiter_id
      ${where}
     ORDER BY pd.created_at DESC
     LIMIT 200
  `;
  const result = await pool.query(sql, params);
  return result.rows.map((row) => ({
    id: row.id,
    company: row.company_name || "—",
    role: row.title || "Untitled",
    description: row.description || "",
    status: row.status || "DRAFT",
    createdBy: row.created_by_email || row.created_by || "—",
    createdById: row.created_by || null,
    deadline: row.application_deadline,
    location: row.location || null,
    createdAt: row.created_at,
  }));
}

async function listUsers() {
  if (!pool) return null;
  const result = await pool.query(
    `SELECT u.id,
            u.email,
            u.is_active,
            u.created_at,
            u.updated_at,
            COALESCE(ARRAY_AGG(r.name ORDER BY r.id) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT 500`,
  );
  return result.rows.map((row) => ({
    id: row.id,
    name: row.email ? row.email.split("@")[0] : row.id,
    email: row.email,
    role: row.roles[0] || "STUDENT",
    status: row.is_active ? "Active" : "Disabled",
    lastLogin: row.updated_at ? new Date(row.updated_at).toLocaleString() : "—",
    details: { roles: row.roles },
  }));
}

module.exports = {
  getOverview,
  listDrives,
  listUsers,
};
