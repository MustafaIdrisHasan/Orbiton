const service = require("./service");

function getDashboard(_req, res) {
  res.json(service.getDashboard());
}

function listStudents(_req, res) {
  res.json(service.listStudents());
}

function getStudent(req, res) {
  const student = service.getStudent(req.params.id);
  if (!student) {
    res.status(404).json({ message: "Student not found" });
    return;
  }

  res.json(student);
}

function listDrives(_req, res) {
  res.json(service.listDrives());
}

function getDrive(req, res) {
  const drive = service.getDrive(req.params.id);
  if (!drive) {
    res.status(404).json({ message: "Drive not found" });
    return;
  }

  res.json(drive);
}

function listReports(_req, res) {
  res.json(service.listReports());
}

function listAnnouncements(_req, res) {
  res.json(service.listAnnouncements());
}

function createAnnouncement(req, res) {
  res.status(201).json({
    item: service.createAnnouncement(req.body)
  });
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
