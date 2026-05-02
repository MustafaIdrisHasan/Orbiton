#!/usr/bin/env node
/**
 * Applies infrastructure/db/postgres/001_initial_schema.sql using POSTGRES_URL.
 * Run after Docker Postgres is up: docker compose ... up -d postgres
 */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const repoRoot = path.join(__dirname, "..", "..", "..");
const schemaFile = path.join(repoRoot, "infrastructure", "db", "postgres", "001_initial_schema.sql");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error("[apply-main-schema] Set POSTGRES_URL (e.g. postgres://orbiton:orbiton@127.0.0.1:5432/orbiton)");
    process.exit(1);
  }
  if (!fs.existsSync(schemaFile)) {
    console.error("[apply-main-schema] Missing file:", schemaFile);
    process.exit(1);
  }
  const sql = fs.readFileSync(schemaFile, "utf8");
  const pool = new Pool({ connectionString });
  let lastErr = null;
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      await pool.query(sql);
      console.log("[apply-main-schema] Applied", path.basename(schemaFile));
      await pool.end();
      return;
    } catch (err) {
      lastErr = err;
      if (attempt < 30) {
        console.log(`[apply-main-schema] waiting for Postgres (attempt ${attempt}/30)…`);
        await sleep(1000);
      }
    }
  }
  await pool.end().catch(() => {});
  throw lastErr;
}

main().catch((err) => {
  console.error("[apply-main-schema] failed:", err.message);
  process.exit(2);
});
