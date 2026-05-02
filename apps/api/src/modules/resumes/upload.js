// Resume PDF upload route. Phase 2 entrypoint that accepts a multipart
// upload, persists the PDF bytes to a local directory, attempts a richer
// offline NLP extraction via the Flask ML service, and falls back to a
// deterministic keyword sniffer when the ML service is unavailable.
//
// Three layers of graceful degradation:
//   1. `pdf-parse` extracts text — failure → empty string.
//   2. POST /v1/internal/extract on the ML service produces a rich profile —
//      failure / timeout (>2000ms) / non-2xx → fall through to step 3.
//   3. Local hardcoded SKILL_HINTS sniffer produces a minimal skills-only
//      profile (the legacy behavior the test suite exercises).
//
// The route is feature-flagged on `ENABLE_RESUME_SCORING`. Both the in-memory
// and Postgres resume stores accept the same upload row shape.
//
// Strict non-breaking constraints:
// * Top-level response shape is unchanged: { uploadId, upload, profile,
//   score, backend, persisted }.
// * The Postgres schema is untouched — `storage_key` now holds the local file
//   path (POSIX-normalized, relative to the API root) instead of a synthetic
//   bucket key.

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const { env } = require("../../config/env");
const { score } = require("./scoring/scorer");
const store = require("./store");
const { enrichProfile } = require("./parse/localExtractors");

const MAX_PDF_BYTES = 5 * 1024 * 1024;
const EXTRACT_TIMEOUT_MS = 2000;

const APP_ROOT = path.resolve(__dirname, "..", "..", "..");
const UPLOAD_DIR = path.join(APP_ROOT, "uploads", "resumes");

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

ensureUploadDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      ensureUploadDir();
      cb(null, UPLOAD_DIR);
    } catch (err) {
      cb(err, UPLOAD_DIR);
    }
  },
  filename: (_req, _file, cb) => {
    cb(null, `${crypto.randomUUID()}.pdf`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_PDF_BYTES }
});

async function readUploadedBytes(filePath) {
  if (!filePath) {
    return Buffer.alloc(0);
  }
  try {
    return await fs.promises.readFile(filePath);
  } catch {
    return Buffer.alloc(0);
  }
}

async function extractText(buffer) {
  if (!buffer || !buffer.length) {
    return "";
  }
  try {
    const pdfParse = require("pdf-parse");
    const result = await pdfParse(buffer);
    return typeof result?.text === "string" ? result.text : "";
  } catch {
    return "";
  }
}

const SKILL_HINTS = [
  "react", "node.js", "node", "javascript", "typescript", "python", "java",
  "sql", "postgres", "mongodb", "docker", "kubernetes", "aws", "azure",
  "gcp", "system design", "rest", "graphql", "redis", "tensorflow",
  "pytorch", "scikit-learn", "git", "linux"
];

function inferSkills(text) {
  if (!text) {
    return [];
  }
  const lowered = text.toLowerCase();
  const found = new Set();
  for (const skill of SKILL_HINTS) {
    if (lowered.includes(skill)) {
      found.add(skill);
    }
  }
  return Array.from(found);
}

function buildProfileFromText(text) {
  const skills = inferSkills(text);
  return {
    skills,
    education: {},
    projects: [],
    experience: [],
    extractedTextLength: text.length,
    extractor: { engine: "fallback", version: "sniffer-v0.1.0" }
  };
}

async function callExtractorService(text) {
  if (typeof fetch !== "function") {
    return null;
  }
  if (!text) {
    return null;
  }
  const url = `${env.mlServiceUrl}/v1/internal/extract`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXTRACT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function isUsableExtractorPayload(payload) {
  return (
    payload &&
    typeof payload === "object" &&
    Array.isArray(payload.skills)
  );
}

function normalizeExtractorProfile(remote, text) {
  return {
    skills: Array.isArray(remote.skills) ? remote.skills : [],
    education: remote.education && typeof remote.education === "object" ? remote.education : {},
    projects: Array.isArray(remote.projects) ? remote.projects : [],
    experience: Array.isArray(remote.experience) ? remote.experience : [],
    extractedTextLength: text.length,
    extractor:
      remote.extractor && typeof remote.extractor === "object"
        ? remote.extractor
        : { engine: "remote", version: "unknown" },
    ...(Array.isArray(remote.organizations)
      ? { organizations: remote.organizations }
      : {})
  };
}

async function buildEnhancedProfile(text) {
  const remote = await callExtractorService(text);
  const base = isUsableExtractorPayload(remote)
    ? normalizeExtractorProfile(remote, text)
    : buildProfileFromText(text);

  // Enrichment pass: fill any empty section (education / projects / experience)
  // from local regex + lexicon extractors. Existing values from the remote
  // service or user input always win — we only fill gaps. This guarantees the
  // /resumes form auto-populates after a PDF upload even when the Flask
  // extractor service is unavailable.
  return enrichProfile(text, base);
}

function attach(router, requireResumeScoring, resolveStudentId) {
  router.post(
    "/upload",
    requireResumeScoring,
    (req, res, next) => {
      upload.single("file")(req, res, (err) => {
        if (!err) {
          next();
          return;
        }
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(413).json({ message: "File too large", maxBytes: MAX_PDF_BYTES });
          return;
        }
        res.status(400).json({ message: err.message || "Upload failed" });
      });
    },
    async (req, res, next) => {
      try {
        if (!req.file) {
          res.status(400).json({ message: "Expected multipart field 'file'" });
          return;
        }

        const studentId = resolveStudentId(req);
        const uploadId = path.parse(req.file.filename).name;
        const storageKey = path
          .relative(APP_ROOT, req.file.path)
          .split(path.sep)
          .join("/");

        const buffer = await readUploadedBytes(req.file.path);
        const text = await extractText(buffer);
        const profile = await buildEnhancedProfile(text);
        const stored = await store.setProfile(studentId, profile);

        const uploadRow = await store.recordUpload({
          uploadId,
          studentId,
          filename: req.file.originalname || null,
          contentType: req.file.mimetype || null,
          sizeBytes: req.file.size || 0,
          storageKey,
          extractedTextLength: text.length,
          uploadedAt: new Date().toISOString()
        });

        const result = score(profile, {});
        const scoreRow = await store.setScore(uploadId, studentId, result);

        res.status(201).json({
          uploadId,
          studentId,
          upload: uploadRow,
          profile: stored,
          score: {
            resumeId: uploadId,
            modelVersion: result.modelVersion,
            computedAt: result.computedAt,
            weights: result.weights,
            subscores: result.subscores,
            finalScore: result.finalScore,
            tips: result.tips
          },
          backend: store.getBackendName(),
          persisted: Boolean(scoreRow)
        });
      } catch (err) {
        next(err);
      }
    }
  );
}

module.exports = {
  attach,
  MAX_PDF_BYTES,
  EXTRACT_TIMEOUT_MS,
  UPLOAD_DIR,
  inferSkills,
  buildProfileFromText,
  buildEnhancedProfile,
  callExtractorService
};
