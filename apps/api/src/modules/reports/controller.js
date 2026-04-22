const service = require("./service");

function getPlacementSummary(_req, res) {
  res.json(service.getPlacementSummary());
}

function listExports(_req, res) {
  res.json({
    items: service.listExports()
  });
}

module.exports = {
  getPlacementSummary,
  listExports
};
