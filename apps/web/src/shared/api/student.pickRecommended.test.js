import test from "node:test";
import assert from "node:assert/strict";
import { pickRecommendedDrives } from "./studentRecommendations.js";

/** Minimal normalized drive shape used by pickRecommendedDrives. */
function openDrive(overrides) {
  return {
    id: overrides.id,
    companyName: "Northstar AI",
    roleTitle: overrides.title || "Role",
    logoUrl: null,
    description: "",
    packageLpa: null,
    department: null,
    skills: overrides.skills || [],
    minCgpa: overrides.minCgpa ?? 7,
    deadlineAt: overrides.applicationDeadline || "2099-06-01T18:00:00.000Z",
    status: "Open",
    rawStatus: "PUBLISHED",
    isFeatured: false,
    openings: 1,
    location: "Bengaluru",
    eligibleDepartments: overrides.eligibleDepartments || ["CSE"],
    employmentType: "FULL_TIME",
    maxBacklogs: null,
    eligibleYears: [],
    requiredSkills: overrides.requiredSkills || []
  };
}

test("pickRecommendedDrives ranks Docker role above React-only for Docker profile", () => {
  const profile = { skills: ["Docker"], department: "CSE", cgpa: 8.5 };
  const dockerDrive = openDrive({
    id: "d-docker",
    title: "Docker Intern",
    requiredSkills: ["Docker"]
  });
  const reactDrive = openDrive({
    id: "d-react",
    title: "React Developer",
    requiredSkills: ["React", "TypeScript"]
  });
  const rec = pickRecommendedDrives([reactDrive, dockerDrive], profile);
  assert.equal(rec[0].id, "d-docker");
  assert.ok(!rec.some((d) => d.id === "d-react"));
});

test("pickRecommendedDrives excludes drives with no overlap on required skills", () => {
  const profile = { skills: ["Docker"], department: "CSE", cgpa: 8.0 };
  const reactOnly = openDrive({
    id: "r1",
    title: "React only",
    requiredSkills: ["React"]
  });
  const rec = pickRecommendedDrives([reactOnly], profile);
  assert.equal(rec.length, 0);
});

test("pickRecommendedDrives includes no-required-skill drives for skilled profiles", () => {
  const profile = { skills: ["Docker"], department: "CSE", cgpa: 8.0 };
  const noRequired = openDrive({
    id: "open1",
    title: "Generalist",
    requiredSkills: []
  });
  const rec = pickRecommendedDrives([noRequired], profile);
  assert.ok(rec.length >= 1);
  assert.equal(rec[0].id, "open1");
});
