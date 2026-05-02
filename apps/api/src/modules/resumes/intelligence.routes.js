'use strict';
/**
 * Resume intelligence routes — to be mounted alongside the existing
 * resumes module:
 *
 *   const resumesRouter = express.Router();
 *   resumesRouter.use('/', require('./resumes.routes'));        // existing
 *   resumesRouter.use('/', require('./intelligence.routes'));   // this file
 *
 *   POST /api/v1/resumes/:id/analyze   — kick off parse
 *   GET  /api/v1/resumes/:id/score     — read latest parsed payload
 */

const express = require('express');
const service = require('./intelligence.service');

let auth = {};
try {
  auth = require('../../core/middleware');
} catch (_e) {
  auth = { requireAuth: (_req, _res, next) => next() };
}
const { requireAuth } = auth;

const router = express.Router();

router.post('/:id/analyze', requireAuth, async (req, res, next) => {
  try {
    const resumeId = req.params.id;
    const { fileUri } = req.body || {};
    if (!fileUri) return res.status(400).json({ error: 'fileUri_required' });
    const data = await service.kickOffParse({ resumeId, fileUri });
    res.status(202).json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/score', requireAuth, async (req, res, next) => {
  try {
    const data = await service.getLatestParse({ resumeId: req.params.id });
    if (!data) return res.status(404).json({ error: 'no_parse_yet' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
