const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeRoles } = require("../core/constants/roles");

test("normalizeRoles uppercases and deduplicates role names", () => {
  assert.deepEqual(normalizeRoles(["student", "ADMIN", "Student"]), ["STUDENT", "ADMIN"]);
});

test("normalizeRoles retains newly supported TPO role", () => {
  assert.deepEqual(normalizeRoles(["tpo", "recruiter", "TPO"]), ["TPO", "RECRUITER"]);
});
