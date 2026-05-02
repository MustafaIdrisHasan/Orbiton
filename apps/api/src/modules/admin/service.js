const { adminDashboardData } = require("./mockData");
const pgRepo = require("./repository.postgres");

async function getDashboard() {
  const overview = await pgRepo.getOverview().catch(() => null);
  return {
    ...adminDashboardData,
    overview: overview || adminDashboardData.overview,
  };
}

async function listUsers() {
  const items = await pgRepo.listUsers().catch(() => null);
  if (Array.isArray(items) && items.length > 0) {
    return { items };
  }
  return { items: adminDashboardData.users };
}

async function getUser(userId) {
  const items = await pgRepo.listUsers().catch(() => null);
  if (Array.isArray(items)) {
    const found = items.find((u) => u.id === userId || u.email === userId);
    if (found) return found;
  }
  return adminDashboardData.users.find((u) => u.id === userId) || null;
}

function listRoles() {
  return { items: adminDashboardData.roles };
}

function listLogs() {
  return { items: adminDashboardData.logs };
}

async function listDrives(filters = {}) {
  const items = await pgRepo.listDrives(filters).catch(() => null);
  if (Array.isArray(items)) {
    // Even if PG returned 0 rows we still surface "real, empty" rather than mock.
    return { items, source: "postgres" };
  }
  return { items: adminDashboardData.drives, source: "mock" };
}

function listReports() {
  return { items: adminDashboardData.reports };
}

module.exports = {
  getDashboard,
  listUsers,
  getUser,
  listRoles,
  listLogs,
  listDrives,
  listReports,
};
