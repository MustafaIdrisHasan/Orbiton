'use strict';
/**
 * Matching service.
 *
 * Strategy (per the multi-factor brief):
 *   1. Fetch drive + boolean criteria from PG.
 *   2. SQL prefilter using `skills_normalized @> required_skills` and
 *      `cgpa >= min_cgpa`. Top-K candidates ordered by pgvector HNSW.
 *   3. Send candidates + drive context to matching_service /v1/match
 *      for composite scoring + explanations.
 *   4. Persist `match_runs` and return ranked list.
 *
 * Caches are intentionally absent at this layer — the hot path is short
 * (a few hundred candidates max) and TPOs need fresh numbers when they
 * pull a list. Add a per-(student,drive) TTL cache later if needed.
 */

const intel = require('../../integrations/intelligence/client');
const { enqueueMatchPrecompute } = require('../../integrations/queue/jobs');
const { getDataSource } = require('../../integrations/typeorm/data-source');
const { createIdScope } = require('../../integrations/intelligence/uuid-map');

const TOP_K_FOR_SCORING = 100;

async function _loadDrive(ds, driveId) {
  const rows = await ds.query(
    `SELECT id,
            jd_embedding,
            COALESCE(required_skills, '{}'::text[]) AS required_skills,
            COALESCE(preferred_skills, '{}'::text[]) AS preferred_skills,
            min_cgpa,
            min_experience_years
       FROM drives
      WHERE id = $1`,
    [driveId],
  );
  return rows[0] || null;
}

async function _candidatesForDrive(ds, drive, limit) {
  // Boolean prefilter + pgvector ANN. We use the cosine distance operator
  // `<=>` ascending order = most similar first.
  const params = [drive.id, drive.jd_embedding, limit];
  let where = '';

  if (drive.required_skills && drive.required_skills.length > 0) {
    params.push(drive.required_skills);
    where += ` AND s.skills_normalized @> $${params.length}::text[]`;
  }
  if (drive.min_cgpa != null) {
    params.push(drive.min_cgpa);
    where += ` AND s.cgpa >= $${params.length}`;
  }

  const sql = `
    SELECT s.id,
           s.profile_embedding,
           COALESCE(s.skills_normalized, '{}'::text[]) AS skills_normalized,
           s.cgpa,
           s.experience_years
      FROM students s
     WHERE s.profile_embedding IS NOT NULL
       ${where}
     ORDER BY s.profile_embedding <=> $2::vector
     LIMIT $3
  `;
  return ds.query(sql, params);
}

async function _candidatesForStudent(ds, studentEmbedding, limit) {
  const sql = `
    SELECT d.id,
           d.jd_embedding,
           COALESCE(d.required_skills, '{}'::text[]) AS required_skills,
           COALESCE(d.preferred_skills, '{}'::text[]) AS preferred_skills,
           d.min_cgpa,
           d.min_experience_years
      FROM drives d
     WHERE d.jd_embedding IS NOT NULL
       AND d.status = 'PUBLISHED'
     ORDER BY d.jd_embedding <=> $1::vector
     LIMIT $2
  `;
  return ds.query(sql, [studentEmbedding, limit]);
}

function _parseVector(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return null;
  const inner = String(value).trim().replace(/^\[|\]$/g, '');
  if (!inner) return [];
  return inner.split(',').map(Number);
}

async function _loadInstitutionWeights(ds, _institutionId) {
  // For now we always pull the global default row.
  const rows = await ds.query(
    `SELECT cosine_weight AS cosine,
            skill_jaccard_weight AS skill_jaccard,
            experience_fit_weight AS experience_fit,
            cgpa_fit_weight AS cgpa_fit
       FROM matching_config
      WHERE institution_id IS NULL
      LIMIT 1`,
  );
  return rows[0] ? {
    cosine: Number(rows[0].cosine),
    skill_jaccard: Number(rows[0].skill_jaccard),
    experience_fit: Number(rows[0].experience_fit),
    cgpa_fit: Number(rows[0].cgpa_fit),
  } : null;
}

async function _persistMatchRuns(ds, results) {
  if (!results.length) return;
  const values = [];
  const params = [];
  results.forEach((r, i) => {
    const base = i * 9;
    values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9})`);
    params.push(
      r.student_id,
      r.drive_id,
      r.explanations.cosine_similarity,
      r.explanations.skill_jaccard,
      r.composite_score,
      r.boolean_pass,
      JSON.stringify(r.explanations),
      r.model_version,
      r.explanations.experience_fit ?? null,
    );
  });
  const sql = `
    INSERT INTO match_runs
      (student_id, drive_id, cosine_similarity, skill_jaccard, composite_score,
       boolean_pass, explanations, model_version, experience_fit)
    VALUES ${values.join(', ')}
  `;
  await ds.query(sql, params);
}

async function matchStudentsForDrive({ driveId, limit }) {
  const ds = await getDataSource();
  const drive = await _loadDrive(ds, driveId);
  if (!drive) {
    const err = new Error('drive_not_found'); err.status = 404; throw err;
  }
  if (!drive.jd_embedding) {
    return { driveId, results: [], note: 'jd_embedding not yet computed' };
  }

  const candidates = await _candidatesForDrive(ds, drive, TOP_K_FOR_SCORING);
  if (!candidates.length) {
    return { driveId, results: [], note: 'no candidates after boolean prefilter' };
  }

  const weights = await _loadInstitutionWeights(ds);
  const scope = createIdScope();
  const matchResp = await intel.matchDriveAgainstStudents({
    drive: {
      drive_id: scope.driveToUuid(drive.id),
      embedding: _parseVector(drive.jd_embedding),
      required_skills: drive.required_skills || [],
      preferred_skills: drive.preferred_skills || [],
      min_cgpa: drive.min_cgpa != null ? Number(drive.min_cgpa) : null,
      min_experience_years: drive.min_experience_years != null ? Number(drive.min_experience_years) : null,
    },
    students: candidates.map((s) => ({
      student_id: scope.studentToUuid(s.id),
      embedding: _parseVector(s.profile_embedding),
      skills_normalized: s.skills_normalized || [],
      cgpa: s.cgpa != null ? Number(s.cgpa) : null,
      experience_years: s.experience_years != null ? Number(s.experience_years) : null,
    })),
    weights,
  });

  const rewritten = matchResp.results.map((r) => scope.rewriteMatchResult(r));
  await _persistMatchRuns(ds, rewritten);
  return {
    driveId,
    results: rewritten.slice(0, limit),
    weights_used: matchResp.weights_used,
    model_version: matchResp.model_version,
  };
}

async function matchDrivesForStudent({ studentId, limit }) {
  const ds = await getDataSource();
  const studentRows = await ds.query(
    `SELECT id, profile_embedding,
            COALESCE(skills_normalized, '{}'::text[]) AS skills_normalized,
            cgpa, experience_years
       FROM students WHERE id = $1`,
    [studentId],
  );
  const student = studentRows[0];
  if (!student) {
    const err = new Error('student_not_found'); err.status = 404; throw err;
  }
  if (!student.profile_embedding) {
    return { studentId, results: [], note: 'profile_embedding not yet computed' };
  }

  const drives = await _candidatesForStudent(ds, student.profile_embedding, TOP_K_FOR_SCORING);
  if (!drives.length) return { studentId, results: [] };

  const weights = await _loadInstitutionWeights(ds);

  // We score one drive at a time vs. this single student. For a small N this
  // is fine; for a large N a future optimization is one round-trip per drive
  // batch. The matching service already accepts up to 500 students per call.
  const scored = [];
  for (const d of drives) {
    const scope = createIdScope();
    const resp = await intel.matchDriveAgainstStudents({
      drive: {
        drive_id: scope.driveToUuid(d.id),
        embedding: _parseVector(d.jd_embedding),
        required_skills: d.required_skills || [],
        preferred_skills: d.preferred_skills || [],
        min_cgpa: d.min_cgpa != null ? Number(d.min_cgpa) : null,
        min_experience_years: d.min_experience_years != null ? Number(d.min_experience_years) : null,
      },
      students: [{
        student_id: scope.studentToUuid(student.id),
        embedding: _parseVector(student.profile_embedding),
        skills_normalized: student.skills_normalized,
        cgpa: student.cgpa != null ? Number(student.cgpa) : null,
        experience_years: student.experience_years != null ? Number(student.experience_years) : null,
      }],
      weights,
    });
    if (resp.results[0]) scored.push(scope.rewriteMatchResult(resp.results[0]));
  }

  scored.sort((a, b) =>
    (a.boolean_pass === b.boolean_pass) ? b.composite_score - a.composite_score : (a.boolean_pass ? -1 : 1)
  );
  const passed = scored.filter((r) => r.boolean_pass !== false);
  await _persistMatchRuns(ds, scored);

  return {
    studentId,
    results: passed.slice(0, limit),
    weights_used: weights || undefined,
    note: passed.length < scored.length ? "filtered_boolean_skill_eligibility" : undefined
  };
}

async function enqueueDriveRecompute({ driveId }) {
  const job = await enqueueMatchPrecompute({ driveId });
  return { jobId: job.id, driveId, status: 'queued' };
}

module.exports = {
  matchDrivesForStudent,
  matchStudentsForDrive,
  enqueueDriveRecompute,
};
