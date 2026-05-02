'use strict';
/**
 * Internal webhook router — receives signed callbacks from Python services.
 * Mount under `/api/v1/internal` and gate every route with `hmacVerify`.
 *
 * Routes:
 *   POST /api/v1/internal/resumes/parse-callback
 *   POST /api/v1/internal/embeddings/student/:id
 *   POST /api/v1/internal/embeddings/drive/:id
 */

const express = require('express');
const { hmacVerify } = require('../../core/webhooks/hmac-verify');
const controller = require('./internal.controller');

const router = express.Router();

// Capture raw body so HMAC can be verified before JSON.parse().
const rawJson = express.raw({ type: 'application/json', limit: '5mb' });

router.post('/resumes/parse-callback', rawJson, (req, _res, next) => {
  req.rawBody = req.body; // Buffer captured by express.raw
  next();
}, hmacVerify, controller.handleResumeParseCallback);

router.post('/embeddings/student/:id', rawJson, (req, _res, next) => {
  req.rawBody = req.body; next();
}, hmacVerify, controller.handleStudentEmbeddingUpdate);

router.post('/embeddings/drive/:id', rawJson, (req, _res, next) => {
  req.rawBody = req.body; next();
}, hmacVerify, controller.handleDriveEmbeddingUpdate);

module.exports = router;
