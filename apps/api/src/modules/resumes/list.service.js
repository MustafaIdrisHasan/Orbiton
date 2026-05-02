// "My uploaded resumes" — `resumes` (placement profile) + `resume_uploads` (ML/PDF pipeline).
//
// PDF uploads go to `resume_uploads` with student_id = JWT user_id; the legacy
// `resumes` table (joined via student_profiles) is separate. TPO profile view
// needs both to show "View file" for the common upload flow.

const fs = require("fs");
const path = require("path");
const { pool } = require("../../integrations/postgres/pool");
const store = require("./store");

const APP_ROOT = path.resolve(__dirname, "..", "..", "..");

function rowToResume(row) {
  const fp = row.file_path || "";
  return {
    id: row.id,
    studentId: row.student_id,
    filePath: row.file_path,
    fileName: fp ? path.basename(fp) : null,
    isActive: Boolean(row.is_active),
    uploadedAt: row.uploaded_at ? new Date(row.uploaded_at).toISOString() : null,
  };
}

async function listForStudentId(studentProfileId) {
  if (!pool || !studentProfileId) return [];
  const result = await pool.query(
    `SELECT id, student_id, file_path, is_active, uploaded_at
       FROM resumes
      WHERE student_id = $1
      ORDER BY uploaded_at DESC`,
    [studentProfileId],
  );
  return result.rows.map(rowToResume);
}

async function listForUserId(userId) {
  if (!userId) return [];
  const merged = [];
  const seen = new Set();

  if (pool) {
    try {
      const result = await pool.query(
        `SELECT r.id, r.student_id, r.file_path, r.is_active, r.uploaded_at
           FROM resumes r
           JOIN student_profiles sp ON sp.id = r.student_id
          WHERE sp.user_id = $1
          ORDER BY r.uploaded_at DESC`,
        [userId],
      );
      for (const row of result.rows) {
        const item = rowToResume(row);
        merged.push(item);
        seen.add(String(item.id));
      }
    } catch {
      /* missing tables or empty DB */
    }
  }

  const uploads = await store.listUploadsForStudent(String(userId));
  for (const u of uploads) {
    const id = String(u.uploadId);
    if (seen.has(id)) {
      // eslint-disable-next-line no-continue
      continue;
    }
    seen.add(id);
    merged.push({
      id: u.uploadId,
      studentId: u.studentId,
      filePath: `/resumes/files/${u.uploadId}`,
      fileName: u.filename || null,
      isActive: false,
      uploadedAt: u.uploadedAt,
    });
  }

  merged.sort(
    (a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime(),
  );
  return merged;
}

async function setActive(resumeId, userId) {
  if (!pool) return null;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Confirm ownership
    const owner = await client.query(
      `SELECT r.id, sp.user_id
         FROM resumes r
         JOIN student_profiles sp ON sp.id = r.student_id
        WHERE r.id = $1`,
      [resumeId],
    );
    if (!owner.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }
    if (userId && owner.rows[0].user_id && owner.rows[0].user_id !== userId) {
      await client.query("ROLLBACK");
      const e = new Error("forbidden");
      e.status = 403;
      throw e;
    }
    // Deactivate siblings then activate the requested one.
    await client.query(
      `UPDATE resumes SET is_active = false
         WHERE student_id = (SELECT student_id FROM resumes WHERE id = $1)`,
      [resumeId],
    );
    const updated = await client.query(
      `UPDATE resumes SET is_active = true
        WHERE id = $1
        RETURNING id, student_id, file_path, is_active, uploaded_at`,
      [resumeId],
    );
    await client.query("COMMIT");
    return updated.rows[0] ? rowToResume(updated.rows[0]) : null;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Remove one resume the user owns: Orbiton `resume_upload` row, or a row in
 * infrastructure `resumes` (placement schema). Fails closed on ownership.
 */
async function deleteForUser(resumeId, userId) {
  if (!resumeId || !userId) {
    return null;
  }

  const upload = await store.getUpload(resumeId);
  if (upload) {
    if (String(upload.studentId) !== String(userId)) {
      const e = new Error("forbidden");
      e.status = 403;
      throw e;
    }
    await store.deleteUploadArtifacts(resumeId, userId);
    return { kind: "upload" };
  }

  if (!pool) {
    return null;
  }
  try {
    const r = await pool.query(
      `SELECT r.id, r.file_path
         FROM resumes r
         JOIN student_profiles sp ON sp.id = r.student_id
        WHERE r.id = $1::uuid AND sp.user_id = $2`,
      [resumeId, userId]
    );
    if (r.rowCount === 0) {
      return null;
    }
    const filePath = r.rows[0].file_path;
    await pool.query(`DELETE FROM resumes WHERE id = $1::uuid`, [resumeId]);
    if (filePath) {
      const abs = path.isAbsolute(filePath) ? filePath : path.resolve(APP_ROOT, filePath);
      const rel = path.relative(APP_ROOT, abs);
      if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
        try {
          await fs.promises.unlink(abs);
        } catch {
          /* best effort */
        }
      }
    }
    return { kind: "schema_resume" };
  } catch (err) {
    if (err && err.code === "22P02") {
      return null;
    }
    throw err;
  }
}

module.exports = { listForStudentId, listForUserId, setActive, deleteForUser };
