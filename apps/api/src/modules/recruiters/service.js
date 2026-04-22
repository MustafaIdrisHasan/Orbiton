const drivesService = require("../drives/service");
const applicationsService = require("../applications/service");
const roundsService = require("../rounds/service");
const offersService = require("../offers/service");
const reportsService = require("../reports/service");
const notificationsService = require("../notifications/service");
const { recruiterStore } = require("./mockData");

function buildFunnel(candidates) {
  return ["APPLIED", "SHORTLISTED", "INTERVIEW", "SELECTED", "OFFERED"].map((status) => ({
    status,
    count: candidates.filter((candidate) => candidate.status === status).length
  }));
}

function buildDepartmentCounts(candidates) {
  return Object.entries(
    candidates.reduce((acc, candidate) => {
      acc[candidate.branch] = (acc[candidate.branch] || 0) + 1;
      return acc;
    }, {})
  ).map(([department, count]) => ({ department, count }));
}

function buildGenderCounts(candidates) {
  return candidates.reduce(
    (acc, candidate) => {
      if (candidate.gender === "Female") {
        acc.female += 1;
      } else if (candidate.gender === "Male") {
        acc.male += 1;
      } else {
        acc.other += 1;
      }
      return acc;
    },
    { male: 0, female: 0, other: 0 }
  );
}

function getDashboard(driveId) {
  const drive = drivesService.getDashboardDrive(driveId);
  if (!drive) {
    return null;
  }

  const candidateSet = applicationsService.listCandidatesForDrive(drive.id).items;
  const offerSummary = offersService.getOfferSummary(drive.id);

  return {
    recruiter: recruiterStore.recruiter,
    activeDrive: {
      id: drive.id,
      title: drive.title,
      openings: drive.openings,
      location: drive.location,
      applicationDeadline: drive.applicationDeadline,
      status: drive.status,
      roundDeadlines: drive.roundDeadlines
    },
    funnel: buildFunnel(candidateSet),
    quickStats: {
      totalApplications: candidateSet.length,
      shortlistedCandidates: candidateSet.filter((candidate) => candidate.status === "SHORTLISTED").length,
      selectedCandidates: offerSummary.totalSelected,
      offeredCandidates: offerSummary.totalIssued
    },
    demographics: {
      genderRatio: buildGenderCounts(candidateSet),
      departmentCounts: buildDepartmentCounts(candidateSet)
    }
  };
}

function listRecruiterDrives() {
  return drivesService.listRecruiterDriveOptions();
}

function listCandidates(driveId, query) {
  return applicationsService.listCandidatesForDrive(driveId, query);
}

function getCandidate(applicationId) {
  return applicationsService.getCandidateProfile(applicationId);
}

function shortlist(applicationId) {
  return applicationsService.updateApplicationStatus(applicationId, "SHORTLISTED");
}

function reject(applicationId) {
  return applicationsService.updateApplicationStatus(applicationId, "REJECTED");
}

function scheduleFinalInterview(applicationId) {
  return applicationsService.updateApplicationStatus(applicationId, "INTERVIEW");
}

function listInterviews(driveId) {
  return {
    items: roundsService.listInterviews(driveId)
  };
}

function createInterview(payload) {
  return roundsService.createInterview(payload);
}

function broadcast(payload) {
  return notificationsService.createBroadcast(payload);
}

function listBroadcasts(driveId) {
  const notifications = notificationsService.listNotifications().items;
  const items = notifications.filter((item) => !driveId || item.driveId === driveId);
  return { items };
}

function listExports() {
  return {
    items: reportsService.listExports()
  };
}

module.exports = {
  getDashboard,
  listRecruiterDrives,
  listCandidates,
  getCandidate,
  shortlist,
  reject,
  scheduleFinalInterview,
  listInterviews,
  createInterview,
  broadcast,
  listBroadcasts,
  listExports
};
