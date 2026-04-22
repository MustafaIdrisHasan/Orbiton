const service = require("./service");

function listDrives(_req, res) {
  res.json({
    resource: "drives",
    items: service.listDrives()
  });
}

function getDrive(req, res) {
  const drive = service.getDrive(req.params.id);
  if (!drive) {
    res.status(404).json({ message: "Drive not found" });
    return;
  }

  res.json(drive);
}

function createDrive(req, res) {
  res.status(201).json(service.createDrive(req.body));
}

function updateDrive(req, res) {
  const drive = service.updateDrive(req.params.id, req.body);
  if (!drive) {
    res.status(404).json({ message: "Drive not found" });
    return;
  }

  res.json(drive);
}

function deleteDrive(req, res) {
  const deleted = service.deleteDrive(req.params.id);
  if (!deleted) {
    res.status(404).json({ message: "Drive not found" });
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
  deleteDrive,
  listFeaturedDrives
};
