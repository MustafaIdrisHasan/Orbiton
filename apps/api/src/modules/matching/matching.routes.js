'use strict';
/**
 * Matching routes.
 *
 *   GET /api/v1/matching/drives?studentId=... — top drives for a student
 *   GET /api/v1/matching/students?driveId=... — top students for a drive (TPO)
 *   POST /api/v1/matching/recompute/:driveId  — admin/TPO: trigger backfill
 *
 * Auth: re-use existing JWT + RBAC middleware. The router below assumes
 * `requireAuth` / `requireRole` helpers are available on `core/middleware`;
 * adjust the import path if yours differ.
 */

const express = require('express');
const service = require('./matching.service');

let auth = {};
try {
  auth = require('../../core/middleware'); // your existing module
} catch (_e) {
  // Fallback no-ops so the file still loads in environments without RBAC wired.
  auth = {
    requireAuth: (_req, _res, next) => next(),
    requireRole: () => (_req, _res, next) => next(),
  };
}
const { requireAuth, requireRole } = auth;

const router = express.Router();

router.get('/drives', requireAuth, async (req, res, next) => {
  try {
    const studentId = req.query.studentId || (req.user && req.user.studentId);
    if (!studentId) return res.status(400).json({ error: 'studentId_required' });
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const data = await service.matchDrivesForStudent({ studentId, limit });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/students', requireAuth, requireRole('TPO', 'ADMIN', 'RECRUITER'), async (req, res, next) => {
  try {
    const { driveId } = req.query;
    if (!driveId) return res.status(400).json({ error: 'driveId_required' });
    const limit = Math.min(Number(req.query.limit) || 20, 200);
    const data = await service.matchStudentsForDrive({ driveId, limit });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/recompute/:driveId', requireAuth, requireRole('TPO', 'ADMIN'), async (req, res, next) => {
  try {
    const { driveId } = req.params;
    const job = await service.enqueueDriveRecompute({ driveId });
    res.status(202).json(job);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
