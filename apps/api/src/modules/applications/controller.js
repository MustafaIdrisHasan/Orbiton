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

async function applyToDrive(req, res, next) {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const out = await service.applyToDrive(req.params.driveId, userId);
    if (out.error === "NOT_FOUND") {
      res.status(404).json({ message: "Drive not found" });
      return;
    }
    if (out.error === "NOT_OPEN") {
      res.status(400).json({ message: "This drive is not accepting applications" });
      return;
    }
    if (out.error === "DUPLICATE") {
      res.status(409).json({ message: "You have already applied to this drive" });
      return;
    }
    res.status(201).json({
      resource: "applications",
      ...out
    });
  } catch (err) {
    next(err);
  }
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
