const fs = require("fs");
const path = require("path");
const express = require("express");
const { env } = require("../../config/env");
const { getStorageAdapter } = require("../../integrations/storage");
const { score } = require("./scoring/scorer");
const store = require("./store");
const { ROLES, normalizeRoles } = require("../../core/constants/roles");

// Plain router — not createModuleRouter(), which registers a no-op `DELETE /:id`
// that would run before the real remove handler and leave uploads in the store.
const router = express.Router();

function viewerRoles(req) {
  const raw = [];
  if (Array.isArray(req.user?.roles)) raw.push(...req.user.roles);
  if (req.user?.role) raw.push(req.user.role);
  return normalizeRoles(raw);
}

router.get("/storage/adapter", (_req, res) => {
  res.json(getStorageAdapter());
});

function requireResumeScoring(_req, res, next) {
  if (!env.features.resumeScoring) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  next();
}

function resolveStudentId(req) {
  return req.user?.userId || req.user?.id || "demo-user";
}

router.put("/me/profile", requireResumeScoring, async (req, res, next) => {
  try {
    const studentId = resolveStudentId(req);
    const profile = req.body && typeof req.body === "object" ? req.body : {};
    const stored = await store.setProfile(studentId, profile);
    res.json({
      success: true,
      data: {
        studentId,
        profile: stored,
        updatedAt: stored.updatedAt
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/analyze", requireResumeScoring, async (req, res, next) => {
  try {
    const studentId = resolveStudentId(req);
    const resumeId = req.params.id;
    const overrideProfile = req.body && typeof req.body === "object" ? req.body.profile : null;
    const profile = overrideProfile || (await store.getProfile(studentId)) || {};
    const ctx = (req.body && req.body.context) || {};
    const result = score(profile, ctx);
    await store.setScore(resumeId, studentId, result);
    res.json({
      resumeId,
      studentId,
      modelVersion: result.modelVersion,
      computedAt: result.computedAt,
      weights: result.weights,
      subscores: result.subscores,
      finalScore: result.finalScore,
      tips: result.tips
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/score", requireResumeScoring, async (req, res, next) => {
  try {
    const row = await store.getScore(req.params.id);
    if (!row) {
      res.status(404).json({ message: "Score not found" });
      return;
    }
    res.json({
      resumeId: row.resumeId,
      studentId: row.studentId,
      modelVersion: row.breakdown.modelVersion,
      computedAt: row.computedAt,
      weights: row.breakdown.weights,
      subscores: row.breakdown.subscores,
      finalScore: row.finalScore,
      tips: row.breakdown.tips
    });
  } catch (err) {
    next(err);
  }
});

const upload = require("./upload");
upload.attach(router, requireResumeScoring, resolveStudentId);

const APP_ROOT = path.resolve(__dirname, "..", "..", "..");

/**
 * Download an uploaded PDF (resume_uploads / memory store). Student: own
 * files only. TPO / admin / recruiter: any applicant file (for review).
 */
router.get("/files/:uploadId", (req, res, next) => {
  (async () => {
    const row = await store.getUpload(req.params.uploadId);
    if (!row || !row.storageKey) {
      res.status(404).json({ message: "File not found" });
      return;
    }
    const userId = req.user?.userId || req.user?.id || null;
    const roles = viewerRoles(req);
    const isStaff =
      roles.includes(ROLES.TPO) || roles.includes(ROLES.ADMIN) || roles.includes(ROLES.RECRUITER);
    const isOwner = row.studentId && String(row.studentId) === String(userId);
    if (!isStaff && !isOwner) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    const abs = path.resolve(APP_ROOT, row.storageKey);
    const rel = path.relative(APP_ROOT, abs);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      res.status(400).json({ message: "Invalid path" });
      return;
    }
    if (!String(rel).replace(/\\/g, "/").startsWith("uploads/")) {
      res.status(400).json({ message: "Invalid path" });
      return;
    }
    if (!fs.existsSync(abs)) {
      res.status(404).json({ message: "File missing on disk" });
      return;
    }
    res.setHeader("Content-Type", row.contentType || "application/pdf");
    const name = String(row.filename || "resume.pdf").replace(/[\r\n"]/g, "_");
    res.setHeader("Content-Disposition", `inline; filename="${name}"`);
    fs.createReadStream(abs).pipe(res);
  })().catch(next);
});

// ---------------------------------------------------------------------------
// "My uploaded resumes" — DB-backed list for the student profile page.
// Also exposes a TPO-only path for the applicant-detail view.
// ---------------------------------------------------------------------------
const listService = require("./list.service");

router.get("/me/list", async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id || null;
    const items = await listService.listForUserId(userId);
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/activate", async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id || null;
    const updated = await listService.setActive(req.params.id, userId);
    if (!updated) {
      res.status(404).json({ message: "Resume not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    if (err.status === 403) {
      res.status(403).json({ message: "You can only activate your own resume" });
      return;
    }
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id || null;
    const removed = await listService.deleteForUser(req.params.id, userId);
    if (!removed) {
      res.status(404).json({ message: "Resume not found" });
      return;
    }
    res.status(204).end();
  } catch (err) {
    if (err?.status === 403) {
      res.status(403).json({ message: "You can only remove your own resume" });
      return;
    }
    next(err);
  }
});

router.get("/students/:studentId/list", async (req, res, next) => {
  // TPO/ADMIN/RECRUITER scoped — we don't expose other students' resumes
  // to a STUDENT viewer here.
  const roles = viewerRoles(req);
  const allowed = roles.includes(ROLES.TPO) || roles.includes(ROLES.ADMIN) || roles.includes(ROLES.RECRUITER);
  if (!allowed) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  try {
    const items = await listService.listForStudentId(req.params.studentId);
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
