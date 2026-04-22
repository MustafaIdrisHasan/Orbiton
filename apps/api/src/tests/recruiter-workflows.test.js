const test = require("node:test");
const assert = require("node:assert/strict");
const recruiterService = require("../modules/recruiters/service");

test("recruiter dashboard returns a drive-scoped funnel summary", () => {
  const dashboard = recruiterService.getDashboard();

  assert.equal(dashboard.activeDrive.title, "Associate Software Engineer");
  assert.equal(dashboard.quickStats.totalApplications > 0, true);
  assert.equal(Array.isArray(dashboard.funnel), true);
});

test("recruiter candidate listing supports drive-level filtering", () => {
  const result = recruiterService.listCandidates("drive-northstar-ase", { branch: "CSE" });

  assert.equal(result.total > 0, true);
  assert.equal(result.items.every((item) => item.branch === "CSE"), true);
});
