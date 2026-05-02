const repository = require("./repository");

function listOffers() {
  return repository.listOfferCandidates().map((candidate) => ({
    offerId: `offer-${candidate.id}`,
    applicationId: candidate.id,
    driveId: candidate.driveId,
    driveTitle: candidate.driveTitle,
    candidateName: candidate.name,
    email: candidate.email,
    status: candidate.status,
    packageLpa: candidate.offerPackageLpa ?? null,
    joiningDate: candidate.offerJoiningDate ?? null
  }));
}

function getOfferSummary(driveId) {
  const offers = listOffers().filter((offer) => !driveId || offer.driveId === driveId);
  return {
    totalIssued: offers.filter((offer) => offer.status === "OFFERED").length,
    totalSelected: offers.filter((offer) => offer.status === "SELECTED").length
  };
}

module.exports = {
  listOffers,
  getOfferSummary
};
