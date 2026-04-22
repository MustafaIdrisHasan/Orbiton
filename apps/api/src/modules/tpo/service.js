const { tpoDashboardData, tpoStudents } = require("./mockData");

function getDashboard() {
  return tpoDashboardData;
}

function listStudents() {
  return {
    items: tpoStudents
  };
}

function getStudent(studentId) {
  return tpoStudents.find((student) => student.id === studentId) || null;
}

function listDrives() {
  return {
    items: tpoDashboardData.activeDrives
  };
}

function getDrive(driveId) {
  return tpoDashboardData.activeDrives.find((drive) => drive.id === driveId) || null;
}

function listReports() {
  return {
    items: tpoDashboardData.reports
  };
}

function listAnnouncements() {
  return {
    items: tpoDashboardData.announcements.recent
  };
}

function createAnnouncement(payload = {}) {
  const item = {
    id: `ann-${Date.now()}`,
    audience: payload.audience,
    time: new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }),
    message: payload.message
  };

  tpoDashboardData.announcements.recent.unshift(item);
  return item;
}

module.exports = {
  getDashboard,
  listStudents,
  getStudent,
  listDrives,
  getDrive,
  listReports,
  listAnnouncements,
  createAnnouncement
};
