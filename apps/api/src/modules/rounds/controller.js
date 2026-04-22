const service = require("./service");

function listRounds(req, res) {
  const items = service.listInterviews(req.query.driveId);
  res.json({
    resource: "rounds",
    items
  });
}

function getRound(req, res) {
  const round = service.listRounds().find((item) => item.id === req.params.id);
  if (!round) {
    res.status(404).json({ message: "Round not found" });
    return;
  }

  res.json(round);
}

function createRound(req, res) {
  res.status(201).json(service.createInterview(req.body));
}

function updateRound(req, res) {
  res.json({
    id: req.params.id,
    payload: req.body,
    message: "Round update endpoint ready for implementation"
  });
}

function deleteRound(_req, res) {
  res.status(204).send();
}

module.exports = {
  listRounds,
  getRound,
  createRound,
  updateRound,
  deleteRound
};
