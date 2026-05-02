const fs = require("fs");
const path = require("path");
const { pool } = require("../../integrations/postgres/pool");
const { ensureMigrations } = require("../../integrations/postgres/migrate");

const APP_ROOT = path.resolve(__dirname, "..", "..", "..");

let migrationsPromise = null;

function ensureReady() {
  if (!pool) {
    throw new Error("POSTGRES_URL is not configured; cannot use postgres resume store");
  }
  if (!migrationsPromise) {
    migrationsPromise = ensureMigrations(pool).catch((err) => {
      migrationsPromise = null;
      throw err;
    });
  }
  return migrationsPromise;
}

async function query(sql, params) {
  await ensureReady();
  return pool.query(sql, params);
}

async function setProfile(studentId, profile) {
  if (!studentId) {
    return null;
  }
  const updatedAt = new Date().toISOString();
  const payload = { ...profile, studentId, updatedAt };
  await query(
    `INSERT INTO resume_profiles (student_id, profile, updated_at)
     VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (student_id) DO UPDATE SET profile = EXCLUDED.profile, updated_at = EXCLUDED.updated_at`,
    [studentId, JSON.stringify(payload), updatedAt]
  );
  return payload;
}

async function getProfile(studentId) {
  if (!studentId) {
    return null;
  }
  const result = await query(
    "SELECT profile FROM resume_profiles WHERE student_id = $1",
    [studentId]
  );
  if (result.rowCount === 0) {
    return null;
  }
  return result.rows[0].profile;
}

async function setResumeForStudent(resumeId, studentId) {
  if (!resumeId || !studentId) {
    return;
  }
  await query(
    `INSERT INTO resume_owners (resume_id, student_id)
     VALUES ($1, $2)
     ON CONFLICT (resume_id) DO UPDATE SET student_id = EXCLUDED.student_id`,
    [resumeId, studentId]
  );
}

async function getStudentForResume(resumeId) {
  if (!resumeId) {
    return null;
  }
  const result = await query(
    "SELECT student_id FROM resume_owners WHERE resume_id = $1",
    [resumeId]
  );
  return result.rowCount === 0 ? null : result.rows[0].student_id;
}

async function setScore(resumeId, studentId, scoreResult) {
  if (!resumeId) {
    return null;
  }
  if (studentId) {
    await setResumeForStudent(resumeId, studentId);
  }
  const computedAt = scoreResult.computedAt;
  const skillScore = scoreResult.subscores.skills.score;
  const experienceScore = scoreResult.subscores.experience.score;
  const completenessScore = scoreResult.subscores.completeness.score;
  const finalScore = scoreResult.finalScore;
  await query(
    `INSERT INTO ml_resume_scores
        (resume_id, student_id, skill_score, experience_score, completeness_score, final_score, breakdown, computed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
     ON CONFLICT (resume_id) DO UPDATE SET
        student_id = EXCLUDED.student_id,
        skill_score = EXCLUDED.skill_score,
        experience_score = EXCLUDED.experience_score,
        completeness_score = EXCLUDED.completeness_score,
        final_score = EXCLUDED.final_score,
        breakdown = EXCLUDED.breakdown,
        computed_at = EXCLUDED.computed_at`,
    [
      resumeId,
      studentId || null,
      skillScore,
      experienceScore,
      completenessScore,
      finalScore,
      JSON.stringify(scoreResult),
      computedAt
    ]
  );
  return {
    resumeId,
    studentId: studentId || null,
    skillScore,
    experienceScore,
    completenessScore,
    finalScore,
    breakdown: scoreResult,
    computedAt
  };
}

function rowToScore(row) {
  return {
    resumeId: row.resume_id,
    studentId: row.student_id,
    skillScore: row.skill_score,
    experienceScore: row.experience_score,
    completenessScore: row.completeness_score,
    finalScore: row.final_score,
    breakdown: row.breakdown,
    computedAt: row.computed_at instanceof Date ? row.computed_at.toISOString() : row.computed_at
  };
}

async function getScore(resumeId) {
  if (!resumeId) {
    return null;
  }
  const result = await query(
    "SELECT * FROM ml_resume_scores WHERE resume_id = $1",
    [resumeId]
  );
  return result.rowCount === 0 ? null : rowToScore(result.rows[0]);
}

async function getLatestScoreForStudent(studentId) {
  if (!studentId) {
    return null;
  }
  const result = await query(
    `SELECT * FROM ml_resume_scores
     WHERE student_id = $1
     ORDER BY computed_at DESC
     LIMIT 1`,
    [studentId]
  );
  return result.rowCount === 0 ? null : rowToScore(result.rows[0]);
}

async function recordUpload(upload) {
  if (!upload || !upload.uploadId) {
    return null;
  }
  const uploadedAt = upload.uploadedAt || new Date().toISOString();
  await query(
    `INSERT INTO resume_uploads
        (upload_id, student_id, filename, content_type, size_bytes, storage_key, extracted_text_length, uploaded_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (upload_id) DO NOTHING`,
    [
      upload.uploadId,
      upload.studentId || null,
      upload.filename || null,
      upload.contentType || null,
      upload.sizeBytes || 0,
      upload.storageKey || null,
      upload.extractedTextLength || 0,
      uploadedAt
    ]
  );
  return { ...upload, uploadedAt };
}

async function getUpload(uploadId) {
  if (!uploadId) {
    return null;
  }
  const result = await query(
    "SELECT * FROM resume_uploads WHERE upload_id = $1",
    [uploadId]
  );
  if (result.rowCount === 0) {
    return null;
  }
  const row = result.rows[0];
  return {
    uploadId: row.upload_id,
    studentId: row.student_id,
    filename: row.filename,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    storageKey: row.storage_key,
    extractedTextLength: row.extracted_text_length,
    uploadedAt: row.uploaded_at instanceof Date ? row.uploaded_at.toISOString() : row.uploaded_at
  };
}

async function listUploadsForStudent(studentId) {
  if (!studentId) {
    return [];
  }
  const result = await query(
    `SELECT upload_id, student_id, filename, content_type, size_bytes, storage_key, extracted_text_length, uploaded_at
       FROM resume_uploads
      WHERE student_id = $1
      ORDER BY uploaded_at DESC`,
    [String(studentId)]
  );
  return result.rows.map((row) => ({
    uploadId: row.upload_id,
    studentId: row.student_id,
    filename: row.filename,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    storageKey: row.storage_key,
    extractedTextLength: row.extracted_text_length,
    uploadedAt: row.uploaded_at instanceof Date ? row.uploaded_at.toISOString() : row.uploaded_at
  }));
}

async function deleteUploadArtifacts(uploadId, expectedStudentId) {
  if (!uploadId || !expectedStudentId) {
    return false;
  }
  const row = await getUpload(uploadId);
  if (!row) {
    return false;
  }
  if (String(row.studentId) !== String(expectedStudentId)) {
    const e = new Error("forbidden");
    e.status = 403;
    throw e;
  }
  if (row.storageKey) {
    const abs = path.resolve(APP_ROOT, row.storageKey);
    const rel = path.relative(APP_ROOT, abs);
    if (!rel.startsWith("..") && !path.isAbsolute(rel) && String(rel).replace(/\\/g, "/").startsWith("uploads/")) {
      try {
        await fs.promises.unlink(abs);
      } catch {
        /* best effort */
      }
    }
  }
  await query(`DELETE FROM ml_resume_scores WHERE resume_id = $1`, [uploadId]);
  await query(`DELETE FROM resume_owners WHERE resume_id = $1`, [uploadId]);
  await query(`DELETE FROM resume_uploads WHERE upload_id = $1`, [uploadId]);
  return true;
}

async function _resetForTests() {
  await query("TRUNCATE TABLE ml_resume_scores, resume_profiles, resume_owners, resume_uploads", []);
}

module.exports = {
  backend: "postgres",
  setProfile,
  getProfile,
  setScore,
  getScore,
  setResumeForStudent,
  getStudentForResume,
  getLatestScoreForStudent,
  recordUpload,
  getUpload,
  listUploadsForStudent,
  deleteUploadArtifacts,
  _resetForTests
};
