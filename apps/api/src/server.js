require("reflect-metadata");
const { env } = require("./config/env");
const { app } = require("./app");
const { authService } = require("./modules/auth/auth.service");

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Orbiton API listening on port ${env.port}`);
  // Best-effort: ensure the COMPANY role + company@orbiton user exist for
  // databases bootstrapped before the COMPANY role was added.
  authService.ensureCompanyUserSeeded().catch(() => {});
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    // eslint-disable-next-line no-console
    console.error(
      `Orbiton API: port ${env.port} is already in use.\n` +
        `Stop the other process (often a previous API dev server) or set PORT in apps/api/.env.\n` +
        `Windows: netstat -ano | findstr ":${env.port}"`
    );
    process.exit(1);
  }
  throw err;
});

