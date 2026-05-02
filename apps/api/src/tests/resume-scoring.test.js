const test = require("node:test");
const assert = require("node:assert/strict");

const { score } = require("../modules/resumes/scoring/scorer");
const { DEFAULT_WEIGHTS, MODEL_VERSION } = require("../modules/resumes/scoring/weights");
const features = require("../modules/resumes/scoring/features");

const STRONG_PROFILE = {
  skills: ["React", "Node.js", "SQL", "System Design", "Express", "PostgreSQL", "Redis", "Docker"],
  education: { cgpa: 8.7, branch: "CSE", degree: "B.Tech", year: "Final Year" },
  projects: [
    { title: "Campus hiring portal", description: "React + Node + Postgres", tech: ["React", "Node.js", "PostgreSQL"] },
    { title: "Realtime notice", description: "WebSockets", tech: ["Node.js", "Redis"] },
    { title: "ML resume scorer", description: "scikit-learn", tech: ["Python", "scikit-learn"] }
  ],
  experience: [
    { role: "SDE Intern", durationMonths: 6, internship: true },
    { role: "Open source contributor", durationMonths: 4, internship: false }
  ]
};

const EMPTY_PROFILE = {};

test("score returns the documented top-level shape and model version", () => {
  const result = score(STRONG_PROFILE);
  assert.equal(result.modelVersion, MODEL_VERSION);
  assert.equal(typeof result.computedAt, "string");
  assert.equal(typeof result.finalScore, "number");
  assert.deepEqual(Object.keys(result.subscores).sort(), [
    "completeness",
    "education",
    "experience",
    "projects",
    "skills"
  ]);
});

test("default weights sum to 1.0 within tolerance", () => {
  const sum = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9, `weights should sum to 1, got ${sum}`);
});

test("strong profile scores in the high band (>= 70)", () => {
  const result = score(STRONG_PROFILE);
  assert.ok(result.finalScore >= 70, `expected finalScore >= 70, got ${result.finalScore}`);
  assert.ok(result.finalScore <= 100);
});

test("empty profile produces finalScore of 0 and tips for missing sections", () => {
  const result = score(EMPTY_PROFILE);
  assert.equal(result.finalScore, 0);
  assert.equal(result.subscores.completeness.details.missingSections.length, 4);
  assert.ok(result.tips.some((t) => t.includes("missing sections")));
});

test("subscore values are clamped to [0, 1]", () => {
  const result = score(STRONG_PROFILE);
  for (const [key, sub] of Object.entries(result.subscores)) {
    assert.ok(sub.score >= 0 && sub.score <= 1, `${key} score out of range: ${sub.score}`);
    assert.ok(sub.weight > 0 && sub.weight <= 1, `${key} weight out of range: ${sub.weight}`);
  }
});

test("keyword match contributes when targetSkills are provided", () => {
  const noTarget = features.scoreSkills(STRONG_PROFILE);
  const withTarget = features.scoreSkills(STRONG_PROFILE, {
    targetSkills: ["React", "Node.js", "SQL"]
  });
  assert.equal(withTarget.details.matched.length, 3);
  assert.ok(withTarget.score >= 0);
  assert.ok(noTarget.score >= 0);
});

test("ineligible department lowers education relevance", () => {
  const inDept = features.scoreEducation(STRONG_PROFILE, { eligibleDepartments: ["CSE", "IT"] });
  const outDept = features.scoreEducation(STRONG_PROFILE, { eligibleDepartments: ["MECH"] });
  assert.ok(inDept.score > outDept.score, "CSE should outscore MECH for a CSE student");
});

test("internship presence beats no experience", () => {
  const withIntern = features.scoreExperience({
    experience: [{ durationMonths: 6, internship: true }]
  });
  const without = features.scoreExperience({ experience: [] });
  assert.ok(withIntern.score > without.score);
  assert.equal(withIntern.details.hasInternship, true);
});

test("completeness is exactly coverage / 4", () => {
  const r = features.scoreCompleteness(STRONG_PROFILE);
  assert.equal(r.score, 1);
  assert.deepEqual(r.details.missingSections, []);
  const partial = features.scoreCompleteness({ skills: ["a"] });
  assert.equal(partial.score, 0.25);
});
