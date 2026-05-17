const { ROLES, normalizeRoles } = require("../../core/constants/roles");
const { recruiterStore } = require("../recruiters/mockData");
const repository = require("./repository");

function isRecruiterUser(user) {
  if (!user?.roles) {
    return false;
  }
  return normalizeRoles(user.roles).includes(ROLES.RECRUITER);
}

function getLifecycleStatus(drive) {
  const s = String(drive?.status || "").toUpperCase();
  if (s === "ACTIVE") {
    return "PUBLISHED";
  }
  if (s === "DRAFT" || s === "PUBLISHED" || s === "CLOSED") {
    return s;
  }
  return "DRAFT";
}

function companyForDrive(drive) {
  // TPO-created drives carry a free-text companyName directly on the drive.
  if (drive?.companyName) {
    return drive.companyName;
  }
  if (!drive?.recruiterId) {
    return recruiterStore.recruiter.companyName;
  }
  if (drive.recruiterId === recruiterStore.recruiter.id) {
    return recruiterStore.recruiter.companyName;
  }
  return "Partner company";
}

function ownsRecruiterDrive(drive) {
  return drive?.recruiterId === recruiterStore.recruiter.id;
}

function toDriveSummary(drive) {
  return {
    id: drive.id,
    title: drive.title,
    description: drive.description,
    openings: drive.openings,
    location: drive.location,
    applicationDeadline: drive.applicationDeadline,
    status: getLifecycleStatus(drive),
    isFeatured: drive.isFeatured,
    candidateCount: (drive.candidates || []).length,
    companyName: companyForDrive(drive),
    packageLpa: drive.packageLpa ?? null,
    employmentType: drive.employmentType || "FULL_TIME",
    eligibleDepartments: drive.eligibleDepartments || [],
    minCgpa: drive.minCgpa ?? null,
    maxBacklogs: drive.maxBacklogs ?? null,
    eligibleYears: drive.eligibleYears || [],
    requiredSkills: drive.requiredSkills || [],
    createdAt: drive.createdAt || null
  };
}

function toDriveDetail(drive) {
  const summary = toDriveSummary(drive);
  return {
    ...summary,
    roundDeadlines: (drive.roundDeadlines || []).map((item) => ({
      id: item.id,
      label: item.label,
      date: item.date
    })),
    recruiter: {
      companyName: recruiterStore.recruiter.companyName,
      designation: recruiterStore.recruiter.designation
    }
  };
}

function toRecruiterDriveListItem(drive) {
  const cands = drive.candidates || [];
  return {
    id: drive.id,
    title: drive.title,
    status: getLifecycleStatus(drive),
    applicants_count: cands.length,
    shortlisted_count: cands.filter((c) => c.status === "SHORTLISTED").length,
    selected_count: cands.filter((c) => c.status === "SELECTED").length,
    deadline: drive.applicationDeadline,
    created_at: drive.createdAt || null,
    packageLpa: drive.packageLpa ?? null,
    employmentType: drive.employmentType || "FULL_TIME",
    eligibleDepartments: drive.eligibleDepartments || [],
    rounds_count: (drive.roundDeadlines || []).length,
    description: drive.description,
    openings: drive.openings,
    location: drive.location,
    isFeatured: drive.isFeatured,
    applicationDeadline: drive.applicationDeadline,
    candidateCount: cands.length,
    companyName: companyForDrive(drive)
  };
}

function isPubliclyVisible(drive) {
  return getLifecycleStatus(drive) === "PUBLISHED";
}

function listDrives() {
  return repository.listDrives().filter(isPubliclyVisible).map(toDriveSummary);
}

function listRecruiterDriveListItems() {
  return repository
    .listDrives()
    .filter((d) => d.recruiterId === recruiterStore.recruiter.id)
    .map(toRecruiterDriveListItem);
}

/**
 * @param {object|null|undefined} user
 */
function getDriveForViewer(id, user) {
  const drive = repository.getDriveById(id);
  if (!drive) {
    return null;
  }
  if (getLifecycleStatus(drive) === "DRAFT") {
    if (!isRecruiterUser(user) || !ownsRecruiterDrive(drive)) {
      return null;
    }
  }
  return toDriveDetail(drive);
}

function getDrive(id) {
  const drive = repository.getDriveById(id);
  return drive ? toDriveDetail(drive) : null;
}

function createDrive(payload, user) {
  const driveRecord = repository.createDrive({
    ...payload,
    createdByRole: user?.role || user?.roles?.[0] || null,
    createdByUserId: user?.userId || user?.id || null
  });
  return { drive: driveRecord, summary: toDriveSummary(driveRecord) };
}

function updateDriveContent(id, payload) {
  const body = { ...payload };
  delete body.status;
  delete body.id;
  const drive = repository.updateDrive(id, body);
  return drive ? toRecruiterDriveListItem(drive) : null;
}

/**
 * @returns {{ ok: true, drive: object }|{ error: string }}
 */
function updateDriveStatus(id, nextRaw, _user) {
  const next = String(nextRaw || "").toUpperCase();
  if (!["DRAFT", "PUBLISHED", "CLOSED"].includes(next)) {
    return { error: "INVALID_STATUS" };
  }
  const drive = repository.getDriveById(id);
  if (!drive) {
    return { error: "NOT_FOUND" };
  }
  if (!ownsRecruiterDrive(drive)) {
    return { error: "FORBIDDEN" };
  }
  const current = getLifecycleStatus(drive);
  if (current === next) {
    return { ok: true, drive: toRecruiterDriveListItem(drive) };
  }
  let valid = false;
  if (current === "DRAFT" && next === "PUBLISHED") {
    valid = true;
  }
  if (current === "PUBLISHED" && next === "CLOSED") {
    valid = true;
  }
  if (current === "CLOSED" && next === "PUBLISHED") {
    valid = true;
  }
  if (current === "PUBLISHED" && next === "DRAFT") {
    valid = true;
  }
  if (current === "DRAFT" && next === "CLOSED") {
    valid = true;
  }
  if (!valid) {
    return { error: "INVALID_TRANSITION" };
  }
  repository.updateDrive(id, { status: next });
  const updated = repository.getDriveById(id);
  return { ok: true, drive: toRecruiterDriveListItem(updated) };
}

/**
 * @returns {true| "not_found" | "not_draft"}
 */
function deleteDriveIfDraft(id) {
  const drive = repository.getDriveById(id);
  if (!drive) {
    return "not_found";
  }
  if (getLifecycleStatus(drive) !== "DRAFT") {
    return "not_draft";
  }
  if (!repository.deleteDrive(id)) {
    return "not_found";
  }
  return true;
}

function listFeaturedDrives() {
  return repository
    .listDrives()
    .filter((d) => isPubliclyVisible(d) && d.isFeatured)
    .map(toDriveSummary);
}

function listRecruiterDriveOptions() {
  return repository.listDrives().map((drive) => ({
    id: drive.id,
    title: drive.title,
    openings: drive.openings,
    applicationDeadline: drive.applicationDeadline,
    status: getLifecycleStatus(drive)
  }));
}

function getDashboardDrive(driveId) {
  return repository.getDriveById(driveId) || repository.listDrives()[0] || null;
}

module.exports = {
  listDrives,
  getDrive,
  getDriveForViewer,
  createDrive,
  updateDrive: updateDriveContent,
  updateDriveStatus,
  deleteDrive: deleteDriveIfDraft,
  listFeaturedDrives,
  listRecruiterDriveListItems,
  listRecruiterDriveOptions,
  getDashboardDrive,
  getLifecycleStatus
};
