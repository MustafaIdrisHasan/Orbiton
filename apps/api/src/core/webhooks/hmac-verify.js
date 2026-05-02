'use strict';
/**
 * HMAC verification middleware for inbound webhooks from the Python services.
 *
 * Wire format (must match shared/security/hmac.py):
 *   X-Orbiton-Timestamp: <unix-seconds>
 *   X-Orbiton-Signature: sha256=<hex digest>
 *
 * digest = HMAC_SHA256(secret, "<ts>." + raw_body)
 *
 * IMPORTANT: this middleware needs the RAW body. Mount it BEFORE
 * express.json() OR with a raw body capture. The example router below
 * shows the latter pattern with `express.raw({ type: 'application/json' })`.
 */

const crypto = require('crypto');

const REPLAY_WINDOW_SECONDS = 5 * 60;

function timingSafeEqual(a, b) {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function buildExpected(secret, ts, rawBody) {
  const msg = Buffer.concat([Buffer.from(`${ts}.`), Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody || '')]);
  const digest = crypto.createHmac('sha256', secret).update(msg).digest('hex');
  return `sha256=${digest}`;
}

function hmacVerify(req, res, next) {
  const secret = process.env.INTERNAL_HMAC_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'webhook_secret_not_configured' });
  }
  const ts = req.header('X-Orbiton-Timestamp');
  const sig = req.header('X-Orbiton-Signature');
  if (!ts || !sig) {
    return res.status(401).json({ error: 'missing_signature_headers' });
  }
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) {
    return res.status(401).json({ error: 'invalid_timestamp' });
  }
  const drift = Math.abs(Math.floor(Date.now() / 1000) - tsNum);
  if (drift > REPLAY_WINDOW_SECONDS) {
    return res.status(401).json({ error: 'timestamp_outside_replay_window' });
  }

  const rawBody = req.rawBody || req.body; // express.raw populates Buffer body
  const expected = buildExpected(secret, ts, rawBody);
  if (!timingSafeEqual(expected, sig)) {
    return res.status(401).json({ error: 'invalid_signature' });
  }

  // Parse JSON now that the signature is verified.
  try {
    req.body = JSON.parse(rawBody.toString('utf8'));
  } catch (e) {
    return res.status(400).json({ error: 'invalid_json' });
  }
  next();
}

module.exports = { hmacVerify };
