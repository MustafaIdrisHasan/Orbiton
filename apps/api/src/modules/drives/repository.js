const { recruiterStore } = require("../recruiters/mockData");
const { _resetForTests: resetMatchingVocab } = require("../matching/vocabulary");

function listDrives() {
  return recruiterStore.drives;
}

function getDriveById(id) {
  return recruiterStore.drives.find((drive) => drive.id === id) || null;
}

function createDrive(payload) {
  const drive = {
    id: `drive-${Date.now()}`,
    recruiterId: recruiterStore.recruiter.id,
    createdAt: new Date().toISOString(),
    title: payload.title || "Untitled Drive",
    description: payload.description || "",
    openings: payload.openings || 0,
    location: payload.location || "TBD",
    applicationDeadline: payload.applicationDeadline || new Date().toISOString(),
    status: payload.status || "DRAFT",
    isFeatured: Boolean(payload.isFeatured),
    roundDeadlines: payload.roundDeadlines || [],
    candidates: [],
    packageLpa: payload.packageLpa ?? null,
    employmentType: payload.employmentType || "FULL_TIME",
    eligibleDepartments: payload.eligibleDepartments || [],
    minCgpa: payload.minCgpa ?? null,
    maxBacklogs: payload.maxBacklogs ?? 0,
    eligibleYears: payload.eligibleYears || [],
    requiredSkills: payload.requiredSkills || []
  };

  recruiterStore.drives.push(drive);
  resetMatchingVocab();
  return drive;
}

function updateDrive(id, payload) {
  const drive = getDriveById(id);
  if (!drive) {
    return null;
  }

  Object.assign(drive, payload, { id: drive.id });
  return drive;
}

function deleteDrive(id) {
  const index = recruiterStore.drives.findIndex((drive) => drive.id === id);
  if (index === -1) {
    return false;
  }

  recruiterStore.drives.splice(index, 1);
  return true;
}

module.exports = {
  listDrives,
  getDriveById,
  createDrive,
  updateDrive,
  deleteDrive
};
