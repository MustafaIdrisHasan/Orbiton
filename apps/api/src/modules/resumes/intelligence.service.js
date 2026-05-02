'use strict';
/**
 * Resume intelligence service — Node side.
 *
 *   - kickOffParse(resumeId): enqueue an async parse via Python service
 *   - getLatestParse(resumeId): read the most recent succeeded parse
 *
 * The Python worker calls back into /api/v1/internal/resumes/parse-callback
 * which writes the row in `resume_parses`.
 */

const intel = require('../../integrations/intelligence/client');
const { getDataSource } = require('../../integrations/typeorm/data-source');

async function kickOffParse({ resumeId, fileUri }) {
  if (!resumeId || !fileUri) {
    throw Object.assign(new Error('resumeId_and_fileUri_required'), { status: 400 });
  }
  const resp = await intel.enqueueResumeParse({ resumeId, fileUri });

  // Insert a 'queued' row so the UI can show "Parsing…" immediately.
  const ds = await getDataSource();
  const repo = ds.getRepository('ResumeParse');
  await repo.save(repo.create({
    resume_id: resumeId,
    status: 'queued',
    parse_version: 'pending',
    model_version: 'pending',
  }));

  return resp;
}

async function getLatestParse({ resumeId }) {
  const ds = await getDataSource();
  const repo = ds.getRepository('ResumeParse');
  const row = await repo
    .createQueryBuilder('p')
    .where('p.resume_id = :id', { id: resumeId })
    .orderBy('p.computed_at', 'DESC')
    .getOne();
  return row || null;
}

module.exports = { kickOffParse, getLatestParse };
