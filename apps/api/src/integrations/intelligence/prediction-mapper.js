"use strict";

const { hashUuid } = require("./uuid-map");

/**
 * Map legacy Flask-style placement payload to FastAPI `PredictionRequest` body.
 */
function stableStudentUuid(studentId) {
  return hashUuid("placement:student", studentId);
}

function buildFastApiFeatures(payload) {
  const cgpa = Number(payload.cgpa);
  const resumeScore = payload.resumeScore != null ? Number(payload.resumeScore) : null;
  return {
    cgpa: Number.isFinite(cgpa) ? Math.min(10, Math.max(0, cgpa)) : 0,
    backlog_count: Number(payload.backlogs) || 0,
    internship_count: payload.hasInternship ? 1 : 0,
    hackathon_count: Number(payload.hackathonCount) || 0,
    skill_count: Number(payload.skillCount) || 0,
    project_count: Number(payload.projectCount) || 0,
    certification_count: Number(payload.certificationCount) || 0,
    department: String(payload.department || "OTHER"),
    year: Number(payload.year) || 4,
    has_internship: Boolean(payload.hasInternship),
    communication_score:
      payload.communicationScore != null ? Number(payload.communicationScore) : null,
    aptitude_score: resumeScore != null && Number.isFinite(resumeScore) ? resumeScore : null
  };
}

function normalizeFastApiPrediction(data) {
  return {
    available: true,
    probability: data.probability,
    riskBand: data.risk_band,
    modelVersion: data.model_version,
    contributions: data.feature_contributions,
    features: data.features_snapshot,
    preview: data.preview,
    rationale: data.rationale,
    backend: "prediction_service"
  };
}

module.exports = {
  stableStudentUuid,
  buildFastApiFeatures,
  normalizeFastApiPrediction
};
