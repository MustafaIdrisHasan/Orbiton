'use strict';
/**
 * Controllers for the internal webhook endpoints. ALL writes to PG
 * happen here — Python services post results, Node persists them.
 */

const { getDataSource } = require('../../integrations/typeorm/data-source');

async function handleResumeParseCallback(req, res) {
  const {
    resume_id: resumeId,
    job_id: jobId,
    status,
    json_resume: jsonResume,
    raw_text_chars: rawTextChars,
    parse_version: parseVersion,
    model_version: modelVersion,
    failure_reason: failureReason,
    duration_ms: durationMs,
  } = req.body || {};

  if (!resumeId || !status || !parseVersion || !modelVersion) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  if (!['queued', 'parsing', 'succeeded', 'failed'].includes(status)) {
    return res.status(400).json({ error: 'invalid_status' });
  }

  try {
    const ds = await getDataSource();
    const repo = ds.getRepository('ResumeParse');
    const row = repo.create({
      resume_id: resumeId,
      status,
      json_resume: jsonResume || null,
      raw_text_chars: rawTextChars ?? null,
      parse_version: parseVersion,
      model_version: modelVersion,
      failure_reason: failureReason || null,
      duration_ms: durationMs ?? null,
    });
    await repo.save(row);

    if (status === 'succeeded' && jsonResume) {
      // Side effect: derive normalized skills + enqueue embedding refresh.
      const skills = (jsonResume.skills || [])
        .map((s) => (s && s.name ? String(s.name).toLowerCase().trim() : ''))
        .filter(Boolean);

      const studentId = await _resumeOwnerStudentId(ds, resumeId);
      if (studentId) {
        await ds.query(
          `UPDATE students
              SET skills_normalized = $2::text[]
            WHERE id = $1`,
          [studentId, skills.length ? skills : ['']],
        );
        // Lazy require to avoid import cycle / cold-start delay
        const { enqueueEmbeddingRefresh } = require('../../integrations/queue/jobs');
        try {
          await enqueueEmbeddingRefresh({ kind: 'student', id: studentId });
        } catch (e) {
          // Non-fatal; embedding will be rebuilt on next student touch.
          // eslint-disable-next-line no-console
          console.warn('[internal] embedding refresh enqueue failed:', e.message);
        }
      }
    }

    return res.status(204).send();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[internal] resume parse callback failed:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}

async function _resumeOwnerStudentId(ds, resumeId) {
  // Look up the student that owns this resume. Schema is in your initial
  // SQL; adjust column names to match your existing `resumes` table.
  const rows = await ds.query(
    `SELECT student_id FROM resumes WHERE id = $1 LIMIT 1`,
    [resumeId],
  );
  return rows && rows[0] ? rows[0].student_id : null;
}

async function handleStudentEmbeddingUpdate(req, res) {
  const studentId = req.params.id;
  const { embedding, model_version: modelVersion } = req.body || {};
  if (!Array.isArray(embedding) || !modelVersion) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  try {
    const ds = await getDataSource();
    await ds.query(
      `UPDATE students
          SET profile_embedding = $2::vector,
              embedding_model_version = $3,
              embedding_computed_at = now()
        WHERE id = $1`,
      [studentId, _toVectorLiteral(embedding), modelVersion],
    );
    return res.status(204).send();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[internal] student embedding update failed:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}

async function handleDriveEmbeddingUpdate(req, res) {
  const driveId = req.params.id;
  const { embedding, model_version: modelVersion } = req.body || {};
  if (!Array.isArray(embedding) || !modelVersion) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  try {
    const ds = await getDataSource();
    await ds.query(
      `UPDATE drives
          SET jd_embedding = $2::vector,
              embedding_model_version = $3,
              embedding_computed_at = now()
        WHERE id = $1`,
      [driveId, _toVectorLiteral(embedding), modelVersion],
    );
    return res.status(204).send();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[internal] drive embedding update failed:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}

function _toVectorLiteral(arr) {
  return `[${arr.map(Number).join(',')}]`;
}

module.exports = {
  handleResumeParseCallback,
  handleStudentEmbeddingUpdate,
  handleDriveEmbeddingUpdate,
};
