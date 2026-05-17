const { ROLES, normalizeRoles } = require("../../core/constants/roles");
const service = require("./service");
const notificationsService = require("../notifications/service");
const companiesService = require("../companies/service");

function rolesFromRequestUser(user) {
  const raw = [];
  if (Array.isArray(user?.roles)) {
    raw.push(...user.roles);
  }
  if (user?.role) {
    raw.push(user.role);
  }
  return normalizeRoles(raw);
}

function listDrives(req, res) {
  const createdBy = req.query.created_by;
  if (createdBy === "me") {
    const roles = rolesFromRequestUser(req.user);
    if (!roles.includes(ROLES.RECRUITER) && !roles.includes(ROLES.TPO)) {
      res.status(403).json({ message: "Only recruiters and placement officers can list owned drives" });
      return;
    }
    res.json({
      resource: "drives",
      items: service.listRecruiterDriveListItems()
    });
    return;
  }

  res.json({
    resource: "drives",
    items: service.listDrives()
  });
}

function getDrive(req, res) {
  const drive = service.getDriveForViewer(req.params.id, req.user);
  if (!drive) {
    res.status(404).json({ message: "Drive not found" });
    return;
  }

  res.json(drive);
}

async function createDrive(req, res, next) {
  try {
    const result = service.createDrive(req.body, req.user);
    const drive = result.drive;

    // Notify any COMPANY-role user whose set companyName matches this drive
    // (only meaningful when the drive was created with a companyName, e.g.
    // by a TPO).
    if (drive?.companyName) {
      const matches = companiesService.findCompanyUserIdsByCompanyName(drive.companyName);
      for (const { userId } of matches) {
        try {
          await notificationsService.notifyUser(userId, {
            type: "DRIVE",
            title: `New drive for ${drive.companyName}`,
            message: `${drive.createdByRole === "TPO" ? "Placement office" : "Recruiter"} opened "${drive.title}" associated with your company.`,
            entityId: drive.id,
            driveId: drive.id,
            source: "INSTITUTION"
          });
        } catch {
          /* non-fatal */
        }
      }
    }

    res.status(201).json(result.summary);
  } catch (err) {
    next(err);
  }
}

function updateDrive(req, res) {
  const drive = service.updateDrive(req.params.id, req.body);
  if (!drive) {
    res.status(404).json({ message: "Drive not found" });
    return;
  }

  res.json(drive);
}

function updateDriveStatus(req, res) {
  const result = service.updateDriveStatus(req.params.id, req.body?.status, req.user);
  if (result.error === "NOT_FOUND") {
    res.status(404).json({ message: "Drive not found" });
    return;
  }
  if (result.error === "FORBIDDEN") {
    res.status(403).json({ message: "You cannot change this drive" });
    return;
  }
  if (result.error === "INVALID_STATUS" || result.error === "INVALID_TRANSITION") {
    res.status(400).json({ message: "Invalid status transition" });
    return;
  }
  res.json(result.drive);
}

function deleteDrive(req, res) {
  const deleted = service.deleteDrive(req.params.id);
  if (deleted === "not_found") {
    res.status(404).json({ message: "Drive not found" });
    return;
  }
  if (deleted === "not_draft") {
    res.status(403).json({ message: "Only draft drives can be deleted" });
    return;
  }
  res.status(204).send();
}

function listFeaturedDrives(_req, res) {
  res.json({
    items: service.listFeaturedDrives()
  });
}

module.exports = {
  listDrives,
  getDrive,
  createDrive,
  updateDrive,
  updateDriveStatus,
  deleteDrive,
  listFeaturedDrives
};
