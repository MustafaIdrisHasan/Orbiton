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

// Free-form technical tokens / phrases that count as a "technical signal"
// for projects, even when no SKILL_LEXICON entry matched. Kept free of
// ambiguous English homographs (e.g. plain "go").
const PROJECT_TECH_TOKENS = new Set([
  "api", "apis", "sdk", "rest", "graphql", "grpc", "http", "https", "tcp",
  "udp", "ssh", "cli", "sql", "nosql", "crud", "orm",
  "backend", "frontend", "fullstack", "microservice", "microservices",
  "server", "client", "database", "databases", "cloud", "saas",
  "devops", "deploy", "deployment", "pipeline", "pipelines", "ci", "cd",
  "oauth", "jwt", "ssl", "tls", "encryption", "authentication", "authorization",
  "blockchain", "cryptography", "compiler", "parser", "regex", "scraping",
  "crawler", "etl", "gpu", "cuda", "algorithm", "algorithms", "architecture",
  "scalable", "latency", "throughput", "cache", "caching",
  "websocket", "websockets", "concurrency", "distributed",
  "tensorflow", "pytorch", "keras", "opencv", "nlp", "cnn", "rnn", "lstm",
  "numpy", "pandas", "matplotlib", "jupyter",
  "linux", "ubuntu", "kernel", "embedded", "iot", "arduino",
  "git", "github", "gitlab",
  "analytics", "predictive", "forecast", "forecasting", "ensemble",
  "inference",
]);

const PROJECT_TECH_PHRASES = [
  "machine learning", "deep learning", "data science", "computer vision",
  "natural language", "software engineering", "web development",
  "mobile app", "full stack", "object oriented", "distributed systems",
  "system design", "unit test", "integration test", "open source",
  "version control",
];

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

// Date-range parsing for experience (e.g. "Jan 2025 – Present", "Aug 2023 - May 2024").
const MONTH_TOKENS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
const DATE_RANGE_RE = new RegExp(
  String.raw`(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z\.]*\s+(\d{4})` +
    String.raw`\s*(?:[-–—to]+|\bto\b)\s*` +
    String.raw`(?:(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z\.]*\s+(\d{4})|(present|current|now))`,
  "gi"
);

function uniqLower(arr) {
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    const k = String(v || "").trim().toLowerCase();
    if (k && !seen.has(k)) { seen.add(k); out.push(k); }
  }
  return out;
}

function skillPattern(skill) {
  // Boundary-aware match — uses [a-z0-9] boundaries (not \b) so dotted /
  // punctuated tokens like node.js, c++, c#, ci/cd survive.
  const escaped = skill.replace(/[.+*?^$()|{}\[\]\\]/g, "\\$&");
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i");
}

const SKILL_PATTERNS = SKILL_LEXICON.map((s) => [s, skillPattern(s)]);

function inferSkills(text) {
  if (!text) return [];
  const found = [];
  for (const [skill, re] of SKILL_PATTERNS) {
    if (re.test(text)) found.push(skill);
  }
  return uniqLower(found);
}

// Section splitter — returns { education, experience, projects, skills } body strings.
function splitSections(text) {
  const headers = [
    ["education",  /^[ \t]*(education|academic(?:s)?|qualifications?)[ \t]*$/im],
    ["experience", /^[ \t]*(experience|work\s*experience|internships?|professional\s*experience)[ \t]*$/im],
    ["projects",   /^[ \t]*(projects?|personal\s*projects?|technical\s*projects?|academic\s*projects?)[ \t]*$/im],
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

function clampCgpaTen(v) {
  const n = Math.round(Math.max(0, Math.min(10, v)) * 100) / 100;
  return Number.isFinite(n) ? n : null;
}

function fromFourPointScale(numerator) {
  return clampCgpaTen((numerator / 4.0) * 10.0);
}

function extractCgpa(text) {
  if (!text) return null;

  // CGPA <num>/10
  let m = /cgpa\s*[:\-]?\s*(\d{1,2}\.\d{1,2})\s*\/\s*10(?:\.0)?\b/i.exec(text);
  if (m) {
    const v = Number.parseFloat(m[1]);
    if (v >= 0 && v <= 10) return clampCgpaTen(v);
  }
  // CGPA <num>/4
  m = /cgpa\s*[:\-]?\s*(\d{1,2}\.\d{1,2})\s*\/\s*4(?:\.0)?\b/i.exec(text);
  if (m) {
    const v = Number.parseFloat(m[1]);
    if (v >= 0 && v <= 4.5) return fromFourPointScale(v);
  }
  // Generic <num>/10
  m = /(\d{1,2}\.\d{1,2})\s*\/\s*10(?:\.0)?\b/i.exec(text);
  if (m) {
    const v = Number.parseFloat(m[1]);
    if (v >= 0 && v <= 10) return clampCgpaTen(v);
  }
  // Generic <num>/4
  m = /(\d{1,2}\.\d{1,2})\s*\/\s*4(?:\.0)?\b/i.exec(text);
  if (m) {
    const v = Number.parseFloat(m[1]);
    if (v >= 0 && v <= 4.5) return fromFourPointScale(v);
  }
  // Bare CGPA: <num> (10-point Indian style)
  m = /cgpa\s*[:\-]?\s*(\d{1,2}\.\d{1,2})\b/i.exec(text);
  if (m) {
    const v = Number.parseFloat(m[1]);
    if (v >= 0 && v <= 10) return clampCgpaTen(v);
  }
  // Standalone GPA: <num> — assume 4-point if <= 4.0, else 10-point.
  m = /(?<![a-z])gpa\s*[:\-]?\s*(\d{1,2}\.\d{1,2})\b/i.exec(text);
  if (m) {
    const v = Number.parseFloat(m[1]);
    if (v >= 0 && v <= 4.0) return fromFourPointScale(v);
    if (v > 4.0 && v <= 10.0) return clampCgpaTen(v);
  }
  // Percentage on a "Percentage:" line — convert to 10-point.
  m = /percentage\s*[:\-]?\s*(\d{1,3}(?:\.\d{1,2})?)\b/i.exec(text);
  if (m) {
    const v = Number.parseFloat(m[1]);
    if (v >= 0 && v <= 100) return clampCgpaTen(v / 10);
  }
  return null;
}

function extractEducation(text, sectionText) {
  const blob = `${sectionText || ""}\n${text || ""}`;

  const cgpa = extractCgpa(blob);

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
  if (!line) return [];
  const out = [];
  for (const [skill, re] of SKILL_PATTERNS) {
    if (re.test(line)) out.push(skill);
  }
  return uniqLower(out);
}

function projectHasTechnicalSignal(title, description, tech) {
  if (tech && tech.length) return true;
  const blob = `${title}\n${description}`.toLowerCase();
  // Token check — split on non-alphanumeric (keeping ., +, #) and look up.
  const tokens = new Set();
  for (const t of blob.split(/[^a-z0-9+#.]+/)) {
    if (t && t.length >= 2) tokens.add(t);
  }
  for (const tok of tokens) {
    if (PROJECT_TECH_TOKENS.has(tok)) return true;
  }
  for (const phrase of PROJECT_TECH_PHRASES) {
    if (blob.includes(phrase)) return true;
  }
  return false;
}

function splitProjectBlocks(section) {
  if (!section) return [];
  // First try blank-line separated chunks.
  let chunks = section.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
  if (chunks.length > 1) return chunks;

  // Fall back to bullet-marker splitting — typical when pdf-parse collapses
  // PROJECTS / Title / • bullet / Title / • bullet into one chunk.
  //
  // We split on lines that start with a bullet, then re-group: each title
  // (a line without a leading bullet) starts a new chunk that owns the
  // following bullet lines.
  const lines = section.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const groups = [];
  let current = [];
  for (const line of lines) {
    const isBullet = /^[-*•·●▪◦▶▷]/.test(line);
    if (!isBullet) {
      if (current.length) groups.push(current.join("\n"));
      current = [line];
    } else if (current.length) {
      current.push(line);
    }
  }
  if (current.length) groups.push(current.join("\n"));
  return groups;
}

function extractProjects(sectionText) {
  const chunks = splitProjectBlocks(sectionText);
  const out = [];
  for (const chunk of chunks.slice(0, 8)) {
    const lines = chunk.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    let title = lines[0].replace(/^[-•*●▪·▶▷◦]\s*/, "").slice(0, 120);
    let description = lines.slice(1).join(" ").replace(/^[-•*●▪·▶▷◦]\s*/, "").slice(0, 400);

    // "Name: description …" on one line → title=name, body=description.
    if (title.includes(":") && title.indexOf(":") <= 90) {
      const [namePart, ...rest] = title.split(":");
      const name = namePart.trim();
      const tail = rest.join(":").trim();
      if (name && name.length <= 120) {
        title = name;
        description = (tail + (description ? " " + description : "")).trim().slice(0, 400);
      }
    }

    if (!title || title.length < 4) continue;

    const tech = extractTechForProject(`${title} ${description}`);
    if (!projectHasTechnicalSignal(title, description, tech)) continue;
    out.push({ title, description, tech });
  }
  return out;
}

function monthsFromDateRange(match) {
  const m1Key = String(match[1] || "").toLowerCase().slice(0, 4).replace(/\.$/, "");
  const m1 = MONTH_TOKENS[m1Key] || MONTH_TOKENS[m1Key.slice(0, 3)];
  const y1 = Number(match[2]);
  if (!m1 || !Number.isFinite(y1)) return null;

  let m2, y2;
  if (match[3]) {
    const m2Key = String(match[3] || "").toLowerCase().slice(0, 4).replace(/\.$/, "");
    m2 = MONTH_TOKENS[m2Key] || MONTH_TOKENS[m2Key.slice(0, 3)];
    y2 = Number(match[4]);
  } else {
    const now = new Date();
    m2 = now.getUTCMonth() + 1;
    y2 = now.getUTCFullYear();
  }
  if (!m2 || !Number.isFinite(y2)) return null;

  const months = (y2 - y1) * 12 + (m2 - m1);
  if (months < 0 || months > 240) return null;
  return months;
}

function extractExperience(sectionText, fullText) {
  const blob = sectionText || fullText || "";
  if (!blob) return [];
  const items = [];

  // 1) Prefer explicit date ranges — these give a real durationMonths.
  DATE_RANGE_RE.lastIndex = 0;
  let dm;
  while ((dm = DATE_RANGE_RE.exec(blob)) !== null) {
    const months = monthsFromDateRange(dm);
    if (months == null) continue;
    const ctxStart = Math.max(0, dm.index - 250);
    const ctxEnd = Math.min(blob.length, DATE_RANGE_RE.lastIndex + 250);
    const context = blob.slice(ctxStart, ctxEnd);
    const isInternship = INTERN_RE.test(context);
    // Pull the role from the line containing this match.
    const lineStart = blob.lastIndexOf("\n", dm.index) + 1;
    const lineEnd = blob.indexOf("\n", dm.index);
    const line = blob.slice(lineStart, lineEnd === -1 ? blob.length : lineEnd);
    const role = (line.split(/[|–—\-]/)[0] || "").trim() || (isInternship ? "Internship" : "Experience");
    items.push({
      role: role.slice(0, 120),
      durationMonths: months,
      internship: isInternship,
    });
  }
  if (items.length) return items;

  // 2) Fall back to chunked text + explicit "N months" / "N years".
  const chunks = blob.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
  for (const chunk of chunks.slice(0, 6)) {
    const lines = chunk.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const header = lines[0].replace(/^[-•*●▪]\s*/, "").slice(0, 120);

    let months = 0;
    const monMatch = MONTHS_RE.exec(chunk);
    if (monMatch) months = Number(monMatch[1]) || 0;
    else {
      const yrMatch = YEARS_RE.exec(chunk);
      if (yrMatch) months = Math.round(Number(yrMatch[1]) * 12);
    }

    items.push({
      role: header,
      durationMonths: Number.isFinite(months) ? months : 0,
      internship: INTERN_RE.test(chunk),
    });
  }
  return items;
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
    result.skills = uniqLower([...existingSkills, ...inferSkills(text)]);
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
    result.experience = extractExperience(sections.experience, text);
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
