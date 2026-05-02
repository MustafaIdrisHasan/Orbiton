const service = require("./service");

async function getDashboard(_req, res, next) {
  try { res.json(await service.getDashboard()); } catch (err) { next(err); }
}

async function listUsers(_req, res, next) {
  try { res.json(await service.listUsers()); } catch (err) { next(err); }
}

async function getUser(req, res, next) {
  try {
    const user = await service.getUser(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}

function listRoles(_req, res) {
  res.json(service.listRoles());
}

function listLogs(_req, res) {
  res.json(service.listLogs());
}

async function listDrives(req, res, next) {
  try {
    const filters = {
      createdByRole: req.query.created_by_role || null,
      createdByUserId: req.query.created_by_user_id || null,
    };
    res.json(await service.listDrives(filters));
  } catch (err) {
    next(err);
  }
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
  listReports,
};
