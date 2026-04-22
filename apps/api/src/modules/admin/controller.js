const service = require("./service");

function getDashboard(_req, res) {
  res.json(service.getDashboard());
}

function listUsers(_req, res) {
  res.json(service.listUsers());
}

function getUser(req, res) {
  const user = service.getUser(req.params.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json(user);
}

function listRoles(_req, res) {
  res.json(service.listRoles());
}

function listLogs(_req, res) {
  res.json(service.listLogs());
}

function listDrives(_req, res) {
  res.json(service.listDrives());
}

function listReports(_req, res) {
  res.json(service.listReports());
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
