const { recruiterStore } = require("../recruiters/mockData");

function listAllApplications() {
  return recruiterStore.drives.flatMap((drive) =>
    drive.candidates.map((candidate) => ({
      ...candidate,
      driveId: drive.id,
      driveTitle: drive.title
    }))
  );
}

function listCandidatesByDriveId(driveId) {
  const drive = recruiterStore.drives.find((item) => item.id === driveId);
  return drive
    ? drive.candidates.map((candidate) => ({
        ...candidate,
        driveId: drive.id,
        driveTitle: drive.title
      }))
    : [];
}

function getCandidateByApplicationId(applicationId) {
  return listAllApplications().find((candidate) => candidate.id === applicationId) || null;
}

function updateApplicationStatus(applicationId, nextStatus) {
  for (const drive of recruiterStore.drives) {
    const candidate = drive.candidates.find((item) => item.id === applicationId);
    if (!candidate) {
      continue;
    }

    candidate.status = nextStatus;
    if (nextStatus === "INTERVIEW") {
      candidate.currentRound = "Final Interview";
    }

    return {
      ...candidate,
      driveId: drive.id,
      driveTitle: drive.title
    };
  }

  return null;
}

function driveIsOpenForApplications(drive) {
  const s = String(drive?.status || "").toUpperCase();
  return s === "PUBLISHED" || s === "ACTIVE" || s === "OPEN";
}

function applyToDrive(driveId, applicant) {
  const drive = recruiterStore.drives.find((item) => item.id === driveId);
  if (!drive) {
    return { error: "NOT_FOUND" };
  }
  if (!driveIsOpenForApplications(drive)) {
    return { error: "NOT_OPEN" };
  }

  const email = String(applicant.email || "").trim().toLowerCase();
  const dup = drive.candidates.some((c) => String(c.email || "").trim().toLowerCase() === email);
  if (dup) {
    return { error: "DUPLICATE" };
  }

  const applicationId = applicant.applicationId || `app-${Date.now()}`;
  const serialNo = drive.candidates.length + 1;
  const candidate = {
    id: applicationId,
    serialNo,
    name: applicant.name || "Applicant",
    branch: applicant.branch || "",
    rollNumber: applicant.rollNumber || "",
    cgpa: applicant.cgpa != null ? Number(applicant.cgpa) : null,
    backlogs: applicant.backlogs != null ? Number(applicant.backlogs) : 0,
    skills: Array.isArray(applicant.skills) ? applicant.skills : [],
    gender: applicant.gender || "",
    year: applicant.year || "",
    status: "APPLIED",
    currentRound: "Application Review",
    email: applicant.email || "",
    resumePreview: applicant.resumePreview || "",
    projects: Array.isArray(applicant.projects) ? applicant.projects : [],
    testScores: Array.isArray(applicant.testScores) ? applicant.testScores : [],
    notes: applicant.notes || ""
  };

  drive.candidates.push(candidate);

  return {
    application: {
      ...candidate,
      driveId: drive.id,
      driveTitle: drive.title
    }
  };
}

module.exports = {
  listAllApplications,
  listCandidatesByDriveId,
  getCandidateByApplicationId,
  updateApplicationStatus,
  applyToDrive
};
