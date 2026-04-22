const test = require("node:test");
const assert = require("node:assert/strict");
const { isEligibleForDrive } = require("../core/utils/eligibility");

test("student is eligible when all criteria match", () => {
  assert.equal(
    isEligibleForDrive(
      { cgpa: 8.2, backlogCount: 0, department: "CSE" },
      { minCgpa: 7.5, maxBacklogs: 0, eligibleDepartments: ["CSE", "IT"] }
    ),
    true
  );
});

test("student is not eligible when department is not allowed", () => {
  assert.equal(
    isEligibleForDrive(
      { cgpa: 8.2, backlogCount: 0, department: "EEE" },
      { minCgpa: 7.5, maxBacklogs: 0, eligibleDepartments: ["CSE", "IT"] }
    ),
    false
  );
});

