const profilesByStudent = new Map();
const scoresByResume = new Map();
const resumesByStudent = new Map();
const uploadsById = new Map();

async function setProfile(studentId, profile) {
  if (!studentId) {
    return null;
  }
  const stored = {
    ...profile,
    studentId,
    updatedAt: new Date().toISOString()
  };
  profilesByStudent.set(studentId, stored);
  return stored;
}

async function getProfile(studentId) {
  if (!studentId) {
    return null;
  }
  return profilesByStudent.get(studentId) || null;
}

async function setResumeForStudent(resumeId, studentId) {
  if (!resumeId || !studentId) {
    return;
  }
  resumesByStudent.set(resumeId, studentId);
}

async function getStudentForResume(resumeId) {
  return resumesByStudent.get(resumeId) || null;
}

async function setScore(resumeId, studentId, scoreResult) {
  if (!resumeId) {
    return null;
  }
  await setResumeForStudent(resumeId, studentId);
  const row = {
    resumeId,
    studentId: studentId || null,
    skillScore: scoreResult.subscores.skills.score,
    experienceScore: scoreResult.subscores.experience.score,
    completenessScore: scoreResult.subscores.completeness.score,
    finalScore: scoreResult.finalScore,
    breakdown: scoreResult,
    computedAt: scoreResult.computedAt
  };
  scoresByResume.set(resumeId, row);
  return row;
}

async function getScore(resumeId) {
  if (!resumeId) {
    return null;
  }
  return scoresByResume.get(resumeId) || null;
}

async function getLatestScoreForStudent(studentId) {
  if (!studentId) {
    return null;
  }
  let latest = null;
  for (const row of scoresByResume.values()) {
    if (row.studentId !== studentId) {
      continue;
    }
    if (!latest || new Date(row.computedAt) > new Date(latest.computedAt)) {
      latest = row;
    }
  }
  return latest;
}

async function recordUpload(upload) {
  if (!upload || !upload.uploadId) {
    return null;
  }
  const row = {
    uploadId: upload.uploadId,
    studentId: upload.studentId || null,
    filename: upload.filename || null,
    contentType: upload.contentType || null,
    sizeBytes: upload.sizeBytes || 0,
    storageKey: upload.storageKey || null,
    extractedTextLength: upload.extractedTextLength || 0,
    uploadedAt: upload.uploadedAt || new Date().toISOString()
  };
  uploadsById.set(row.uploadId, row);
  return row;
}

async function getUpload(uploadId) {
  if (!uploadId) {
    return null;
  }
  return uploadsById.get(uploadId) || null;
}

async function listUploadsForStudent(studentId) {
  if (!studentId) {
    return [];
  }
  const want = String(studentId);
  const out = [];
  for (const row of uploadsById.values()) {
    if (row.studentId && String(row.studentId) === want) {
      out.push(row);
    }
  }
  return out.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
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
  uploadsById.delete(uploadId);
  scoresByResume.delete(uploadId);
  resumesByStudent.delete(uploadId);
  return true;
}

function _resetForTests() {
  profilesByStudent.clear();
  scoresByResume.clear();
  resumesByStudent.clear();
  uploadsById.clear();
}

module.exports = {
  backend: "memory",
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
