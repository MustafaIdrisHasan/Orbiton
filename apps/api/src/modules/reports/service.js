const repository = require("./repository");

function listExports() {
  return repository.listExports();
}

function getPlacementSummary() {
  return {
    generatedAt: new Date().toISOString(),
    totals: repository.getPlacementTotals()
  };
}

module.exports = {
  listExports,
  getPlacementSummary
};
