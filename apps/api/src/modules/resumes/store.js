// Resume store dispatcher.
//
// Selects between the in-memory mock store (default) and a Postgres-backed
// store when `USE_POSTGRES=true`. The dispatcher preserves a fully async
// surface so callers can `await` every method regardless of backend.
//
// Phase 1 callers were synchronous against the in-memory implementation;
// every existing call site has been updated to `await` the result. The
// public method names and return shapes are byte-equivalent across both
// backends, so flipping `USE_POSTGRES` is a single env-var change.

const { env } = require("../../config/env");

let backendOverride = null;

function selectBackend() {
  if (backendOverride) {
    return backendOverride;
  }
  if (env.usePostgres) {
    return require("./store.postgres");
  }
  return require("./store.memory");
}

function setBackendForTests(backend) {
  backendOverride = backend;
}

function clearBackendForTests() {
  backendOverride = null;
}

function getBackendName() {
  return selectBackend().backend;
}

function setProfile(studentId, profile) {
  return selectBackend().setProfile(studentId, profile);
}

function getProfile(studentId) {
  return selectBackend().getProfile(studentId);
}

function setScore(resumeId, studentId, scoreResult) {
  return selectBackend().setScore(resumeId, studentId, scoreResult);
}

function getScore(resumeId) {
  return selectBackend().getScore(resumeId);
}

function setResumeForStudent(resumeId, studentId) {
  return selectBackend().setResumeForStudent(resumeId, studentId);
}

function getStudentForResume(resumeId) {
  return selectBackend().getStudentForResume(resumeId);
}

function getLatestScoreForStudent(studentId) {
  return selectBackend().getLatestScoreForStudent(studentId);
}

function recordUpload(upload) {
  return selectBackend().recordUpload(upload);
}

function getUpload(uploadId) {
  return selectBackend().getUpload(uploadId);
}

function listUploadsForStudent(studentId) {
  return selectBackend().listUploadsForStudent(studentId);
}

function deleteUploadArtifacts(uploadId, expectedStudentId) {
  return selectBackend().deleteUploadArtifacts(uploadId, expectedStudentId);
}

async function _resetForTests() {
  await selectBackend()._resetForTests();
}

module.exports = {
  setProfile,
  getProfile,
  setScore,
  getScore,
  setResumeForStudent,
  getStudentForResume,
  getLatestScoreForStudent,
  recordUpload,
  getUpload,
  listUploadsForStudent,
  deleteUploadArtifacts,
  getBackendName,
  setBackendForTests,
  clearBackendForTests,
  _resetForTests
};
