const repository = require("./repository");

function toCandidateRow(candidate) {
  return {
    applicationId: candidate.id,
    serialNo: candidate.serialNo,
    name: candidate.name,
    branch: candidate.branch,
    rollNumber: candidate.rollNumber,
    cgpa: candidate.cgpa,
    backlogs: candidate.backlogs,
    skills: candidate.skills,
    status: candidate.status,
    currentRound: candidate.currentRound
  };
}

function toCandidateProfile(candidate) {
  return {
    applicationId: candidate.id,
    driveId: candidate.driveId,
    driveTitle: candidate.driveTitle,
    personalDetails: {
      name: candidate.name,
      rollNumber: candidate.rollNumber,
      branch: candidate.branch,
      year: candidate.year,
      gender: candidate.gender,
      email: candidate.email
    },
    academics: {
      cgpa: candidate.cgpa,
      backlogs: candidate.backlogs
    },
    skills: candidate.skills,
    projects: candidate.projects,
    resumePreview: candidate.resumePreview,
    testScores: candidate.testScores,
    notes: candidate.notes,
    status: candidate.status,
    currentRound: candidate.currentRound
  };
}

function listApplications() {
  return repository.listAllApplications().map(toCandidateRow);
}

function listCandidatesForDrive(driveId, query = {}) {
  const candidates = repository.listCandidatesByDriveId(driveId)
    .filter((candidate) => !query.branch || candidate.branch === query.branch)
    .filter((candidate) => !query.status || candidate.status === query.status)
    .filter((candidate) => !query.cgpaMin || candidate.cgpa >= Number(query.cgpaMin))
    .filter((candidate) => {
      if (!query.search) {
        return true;
      }

      const search = String(query.search).toLowerCase();
      return (
        candidate.name.toLowerCase().includes(search) ||
        candidate.rollNumber.toLowerCase().includes(search) ||
        String(candidate.serialNo).includes(search)
      );
    })
    .map(toCandidateRow);

  return {
    items: candidates,
    total: candidates.length
  };
}

function getCandidateProfile(applicationId) {
  const candidate = repository.getCandidateByApplicationId(applicationId);
  return candidate ? toCandidateProfile(candidate) : null;
}

function updateApplicationStatus(applicationId, nextStatus) {
  const candidate = repository.updateApplicationStatus(applicationId, nextStatus);
  return candidate
    ? {
        applicationId: candidate.id,
        driveId: candidate.driveId,
        status: candidate.status,
        currentRound: candidate.currentRound
      }
    : null;
}

module.exports = {
  listApplications,
  listCandidatesForDrive,
  getCandidateProfile,
  updateApplicationStatus
};
