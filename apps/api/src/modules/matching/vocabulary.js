const { recruiterStore } = require("../recruiters/mockData");

const VOCAB_VERSION = "v1";

const BASELINE_SKILLS = [
  "react",
  "node.js",
  "express",
  "sql",
  "postgresql",
  "mongodb",
  "python",
  "java",
  "system design",
  "redis",
  "docker",
  "kubernetes",
  "scikit-learn",
  "data pipelines",
  "rest",
  "javascript",
  "typescript"
];

const BASELINE_BRANCHES = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AIDS", "AIML"];

let cached = null;

function lower(value) {
  return String(value || "").trim().toLowerCase();
}

function upper(value) {
  return String(value || "").trim().toUpperCase();
}

function buildVocabulary() {
  const skills = new Set(BASELINE_SKILLS);
  const branches = new Set(BASELINE_BRANCHES);

  for (const drive of recruiterStore.drives || []) {
    for (const skill of drive.requiredSkills || []) {
      const norm = lower(skill);
      if (norm) {
        skills.add(norm);
      }
    }
    for (const dept of drive.eligibleDepartments || []) {
      const norm = upper(dept);
      if (norm) {
        branches.add(norm);
      }
    }
    for (const candidate of drive.candidates || []) {
      for (const skill of candidate.skills || []) {
        const norm = lower(skill);
        if (norm) {
          skills.add(norm);
        }
      }
      const branch = upper(candidate.branch);
      if (branch) {
        branches.add(branch);
      }
    }
  }

  return {
    version: VOCAB_VERSION,
    skills: Array.from(skills).sort(),
    branches: Array.from(branches).sort(),
    dim() {
      return this.skills.length + this.branches.length;
    }
  };
}

function getVocabulary() {
  if (!cached) {
    cached = buildVocabulary();
  }
  return cached;
}

function _resetForTests() {
  cached = null;
}

module.exports = {
  getVocabulary,
  buildVocabulary,
  VOCAB_VERSION,
  _resetForTests
};
