const { recruiterStore } = require("../recruiters/mockData");

function listExports() {
  return recruiterStore.exports;
}

function getPlacementTotals() {
  const drives = recruiterStore.drives.length;
  const applications = recruiterStore.drives.reduce((sum, drive) => sum + drive.candidates.length, 0);
  const offers = recruiterStore.drives.reduce(
    (sum, drive) => sum + drive.candidates.filter((candidate) => candidate.status === "OFFERED").length,
    0
  );
  const placements = recruiterStore.drives.reduce(
    (sum, drive) => sum + drive.candidates.filter((candidate) => candidate.status === "SELECTED").length,
    0
  );

  return {
    drives,
    applications,
    offers,
    placements
  };
}

module.exports = {
  listExports,
  getPlacementTotals
};
