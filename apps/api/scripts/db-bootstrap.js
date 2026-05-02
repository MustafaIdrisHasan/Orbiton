#!/usr/bin/env node
/**
 * One-shot: apply main Orbiton schema, API migrations (ML resume tables), seed auth users.
 * Requires POSTGRES_URL and a reachable Postgres (e.g. Docker: npm run docker:postgres-up).
 */
const { execSync } = require("child_process");
const path = require("path");

const apiRoot = path.join(__dirname, "..");

function run(label, cmd) {
  // eslint-disable-next-line no-console
  console.log(`[db:bootstrap] ${label}…`);
  execSync(cmd, {
    cwd: apiRoot,
    env: process.env,
    stdio: "inherit"
  });
}

async function main() {
  if (!process.env.POSTGRES_URL) {
    console.error("[db:bootstrap] Set POSTGRES_URL first (see apps/api/.env.example)");
    process.exit(1);
  }
  run("main schema", "node scripts/apply-main-schema.js");
  run("migrations", "node scripts/migrate.js");
  run("auth seed", "node src/modules/auth/auth.seed.js");
  // eslint-disable-next-line no-console
  console.log("[db:bootstrap] Done. Login e.g. admin@orbiton / 1234");
}

main().catch((err) => {
  console.error("[db:bootstrap]", err.message);
  process.exit(2);
});
