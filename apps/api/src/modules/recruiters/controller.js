const service = require("./service");
const { recruiterStore } = require("./mockData");

function listRecruiters(_req, res) {
  res.json({
    resource: "recruiters",
    items: [recruiterStore.recruiter]
  });
}

function getRecruiter(req, res) {
  if (req.params.id !== recruiterStore.recruiter.id) {
    res.status(404).json({ message: "Recruiter not found" });
    return;
  }

  res.json(recruiterStore.recruiter);
}

function createRecruiter(req, res) {
  res.status(201).json({
    resource: "recruiters",
    payload: req.body,
    message: "Recruiter create endpoint ready for implementation"
  });
}

function updateRecruiter(req, res) {
  res.json({
    id: req.params.id,
    payload: req.body,
    message: "Recruiter update endpoint ready for implementation"
  });
}

function deleteRecruiter(_req, res) {
  res.status(204).send();
}

function getDashboard(req, res) {
  const dashboard = service.getDashboard(req.query.driveId);
  if (!dashboard) {
    res.status(404).json({ message: "No recruiter dashboard data available" });
    return;
  }

  res.json(dashboard);
}

function listDrives(_req, res) {
  res.json({
    items: service.listRecruiterDrives()
  });
}

function listCandidates(req, res) {
  res.json(service.listCandidates(req.params.driveId, req.query));
}

function getCandidate(req, res) {
  const candidate = service.getCandidate(req.params.candidateId);
  if (!candidate) {
    res.status(404).json({ message: "Candidate not found" });
    return;
  }

  res.json(candidate);
}

function shortlist(req, res) {
  const updated = service.shortlist(req.params.applicationId);
  if (!updated) {
    res.status(404).json({ message: "Application not found" });
    return;
  }

  res.json({ message: "Candidate shortlisted", ...updated });
}

function reject(req, res) {
  const updated = service.reject(req.params.applicationId);
  if (!updated) {
    res.status(404).json({ message: "Application not found" });
    return;
  }

  res.json({ message: "Candidate rejected", ...updated });
}

function scheduleFinalInterview(req, res) {
  const updated = service.scheduleFinalInterview(req.params.applicationId);
  if (!updated) {
    res.status(404).json({ message: "Application not found" });
    return;
  }

  res.json({ message: "Final interview scheduled", ...updated });
}

function listInterviews(req, res) {
  res.json(service.listInterviews(req.query.driveId));
}

function createInterview(req, res) {
  res.status(201).json(service.createInterview(req.body));
}

function broadcast(req, res) {
  res.status(201).json({
    message: "Broadcast queued",
    item: service.broadcast(req.body)
  });
}

function listBroadcasts(req, res) {
  res.json(service.listBroadcasts(req.query.driveId));
}

function listExports(_req, res) {
  res.json(service.listExports());
}

module.exports = {
  listRecruiters,
  getRecruiter,
  createRecruiter,
  updateRecruiter,
  deleteRecruiter,
  getDashboard,
  listDrives,
  listCandidates,
  getCandidate,
  shortlist,
  reject,
  scheduleFinalInterview,
  listInterviews,
  createInterview,
  broadcast,
  listBroadcasts,
  listExports
};
