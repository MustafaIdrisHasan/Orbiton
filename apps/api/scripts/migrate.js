#!/usr/bin/env node
// One-shot migration runner. Reads POSTGRES_URL from the environment and
// applies every .sql file in src/integrations/postgres/migrations in
// lexical order. Records successes in schema_migrations so re-runs are
// no-ops. Phase 2 deploys should call this on boot.

const { pool } = require("../src/integrations/postgres/pool");
const { ensureMigrations, listMigrations } = require("../src/integrations/postgres/migrate");

(async () => {
  if (!pool) {
    console.error("[migrate] POSTGRES_URL is not set; refusing to run.");
    process.exit(1);
  }
  const all = await listMigrations();
  console.log(`[migrate] discovered ${all.length} migration file(s):`);
  for (const name of all) {
    console.log(`  - ${name}`);
  }
  try {
    const result = await ensureMigrations(pool);
    console.log(`[migrate] applied set: ${JSON.stringify(result.applied)}`);
    process.exit(0);
  } catch (err) {
    console.error("[migrate] failed:", err.message);
    process.exit(2);
  } finally {
    await pool.end().catch(() => {});
  }
})();
