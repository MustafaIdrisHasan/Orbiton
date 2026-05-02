const intelligence = require("../../integrations/intelligence");
const resumeStore = require("../resumes/store");
const { recruiterStore } = require("../recruiters/mockData");

function findCandidate(studentId) {
  if (!studentId) {
    return null;
  }
  for (const drive of recruiterStore.drives || []) {
    for (const candidate of drive.candidates || []) {
      if (candidate?.id === studentId) {
        return candidate;
      }
    }
  }
  return null;
}

function inferHasInternship(profileLike) {
  const exp = profileLike?.experience;
  if (Array.isArray(exp)) {
    return exp.some((entry) => entry?.internship === true);
  }
  return Boolean(profileLike?.hasInternship);
}

async function buildPayload({ studentId, override }) {
  const base = {
    studentId,
    resumeScore: null,
    cgpa: null,
    hasInternship: false,
    projectCount: 0,
    backlogs: 0,
    skillCount: 0,
    department: "OTHER",
    year: 4
  };

  const storedProfile = await resumeStore.getProfile(studentId);
  if (storedProfile) {
    base.cgpa = storedProfile.education?.cgpa ?? base.cgpa;
    base.hasInternship = inferHasInternship(storedProfile);
    base.projectCount = (storedProfile.projects || []).length;
    base.backlogs = storedProfile.backlogs ?? base.backlogs;
    const skills = storedProfile.skills || [];
    base.skillCount = Array.isArray(skills) ? skills.length : 0;
    if (storedProfile.education?.branch) {
      base.department = String(storedProfile.education.branch).toUpperCase();
    }
  }

  const latestScore = await resumeStore.getLatestScoreForStudent(studentId);
  if (latestScore) {
    base.resumeScore = latestScore.finalScore;
  }

  if (!storedProfile) {
    const candidate = findCandidate(studentId);
    if (candidate) {
      base.cgpa = base.cgpa ?? candidate.cgpa ?? null;
      base.projectCount = base.projectCount || (candidate.projects || []).length;
      base.backlogs = candidate.backlogs ?? base.backlogs;
      base.resumeScore = base.resumeScore ?? candidate.resumeScore ?? null;
    }
  }

  if (override && typeof override === "object") {
    for (const key of [
      "resumeScore",
      "cgpa",
      "hasInternship",
      "projectCount",
      "backlogs",
      "skillCount",
      "department",
      "year",
      "hackathonCount",
      "certificationCount",
      "communicationScore"
    ]) {
      if (override[key] !== undefined && override[key] !== null) {
        base[key] = override[key];
      }
    }
  }

  return base;
}

async function predictForStudent({ studentId, override }) {
  const payload = await buildPayload({ studentId, override });
  const result = await intelligence.predictPlacement(payload);
  return { payload, result };
}

module.exports = {
  predictForStudent,
  buildPayload
};
