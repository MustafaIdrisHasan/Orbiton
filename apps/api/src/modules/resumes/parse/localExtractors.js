// Lightweight, dependency-free extractors that pull structured fields out
// of resume text. Used as a fallback / enrichment layer so the resume form
// (skills, education, projects, experience) auto-populates after a PDF
// upload even when the Flask / FastAPI ML services are unreachable.
//
// Output shape mirrors what `scoring/features.js` consumes:
//   { skills: string[],
//     education: { cgpa, branch, degree, year },
//     projects:  [{ title, description, tech: string[] }],
//     experience:[{ role, durationMonths, internship }] }

const CGPA_RE = /\b(?:CGPA|GPA|SGPA)\s*[:\-]?\s*(\d{1,2}(?:\.\d{1,2})?)\b/i;

// Branch label -> regex
const BRANCH_HINTS = [
  ["CSE",     /\b(CSE|Computer\s*Science(?:\s*(?:and|&)\s*Engineering)?|Computer\s*Engineering)\b/i],
  ["IT",      /\b(Information\s*Technology|IT\s*Engineering)\b/i],
  ["ECE",     /\b(ECE|Electronics(?:\s*(?:and|&)\s*Communication)?|Electronics\s*Engineering)\b/i],
  ["EEE",     /\b(EEE|Electrical(?:\s*(?:and|&)\s*Electronics)?\s*Engineering|Electrical\s*Engineering)\b/i],
  ["MECH",    /\b(Mech(?:anical)?(?:\s*Engineering)?)\b/i],
  ["CIVIL",   /\b(Civil(?:\s*Engineering)?)\b/i],
  ["CHEM",    /\b(Chem(?:ical)?(?:\s*Engineering)?)\b/i],
  ["BIOTECH", /\b(Bio[\s-]?Tech(?:nology)?)\b/i],
];

const DEGREE_RE  = /\b(B\.?\s*Tech|M\.?\s*Tech|B\.?\s*E\b|M\.?\s*E\b|Bachelor(?:'s)?|Master(?:'s)?|PhD|MBA|B\.?\s*Sc|M\.?\s*Sc|B\.?\s*A|M\.?\s*A)\b/i;
const YEAR_RE    = /\b(Final\s*Year|Pre-?Final\s*Year|Third\s*Year|Second\s*Year|First\s*Year|[1-5](?:st|nd|rd|th)\s*Year)\b/i;
const MONTHS_RE  = /(\d+)\s*(?:months?|mos?)\b/i;
const YEARS_RE   = /(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\b/i;
const INTERN_RE  = /\bintern(?:ship)?\b/i;

// Same skills lexicon used by the upload sniffer — kept in sync there.
const SKILL_LEXICON = [
  "react", "next.js", "node.js", "node", "express", "javascript", "typescript",
  "python", "java", "kotlin", "swift", "go", "rust", "c++", "c#",
  "html", "css", "tailwind", "sass",
  "sql", "postgres", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
  "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "ansible", "jenkins",
  "rest", "graphql", "grpc",
  "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "spacy",
  "machine learning", "deep learning", "nlp", "computer vision", "data science",
  "git", "github actions", "ci/cd", "linux",
  "fastapi", "django", "flask", "spring", "spring boot",
  "system design", "agile", "scrum",
];

function uniqLower(arr) {
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    const k = String(v || "").trim().toLowerCase();
    if (k && !seen.has(k)) { seen.add(k); out.push(k); }
  }
  return out;
}

function inferSkills(text) {
  if (!text) return [];
  const lc = text.toLowerCase();
  const found = [];
  for (const s of SKILL_LEXICON) {
    // word-boundary-ish match: avoid 'go' inside 'google' etc.
    const re = new RegExp(`(?:^|[^a-z0-9+#\.])${s.replace(/[.+#]/g, "\\$&")}(?:[^a-z0-9+#]|$)`, "i");
    if (re.test(lc)) found.push(s);
  }
  return uniqLower(found);
}

// Section splitter — returns { education, experience, projects, skills } body strings.
function splitSections(text) {
  const headers = [
    ["education",  /^[ \t]*(education|academic(?:s)?|qualifications?)[ \t]*$/im],
    ["experience", /^[ \t]*(experience|work\s*experience|internships?|professional\s*experience)[ \t]*$/im],
    ["projects",   /^[ \t]*(projects?|personal\s*projects?)[ \t]*$/im],
    ["skills",     /^[ \t]*(skills?|technical\s*skills?|tech\s*stack)[ \t]*$/im],
  ];
  const positions = [];
  for (const [name, re] of headers) {
    const m = re.exec(text);
    if (m) positions.push({ name, start: m.index, headerEnd: m.index + m[0].length });
  }
  positions.sort((a, b) => a.start - b.start);

  const out = { education: "", experience: "", projects: "", skills: "" };
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    const end = i + 1 < positions.length ? positions[i + 1].start : text.length;
    out[p.name] = text.slice(p.headerEnd, end).trim();
  }
  return out;
}

function extractEducation(text, sectionText) {
  const blob = `${sectionText || ""}\n${text || ""}`;

  let cgpa = null;
  const cgpaMatch = CGPA_RE.exec(blob);
  if (cgpaMatch) {
    const v = Number.parseFloat(cgpaMatch[1]);
    if (Number.isFinite(v)) {
      if (v <= 10) cgpa = v;
      else if (v <= 100) cgpa = Math.round((v / 10) * 100) / 100; // percentage → 10-scale
    }
  }

  let branch = null;
  for (const [label, re] of BRANCH_HINTS) {
    if (re.test(blob)) { branch = label; break; }
  }

  let degree = null;
  const degreeMatch = DEGREE_RE.exec(blob);
  if (degreeMatch) degree = degreeMatch[0].replace(/\s+/g, " ").trim();

  let year = null;
  const yearMatch = YEAR_RE.exec(blob);
  if (yearMatch) year = yearMatch[0].replace(/\s+/g, " ").trim();

  return { cgpa, branch, degree, year };
}

function extractTechForProject(line) {
  // Reuses the global lexicon so project tech stays consistent with skills.
  if (!line) return [];
  const lc = line.toLowerCase();
  const out = [];
  for (const s of SKILL_LEXICON) {
    if (lc.includes(s)) out.push(s);
  }
  return uniqLower(out);
}

function chunkBlankLineGroups(block) {
  if (!block) return [];
  return block.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
}

function extractProjects(sectionText) {
  const chunks = chunkBlankLineGroups(sectionText);
  const out = [];
  for (const chunk of chunks.slice(0, 6)) {
    const lines = chunk.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const title = lines[0].replace(/^[-•*●▪]\s*/, "").slice(0, 120);
    const rest = lines.slice(1).join(" ").replace(/^[-•*●▪]\s*/, "").slice(0, 400);
    out.push({
      title,
      description: rest,
      tech: extractTechForProject(`${title} ${rest}`),
    });
  }
  return out;
}

function extractExperience(sectionText) {
  const chunks = chunkBlankLineGroups(sectionText);
  const out = [];
  for (const chunk of chunks.slice(0, 6)) {
    const lines = chunk.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const header = lines[0].replace(/^[-•*●▪]\s*/, "").slice(0, 120);

    let months = 0;
    const monMatch = MONTHS_RE.exec(chunk);
    if (monMatch) months = Number(monMatch[1]);
    else {
      const yrMatch = YEARS_RE.exec(chunk);
      if (yrMatch) months = Math.round(Number(yrMatch[1]) * 12);
    }

    out.push({
      role: header,
      durationMonths: Number.isFinite(months) ? months : 0,
      internship: INTERN_RE.test(chunk),
    });
  }
  return out;
}

/**
 * Enrich a partial profile with locally-derived fields whenever a section
 * is empty. Existing values from the remote extractor / user form take
 * precedence — we only fill gaps.
 */
function enrichProfile(text, profile) {
  const result = { ...(profile || {}) };
  const sections = splitSections(text || "");

  // Skills — union, keep what we already have first
  const existingSkills = Array.isArray(result.skills) ? result.skills : [];
  if (existingSkills.length === 0) {
    result.skills = inferSkills(text);
  } else {
    const merged = uniqLower([...existingSkills, ...inferSkills(text)]);
    result.skills = merged;
  }

  // Education — fill any missing field
  const edu = result.education && typeof result.education === "object" ? { ...result.education } : {};
  const localEdu = extractEducation(text, sections.education);
  for (const key of ["cgpa", "branch", "degree", "year"]) {
    if (edu[key] == null || edu[key] === "") {
      edu[key] = localEdu[key];
    }
  }
  result.education = edu;

  // Projects — only fill when caller had nothing
  if (!Array.isArray(result.projects) || result.projects.length === 0) {
    result.projects = extractProjects(sections.projects);
  }

  // Experience — only fill when caller had nothing
  if (!Array.isArray(result.experience) || result.experience.length === 0) {
    result.experience = extractExperience(sections.experience);
  }

  return result;
}

module.exports = {
  SKILL_LEXICON,
  inferSkills,
  splitSections,
  extractEducation,
  extractProjects,
  extractExperience,
  enrichProfile,
};
