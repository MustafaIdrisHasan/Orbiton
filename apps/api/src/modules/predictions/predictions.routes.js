'use strict';
/**
 * Placement-readiness prediction routes.
 *
 *   POST /api/v1/predictions/placement   { studentId } — compute + persist
 *   GET  /api/v1/predictions/placement/:studentId      — latest cached
 */

const express = require('express');
const service = require('./predictions.service');

let auth = {};
try {
  auth = require('../../core/middleware');
} catch (_e) {
  auth = {
    requireAuth: (_req, _res, next) => next(),
    requireRole: () => (_req, _res, next) => next(),
  };
}
const { requireAuth, requireRole } = auth;

const router = express.Router();

router.post('/placement', requireAuth, async (req, res, next) => {
  try {
    const studentId = req.body && req.body.studentId;
    if (!studentId) return res.status(400).json({ error: 'studentId_required' });
    const data = await service.computeAndPersist({ studentId });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/placement/:studentId', requireAuth, async (req, res, next) => {
  try {
    const data = await service.getLatest({ studentId: req.params.studentId });
    if (!data) return res.status(404).json({ error: 'not_found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Bulk endpoint for TPO dashboards: compute readiness for a cohort.
router.post(
  '/placement/cohort',
  requireAuth,
  requireRole('TPO', 'ADMIN', 'FACULTY'),
  async (req, res, next) => {
    try {
      const ids = Array.isArray(req.body && req.body.studentIds) ? req.body.studentIds : [];
      if (!ids.length) return res.status(400).json({ error: 'studentIds_required' });
      const data = await service.computeCohort({ studentIds: ids });
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
