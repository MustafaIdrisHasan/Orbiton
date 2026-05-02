'use strict';
/**
 * Job-name + payload helpers. Centralizing these keeps the producer (Node)
 * and any future consumer (Node-side workers) in sync without magic strings.
 */

const { getQueue } = require('./redis');

const QUEUES = Object.freeze({
  EMBEDDING_REFRESH: 'embedding.refresh',
  MATCHING_PRECOMPUTE: 'matching.precompute',
});

async function enqueueEmbeddingRefresh({ kind, id }) {
  if (!['student', 'drive'].includes(kind)) {
    throw new Error(`invalid embedding refresh kind: ${kind}`);
  }
  const q = getQueue(QUEUES.EMBEDDING_REFRESH);
  return q.add(
    `${kind}.${id}`,
    { kind, id, requestedAt: new Date().toISOString() },
    { removeOnComplete: 1000, removeOnFail: 500, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
  );
}

async function enqueueMatchPrecompute({ driveId, topN = 50 }) {
  const q = getQueue(QUEUES.MATCHING_PRECOMPUTE);
  return q.add(
    `drive.${driveId}`,
    { driveId, topN, requestedAt: new Date().toISOString() },
    { removeOnComplete: 100, removeOnFail: 50, attempts: 2 },
  );
}

module.exports = { QUEUES, enqueueEmbeddingRefresh, enqueueMatchPrecompute };
