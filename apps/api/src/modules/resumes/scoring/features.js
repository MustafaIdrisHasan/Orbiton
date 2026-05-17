const { REQUIRED_SECTIONS } = require("./weights");

function clamp01(n) {
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, Math.min(1, n));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function normalizeStrings(values = []) {
  return values
    .map((v) => String(v || "").trim().toLowerCase())
    .filter(Boolean);
}

function scoreSkills(profile, ctx = {}) {
  const skills = normalizeStrings(profile.skills);
  const unique = new Set(skills);
  const targetSkills = normalizeStrings(ctx.targetSkills);

  const countScore = clamp01(skills.length / 12);
  const diversity = unique.size === 0 ? 0 : clamp01(unique.size / 10);

  let keywordMatch = 0;
  let matched = [];
  if (targetSkills.length > 0) {
    matched = targetSkills.filter((t) => unique.has(t));
    keywordMatch = matched.length / targetSkills.length;
  }

  const score =
    targetSkills.length > 0
      ? clamp01(0.4 * countScore + 0.3 * diversity + 0.3 * keywordMatch)
      : clamp01((0.4 * countScore + 0.3 * diversity) / 0.7);

  return {
    score,
    details: {
      count: skills.length,
      uniqueCount: unique.size,
      diversity: round2(diversity),
      keywordMatch: round2(keywordMatch),
      matched
    }
  };
}

function scoreEducation(profile, ctx = {}) {
  const education = profile.education || {};
  const cgpaRaw = Number(education.cgpa);
  const cgpa = Number.isFinite(cgpaRaw) ? cgpaRaw : null;
  const branch = String(education.branch || "").toUpperCase();
  const degree = String(education.degree || "").toLowerCase();

  const cgpaScore = cgpa == null ? 0 : clamp01((cgpa - 5) / 5);

  const hasDeptContext = Array.isArray(ctx.eligibleDepartments) && ctx.eligibleDepartments.length > 0;
  let relevance = 0;
  if (hasDeptContext) {
    relevance = ctx.eligibleDepartments.map((d) => String(d).toUpperCase()).includes(branch) ? 1 : 0.4;
  }

  const score = hasDeptContext
    ? clamp01(0.7 * cgpaScore + 0.3 * relevance)
    : clamp01(cgpaScore);

  return {
    score,
    details: {
      cgpa,
      degree: degree || null,
      branch: branch || null,
      relevance: round2(relevance)
    }
  };
}

function scoreProjects(profile, ctx = {}) {
  const projects = Array.isArray(profile.projects) ? profile.projects : [];
  const count = projects.length;
  const countScore = clamp01(count / 4);

  const target = normalizeStrings(ctx.targetSkills);
  let relevance = 0;
  if (count > 0 && target.length > 0) {
    const blob = projects
      .map((p) => `${p.title || ""} ${p.description || ""} ${(p.tech || []).join(" ")}`)
      .join(" ")
      .toLowerCase();
    const hits = target.filter((t) => blob.includes(t)).length;
    relevance = hits / target.length;
  }

  const score = target.length > 0
    ? clamp01(0.6 * countScore + 0.4 * relevance)
    : clamp01(countScore);

  return {
    score,
    details: {
      count,
      relevance: round2(relevance)
    }
  };
}

function scoreExperience(profile) {
  const exp = Array.isArray(profile.experience) ? profile.experience : [];
  let totalMonths = 0;
  let internshipMonths = 0;
  for (const item of exp) {
    const months = Number(item?.durationMonths) || 0;
    totalMonths += months;
    if (item?.internship) {
      internshipMonths += months;
    }
  }
  const internshipScore = clamp01(internshipMonths / 6);
  const totalScore = clamp01(totalMonths / 12);
  // Weight total experience (60%) as the primary driver; internship adds a
  // quality bonus (40%) rather than being the dominant requirement.
  const score = clamp01(0.6 * totalScore + 0.4 * internshipScore);

  return {
    score,
    details: {
      internshipMonths,
      totalMonths,
      hasInternship: internshipMonths > 0
    }
  };
}

function scoreCompleteness(profile) {
  const sections = [];
  if ((profile.skills || []).length > 0) {
    sections.push("skills");
  }
  if (profile.education && (profile.education.cgpa != null || profile.education.degree || profile.education.branch)) {
    sections.push("education");
  }
  if ((profile.projects || []).length > 0) {
    sections.push("projects");
  }
  if ((profile.experience || []).length > 0) {
    sections.push("experience");
  }

  const missing = REQUIRED_SECTIONS.filter((s) => !sections.includes(s));
  const score = sections.filter((s) => REQUIRED_SECTIONS.includes(s)).length / REQUIRED_SECTIONS.length;

  return {
    score: clamp01(score),
    details: {
      sections,
      missingSections: missing,
      coverage: round2(score)
    }
  };
}

module.exports = {
  scoreSkills,
  scoreEducation,
  scoreProjects,
  scoreExperience,
  scoreCompleteness,
  clamp01,
  round2
};
