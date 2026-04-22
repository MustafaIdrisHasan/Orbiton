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

module.exports = {
  listAllApplications,
  listCandidatesByDriveId,
  getCandidateByApplicationId,
  updateApplicationStatus
};
