const service = require("./service");

function listApplications(_req, res) {
  res.json({
    resource: "applications",
    items: service.listApplications()
  });
}

function getApplication(req, res) {
  const candidate = service.getCandidateProfile(req.params.id);
  if (!candidate) {
    res.status(404).json({ message: "Application not found" });
    return;
  }

  res.json(candidate);
}

function createApplication(req, res) {
  res.status(201).json({
    resource: "applications",
    payload: req.body,
    message: "Application create endpoint ready for repository-backed implementation"
  });
}

function updateApplication(req, res) {
  const updated = service.updateApplicationStatus(req.params.id, req.body.status || "APPLIED");
  if (!updated) {
    res.status(404).json({ message: "Application not found" });
    return;
  }

  res.json(updated);
}

function deleteApplication(_req, res) {
  res.status(204).send();
}

function applyToDrive(req, res) {
  res.status(201).json({
    driveId: req.params.driveId,
    studentId: req.user?.id,
    message: "Apply to drive endpoint ready for implementation"
  });
}

function shortlistApplication(req, res) {
  const updated = service.updateApplicationStatus(req.params.applicationId, "SHORTLISTED");
  if (!updated) {
    res.status(404).json({ message: "Application not found" });
    return;
  }

  res.json({ message: "Candidate shortlisted", ...updated });
}

function rejectApplication(req, res) {
  const updated = service.updateApplicationStatus(req.params.applicationId, "REJECTED");
  if (!updated) {
    res.status(404).json({ message: "Application not found" });
    return;
  }

  res.json({ message: "Candidate rejected", ...updated });
}

function scheduleFinalInterview(req, res) {
  const updated = service.updateApplicationStatus(req.params.applicationId, "INTERVIEW");
  if (!updated) {
    res.status(404).json({ message: "Application not found" });
    return;
  }

  res.json({ message: "Final interview scheduled", ...updated });
}

module.exports = {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  applyToDrive,
  shortlistApplication,
  rejectApplication,
  scheduleFinalInterview
};
