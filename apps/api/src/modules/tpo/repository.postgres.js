// Postgres-backed queries for the TPO module.
// All read-only — TPO writes go through controller -> service which call
// the notifications module (the only writer).

const { pool } = require("../../integrations/postgres/pool");

function rowToStudentRow(r) {
  const fullName = r.full_name || r.name || (r.email ? r.email.split("@")[0] : "Student");
  return {
    id: r.student_id || r.id,
    userId: r.user_id || null,
    name: fullName,
    email: r.email || null,
    department: r.department || null,
    program: r.program || null,
    year: r.year_of_study || null,
    cgpa: r.cgpa != null ? Number(r.cgpa) : null,
    backlogs: r.backlog_count != null ? Number(r.backlog_count) : 0,
    applicationsCount: r.applications_count != null ? Number(r.applications_count) : 0,
    hasResume: Boolean(r.has_resume),
    status: r.backlog_count > 0 ? "Attention" : "On Track",
  };
}

async function listStudents() {
  if (!pool) return null;
  const result = await pool.query(
    `SELECT sp.id   AS student_id,
            sp.user_id,
            sp.full_name,
            u.email,
            sp.department,
            sp.program,
            sp.year_of_study,
            sp.cgpa,
            sp.backlog_count,
            (SELECT COUNT(*) FROM applications a WHERE a.student_id = sp.id) AS applications_count,
            EXISTS(SELECT 1 FROM resumes r WHERE r.student_id = sp.id) AS has_resume
       FROM student_profiles sp
       LEFT JOIN users u ON u.id = sp.user_id
      ORDER BY sp.created_at DESC
      LIMIT 500`,
  );
  return result.rows.map(rowToStudentRow);
}

async function getStudent(studentIdOrUserId) {
  if (!pool) return null;
  const result = await pool.query(
    `SELECT sp.id   AS student_id,
            sp.user_id,
            sp.full_name,
            u.email,
            u.ph_no,
            sp.department,
            sp.program,
            sp.year_of_study,
            sp.cgpa,
            sp.backlog_count,
            sp.date_of_birth,
            sp.created_at,
            (SELECT COUNT(*) FROM applications a WHERE a.student_id = sp.id) AS applications_count,
            EXISTS(SELECT 1 FROM resumes r WHERE r.student_id = sp.id) AS has_resume
       FROM student_profiles sp
       LEFT JOIN users u ON u.id = sp.user_id
      WHERE sp.id::text = $1 OR sp.user_id::text = $1
      LIMIT 1`,
    [String(studentIdOrUserId)],
  );
  if (!result.rows[0]) return null;
  const base = rowToStudentRow(result.rows[0]);
  return {
    ...base,
    phone: result.rows[0].ph_no || null,
    dateOfBirth: result.rows[0].date_of_birth || null,
  };
}

async function listStudentResumes(studentIdOrUserId) {
  if (!pool) return [];
  const result = await pool.query(
    `SELECT r.id, r.file_path, r.is_active, r.uploaded_at, r.student_id
       FROM resumes r
       JOIN student_profiles sp ON sp.id = r.student_id
      WHERE sp.id::text = $1 OR sp.user_id::text = $1
      ORDER BY r.uploaded_at DESC`,
    [String(studentIdOrUserId)],
  );
  return result.rows.map((row) => ({
    id: row.id,
    filePath: row.file_path,
    isActive: Boolean(row.is_active),
    uploadedAt: row.uploaded_at ? new Date(row.uploaded_at).toISOString() : null,
    studentId: row.student_id,
  }));
}

async function listDrivesByCreator(createdByUserId) {
  if (!pool) return [];
  const result = await pool.query(
    `SELECT pd.id,
            pd.title,
            pd.description,
            pd.status,
            pd.application_deadline,
            pd.location,
            pd.created_at,
            pd.created_by,
            u.email AS created_by_email,
            rp.company_name
       FROM placement_drives pd
       LEFT JOIN users u ON u.id = pd.created_by
       LEFT JOIN recruiter_profiles rp ON rp.id = pd.recruiter_id
      WHERE pd.created_by = $1
      ORDER BY pd.created_at DESC`,
    [createdByUserId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    deadline: row.application_deadline,
    location: row.location,
    createdAt: row.created_at,
    createdBy: row.created_by,
    createdByEmail: row.created_by_email,
    company: row.company_name || "—",
  }));
}

module.exports = {
  listStudents,
  getStudent,
  listStudentResumes,
  listDrivesByCreator,
};
