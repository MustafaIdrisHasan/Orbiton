"use strict";

function normSkill(value) {
  return String(value || "").trim().toLowerCase();
}

function studentSkillSetFromProfile(profile) {
  return new Set((profile?.skills || []).map(normSkill).filter(Boolean));
}

function requiredSkillsNormalized(drive) {
  const raw = drive?.requiredSkills || [];
  return raw.map(normSkill).filter(Boolean);
}

/**
 * Recommend a drive only if it has no required skills, or the student lists every required skill
 * (case-insensitive). Drives that require e.g. React are excluded when the student profile has no React.
 */
function skillsAlignForRecommendation(profile, drive) {
  const required = requiredSkillsNormalized(drive);
  if (required.length === 0) {
    return true;
  }
  const have = studentSkillSetFromProfile(profile);
  return required.every((r) => have.has(r));
}

module.exports = {
  normSkill,
  studentSkillSetFromProfile,
  requiredSkillsNormalized,
  skillsAlignForRecommendation
};
