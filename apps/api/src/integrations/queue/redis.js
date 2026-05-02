'use strict';
/**
 * Redis connection + BullMQ producers used by the Node API.
 *
 * Queues:
 *   embedding.refresh — recompute student/drive embeddings on profile/JD edits
 *   matching.precompute — optional: bulk score top-N students for a drive
 *
 * The resume.parse queue is owned by the Python Celery worker; Node does
 * NOT enqueue to it directly. Instead, Node calls
 * `intelligence/client.enqueueResumeParse` which hits the resume_service
 * HTTP API; the service decides job_id and ack semantics.
 */

const IORedis = require('ioredis');
const { Queue } = require('bullmq');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379/0';

let connection = null;
function getConnection() {
  if (!connection) {
    connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,        // BullMQ requirement
      enableReadyCheck: false,
    });
  }
  return connection;
}

const queues = {};
function getQueue(name) {
  if (!queues[name]) {
    queues[name] = new Queue(name, { connection: getConnection() });
  }
  return queues[name];
}

async function closeAll() {
  await Promise.all(Object.values(queues).map((q) => q.close()));
  if (connection) await connection.quit();
}

module.exports = { getConnection, getQueue, closeAll };
