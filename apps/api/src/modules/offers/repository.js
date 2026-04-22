const { recruiterStore } = require("../recruiters/mockData");

function listOfferCandidates() {
  return recruiterStore.drives.flatMap((drive) =>
    drive.candidates
      .filter((candidate) => candidate.status === "SELECTED" || candidate.status === "OFFERED")
      .map((candidate) => ({
        ...candidate,
        driveId: drive.id,
        driveTitle: drive.title
      }))
  );
}

module.exports = {
  listOfferCandidates
};
