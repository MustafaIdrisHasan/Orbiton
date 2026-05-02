'use strict';
/**
 * Placement readiness scoring service.
 *
 * Pipeline:
 *   1. Build StudentFeatures from PG (academic + extracted skills + activities).
 *   2. Call prediction_service /v1/predict/placement.
 *   3. Persist `placement_predictions` row (one per inference).
 *   4. Return result with explanations to the caller.
 */

const intel = require('../../integrations/intelligence/client');
const { getDataSource } = require('../../integrations/typeorm/data-source');

async function _featureExtractor(ds, studentId) {
  const rows = await ds.query(
    `SELECT s.id,
            s.cgpa,
            s.backlog_count,
            s.year,
            s.department,
            s.experience_years,
            COALESCE(array_length(s.skills_normalized, 1), 0) AS skill_count,
            (SELECT COUNT(*) FROM internships i WHERE i.student_id = s.id) AS internship_count,
            (SELECT COUNT(*) FROM hackathons h WHERE h.student_id = s.id) AS hackathon_count,
            (SELECT COUNT(*) FROM projects p WHERE p.student_id = s.id) AS project_count,
            (SELECT COUNT(*) FROM certifications c WHERE c.student_id = s.id) AS certification_count
       FROM students s
      WHERE s.id = $1`,
    [studentId],
  );
  const r = rows[0];
  if (!r) {
    const err = new Error('student_not_found'); err.status = 404; throw err;
  }
  return {
    cgpa: r.cgpa != null ? Number(r.cgpa) : 0,
    backlog_count: Number(r.backlog_count || 0),
    internship_count: Number(r.internship_count || 0),
    hackathon_count: Number(r.hackathon_count || 0),
    skill_count: Number(r.skill_count || 0),
    project_count: Number(r.project_count || 0),
    certification_count: Number(r.certification_count || 0),
    department: (r.department || 'OTHER').toUpperCase(),
    year: Number(r.year || 4),
    has_internship: Number(r.internship_count || 0) > 0,
  };
}

async function _persistPrediction(ds, result) {
  await ds.query(
    `INSERT INTO placement_predictions
       (student_id, probability, risk_band, feature_contributions,
        features_snapshot, model_version)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)`,
    [
      result.student_id,
      result.probability,
      result.risk_band,
      JSON.stringify(result.feature_contributions || []),
      JSON.stringify(result.features_snapshot || {}),
      result.model_version,
    ],
  );
}

async function computeAndPersist({ studentId }) {
  const ds = await getDataSource();
  const features = await _featureExtractor(ds, studentId);
  const result = await intel.predictPlacement({ studentId, features });
  await _persistPrediction(ds, result);
  return result;
}

async function getLatest({ studentId }) {
  const ds = await getDataSource();
  const rows = await ds.query(
    `SELECT student_id, probability, risk_band, feature_contributions,
            features_snapshot, model_version, computed_at
       FROM placement_predictions
      WHERE student_id = $1
      ORDER BY computed_at DESC
      LIMIT 1`,
    [studentId],
  );
  return rows[0] || null;
}

async function computeCohort({ studentIds }) {
  // Sequential to keep prediction service load predictable; switch to a
  // p-limit / Promise.all with concurrency=8 once you have benchmarks.
  const out = [];
  for (const id of studentIds) {
    try {
      const r = await computeAndPersist({ studentId: id });
      out.push(r);
    } catch (err) {
      out.push({ student_id: id, error: err.message });
    }
  }
  return { count: out.length, results: out };
}

module.exports = { computeAndPersist, getLatest, computeCohort };
