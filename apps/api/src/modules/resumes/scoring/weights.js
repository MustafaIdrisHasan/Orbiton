const DEFAULT_WEIGHTS = Object.freeze({
  skills: 0.3,
  education: 0.15,
  projects: 0.2,
  experience: 0.2,
  completeness: 0.15
});

const REQUIRED_SECTIONS = Object.freeze(["skills", "education", "projects", "experience"]);

const MODEL_VERSION = "rs-v0.2.0";

module.exports = {
  DEFAULT_WEIGHTS,
  REQUIRED_SECTIONS,
  MODEL_VERSION
};
