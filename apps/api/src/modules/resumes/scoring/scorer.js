const features = require("./features");
const { DEFAULT_WEIGHTS, MODEL_VERSION } = require("./weights");

function buildTips(subscores) {
  const tips = [];
  if (subscores.skills.details.count < 6) {
    tips.push("Add more relevant skills (aim for 8 or more).");
  }
  if (subscores.projects.details.count < 2) {
    tips.push("Showcase at least two substantial projects with measurable outcomes.");
  }
  if (!subscores.experience.details.hasInternship) {
    tips.push("Add an internship or relevant work experience to strengthen credibility.");
  }
  const missing = subscores.completeness.details.missingSections;
  if (missing.length > 0) {
    tips.push(`Complete missing sections: ${missing.join(", ")}.`);
  }
  if (
    subscores.education.details.cgpa != null &&
    subscores.education.details.cgpa < 7
  ) {
    tips.push("CGPA is below typical eligibility cutoffs; emphasize strong projects, certifications, and internships.");
  }
  return tips;
}

function score(profileInput, ctx = {}, weightsOverride = {}) {
  const profile = profileInput || {};
  const weights = { ...DEFAULT_WEIGHTS, ...weightsOverride };

  const skills = features.scoreSkills(profile, ctx);
  const education = features.scoreEducation(profile, ctx);
  const projects = features.scoreProjects(profile, ctx);
  const experience = features.scoreExperience(profile);
  const completeness = features.scoreCompleteness(profile);

  const subscores = {
    skills: { score: skills.score, weight: weights.skills, details: skills.details },
    education: { score: education.score, weight: weights.education, details: education.details },
    projects: { score: projects.score, weight: weights.projects, details: projects.details },
    experience: { score: experience.score, weight: weights.experience, details: experience.details },
    completeness: { score: completeness.score, weight: weights.completeness, details: completeness.details }
  };

  const weightedSum = Object.values(subscores).reduce(
    (sum, s) => sum + s.score * s.weight,
    0
  );
  const finalScore = Math.round(weightedSum * 1000) / 10;

  return {
    modelVersion: MODEL_VERSION,
    computedAt: new Date().toISOString(),
    weights,
    subscores,
    finalScore,
    tips: buildTips(subscores)
  };
}

module.exports = {
  score
};
