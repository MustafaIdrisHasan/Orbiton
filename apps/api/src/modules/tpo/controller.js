const service = require("./service");

function getDashboard(_req, res) {
  res.json(service.getDashboard());
}

async function listStudents(_req, res, next) {
  try {
    res.json(await service.listStudents());
  } catch (err) {
    next(err);
  }
}

async function getStudent(req, res, next) {
  try {
    const student = await service.getStudent(req.params.id);
    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }
    res.json(student);
  } catch (err) {
    next(err);
  }
}

async function getStudentResumes(req, res, next) {
  try {
    res.json(await service.getStudentResumes(req.params.id));
  } catch (err) {
    next(err);
  }
}

async function getApplicationProfile(req, res, next) {
  try {
    const profile = await service.getApplicationProfile(req.params.applicationId);
    if (!profile) {
      res.status(404).json({ message: "Application not found" });
      return;
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
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

async function listAnnouncements(_req, res, next) {
  try {
    res.json(await service.listAnnouncements());
  } catch (err) {
    next(err);
  }
}

async function createAnnouncement(req, res, next) {
  try {
    const item = await service.createAnnouncement(req.body || {});
    if (item && item.error === "EMPTY_MESSAGE") {
      res.status(400).json({ message: "Announcement message is required" });
      return;
    }
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

async function contactApplicant(req, res, next) {
  try {
    const result = await service.contactApplicant(req.params.applicationId, req.body || {});
    if (result.error === "EMPTY_MESSAGE") {
      res.status(400).json({ message: "Message is required" });
      return;
    }
    if (result.error === "NOT_FOUND") {
      res.status(404).json({ message: "Application not found" });
      return;
    }
    if (result.error === "NO_STUDENT_EMAIL" || result.error === "NO_STUDENT_USER") {
      res.status(404).json({ message: "Student account could not be resolved for this application" });
      return;
    }
    res.status(201).json({
      ok: true,
      notificationId: result.notification?.id || null,
      message: "Message sent to student"
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  listStudents,
  getStudent,
  getStudentResumes,
  getApplicationProfile,
  listDrives,
  getDrive,
  listReports,
  listAnnouncements,
  createAnnouncement,
  contactApplicant,
};
