const { pool } = require("../../integrations/postgres/pool");
const { ApiError } = require("../../core/errors/ApiError");

function getPool() {
  if (!pool) {
    throw new ApiError(500, "DB_NOT_CONFIGURED", "PostgreSQL connection is not configured");
  }

  return pool;
}

async function findUserWithRolesByEmail(email) {
  const db = getPool();
  const query = `
    SELECT
      u.id,
      u.email,
      u.password_hash_txt,
      u.is_active,
      COALESCE(ARRAY_AGG(r.name ORDER BY r.id) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE LOWER(u.email) = LOWER($1)
    GROUP BY u.id
    LIMIT 1
  `;
  const result = await db.query(query, [email]);
  return result.rows[0] || null;
}

async function findUserWithRolesById(userId) {
  const db = getPool();
  const query = `
    SELECT
      u.id,
      u.email,
      u.is_active,
      COALESCE(ARRAY_AGG(r.name ORDER BY r.id) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE u.id = $1
    GROUP BY u.id
    LIMIT 1
  `;
  const result = await db.query(query, [userId]);
  return result.rows[0] || null;
}

async function ensureRoles(roleNames, client = null) {
  const db = client || getPool();
  const query = `
    INSERT INTO roles (name, description)
    VALUES ($1, $2)
    ON CONFLICT (name) DO UPDATE
    SET description = EXCLUDED.description
    RETURNING id, name
  `;

  const roles = [];
  for (const roleName of roleNames) {
    const result = await db.query(query, [roleName, `${roleName} default role`]);
    roles.push(result.rows[0]);
  }

  return roles;
}

async function upsertUser(user, client = null) {
  const db = client || getPool();
  const query = `
    INSERT INTO users (email, password_hash_txt, ph_no, is_active)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email) DO UPDATE
    SET password_hash_txt = EXCLUDED.password_hash_txt,
        ph_no = EXCLUDED.ph_no,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id, email, is_active
  `;

  const result = await db.query(query, [user.email, user.passwordHash, user.phoneNumber, user.isActive]);
  return result.rows[0];
}

async function assignRoleToUser(userId, roleName, client = null) {
  const db = client || getPool();
  const query = `
    INSERT INTO user_roles (user_id, role_id)
    SELECT $1, r.id
    FROM roles r
    WHERE r.name = $2
    ON CONFLICT (user_id, role_id) DO NOTHING
  `;

  await db.query(query, [userId, roleName]);
}

async function withTransaction(callback) {
  const db = getPool();
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  findUserWithRolesByEmail,
  findUserWithRolesById,
  ensureRoles,
  upsertUser,
  assignRoleToUser,
  withTransaction
};
