const { adminDashboardData } = require("./mockData");

function getDashboard() {
  return adminDashboardData;
}

function listUsers() {
  return {
    items: adminDashboardData.users
  };
}

function getUser(userId) {
  return adminDashboardData.users.find((user) => user.id === userId) || null;
}

function listRoles() {
  return {
    items: adminDashboardData.roles
  };
}

function listLogs() {
  return {
    items: adminDashboardData.logs
  };
}

function listDrives() {
  return {
    items: adminDashboardData.drives
  };
}

function listReports() {
  return {
    items: adminDashboardData.reports
  };
}

module.exports = {
  getDashboard,
  listUsers,
  getUser,
  listRoles,
  listLogs,
  listDrives,
  listReports
};
