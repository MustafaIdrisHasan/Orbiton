const fs = require("fs");
const path = require("path");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function listMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  const entries = fs.readdirSync(MIGRATIONS_DIR);
  return entries
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

async function ensureMigrationsTable(pool) {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
        name        TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
  );
}

async function isApplied(pool, name) {
  const result = await pool.query(
    "SELECT 1 FROM schema_migrations WHERE name = $1",
    [name]
  );
  return result.rowCount > 0;
}

async function recordApplied(pool, name) {
  await pool.query(
    "INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
    [name]
  );
}

async function ensureMigrations(pool) {
  if (!pool) {
    throw new Error("Cannot run migrations: postgres pool is not configured");
  }
  await ensureMigrationsTable(pool);
  const migrations = await listMigrations();
  for (const name of migrations) {
    if (await isApplied(pool, name)) {
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, name), "utf8");
    await pool.query(sql);
    await recordApplied(pool, name);
  }
  return { applied: migrations };
}

module.exports = {
  ensureMigrations,
  listMigrations
};
