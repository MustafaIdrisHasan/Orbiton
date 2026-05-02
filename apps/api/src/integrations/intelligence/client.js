'use strict';
/**
 * HTTP client for the three Python intelligence services.
 *
 * Endpoints:
 *   resume_service     : POST /v1/parse        (enqueue async)
 *                        POST /v1/parse/sync   (debug only)
 *   matching_service   : POST /v1/embed
 *                        POST /v1/match
 *   prediction_service : POST /v1/predict/placement
 *
 * Each call adds a request id and a short timeout. Failures bubble up to
 * the caller — we never silently drop intelligence errors because the
 * UI treats "score unavailable" as a real state.
 */

const fetch = global.fetch || ((...args) => import('node-fetch').then(({ default: f }) => f(...args)));

const ENV = process.env;
const RESUME_BASE = ENV.RESUME_SERVICE_URL || 'http://127.0.0.1:8001';
const MATCH_BASE = ENV.MATCHING_SERVICE_URL || 'http://127.0.0.1:8002';
const PREDICT_BASE = ENV.PREDICTION_SERVICE_URL || 'http://127.0.0.1:8003';
const DEFAULT_TIMEOUT_MS = Number(ENV.INTELLIGENCE_TIMEOUT_MS || 8000);

async function postJson(url, body, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ac.signal,
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_e) { data = text; }
    if (!res.ok) {
      const err = new Error(`intelligence_${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  } finally {
    clearTimeout(t);
  }
}

// ---- resume_service ----
async function enqueueResumeParse({ resumeId, fileUri }) {
  return postJson(`${RESUME_BASE}/v1/parse`, {
    resume_id: resumeId,
    file_uri: fileUri,
  });
}

async function syncResumeParse({ resumeId, fileUri }) {
  return postJson(`${RESUME_BASE}/v1/parse/sync`, {
    resume_id: resumeId,
    file_uri: fileUri,
  }, { timeoutMs: 30000 });
}

// ---- matching_service ----
async function embedTexts(texts) {
  return postJson(`${MATCH_BASE}/v1/embed`, { texts });
}

async function matchDriveAgainstStudents({ drive, students, weights }) {
  return postJson(`${MATCH_BASE}/v1/match`, { drive, students, weights });
}

// ---- prediction_service ----
async function predictPlacement({ studentId, features }) {
  return postJson(`${PREDICT_BASE}/v1/predict/placement`, {
    student_id: studentId,
    features,
  });
}

module.exports = {
  enqueueResumeParse,
  syncResumeParse,
  embedTexts,
  matchDriveAgainstStudents,
  predictPlacement,
};
