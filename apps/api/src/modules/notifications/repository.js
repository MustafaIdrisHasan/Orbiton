// Repository dispatcher: PG when env.usePostgres (or pool is configured),
// memory otherwise. Mirrors the resumes/store dispatcher pattern.

const { env } = require("../../config/env");
const { pool } = require("../../integrations/postgres/pool");

let backendOverride = null;

function selectBackend() {
  if (backendOverride) return backendOverride;
  // Prefer PG if a pool exists, regardless of `usePostgres` flag — this is
  // because notifications must be persistent for cross-user fan-out to work.
  if (pool || env.usePostgres) {
    return require("./repository.postgres");
  }
  return require("./repository.memory");
}

function setBackendForTests(backend) { backendOverride = backend; }
function clearBackendForTests() { backendOverride = null; }

function listNotificationsForUser(userId, viewerRole) {
  return selectBackend().listNotificationsForUser(userId, viewerRole);
}

function markAsRead(id, userId) {
  return selectBackend().markAsRead(id, userId);
}

function markAllAsRead(userId) {
  return selectBackend().markAllAsRead(userId);
}

function createForUser(userId, payload) {
  return selectBackend().createForUser(userId, payload);
}

function bulkCreate(userIds, payload) {
  return selectBackend().bulkCreate(userIds, payload);
}

function getBackendName() {
  return selectBackend().backend;
}

module.exports = {
  listNotificationsForUser,
  markAsRead,
  markAllAsRead,
  createForUser,
  bulkCreate,
  getBackendName,
  setBackendForTests,
  clearBackendForTests,
};
