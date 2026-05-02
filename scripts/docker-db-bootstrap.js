#!/usr/bin/env node
const { spawnSync } = require("child_process");
const path = require("path");

const env = {
  ...process.env,
  POSTGRES_URL: process.env.POSTGRES_URL || "postgres://orbiton:orbiton@127.0.0.1:5432/orbiton"
};

const result = spawnSync(
  "npm",
  ["run", "db:bootstrap", "--workspace", "@orbiton/api"],
  {
    cwd: path.join(__dirname, ".."),
    env,
    stdio: "inherit",
    shell: true
  }
);

process.exit(result.status ?? 1);
