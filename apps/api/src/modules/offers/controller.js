const service = require("./service");
const { recruiterStore } = require("../recruiters/mockData");
const notificationsService = require("../notifications/service");
const audience = require("../notifications/audience");

function listOffers(_req, res) {
  res.json({
    resource: "offers",
    items: service.listOffers()
  });
}

function getOffer(req, res) {
  const offer = service.listOffers().find((item) => item.offerId === req.params.id);
  if (!offer) {
    res.status(404).json({ message: "Offer not found" });
    return;
  }

  res.json(offer);
}

function createOffer(req, res) {
  res.status(201).json({
    payload: req.body,
    message: "Offer create endpoint ready for implementation"
  });
}

function updateOffer(req, res) {
  res.json({
    id: req.params.id,
    payload: req.body,
    message: "Offer update endpoint ready for implementation"
  });
}

function deleteOffer(_req, res) {
  res.status(204).send();
}

/** GET /api/v1/offers/me — all company-issued offers for the current student. */
async function listStudentOffers(req, res, next) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const email = req.user?.email || "";
    const items = recruiterStore.companyOffers.filter(
      (o) => (userId && o.studentUserId === userId) || (email && o.studentEmail === email)
    );
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/offers/:id/respond  Body: { response: "ACCEPTED" | "DECLINED" } */
async function respondToOffer(req, res, next) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const email = req.user?.email || "";
    const { response } = req.body || {};
    if (!response || !["ACCEPTED", "DECLINED"].includes(String(response).toUpperCase())) {
      res.status(400).json({ message: "response must be ACCEPTED or DECLINED" });
      return;
    }
    const offer = recruiterStore.companyOffers.find((o) => o.id === req.params.id);
    if (!offer) {
      res.status(404).json({ message: "Offer not found" });
      return;
    }
    const isOwner = (userId && offer.studentUserId === userId) || (email && offer.studentEmail === email);
    if (!isOwner) {
      res.status(403).json({ message: "This offer is not addressed to you" });
      return;
    }
    if (offer.status !== "PENDING") {
      res.status(409).json({ message: `Offer already ${offer.status.toLowerCase()}` });
      return;
    }
    offer.status = String(response).toUpperCase();
    offer.respondedAt = new Date().toISOString();

    // Notify TPO
    const tpoUserIds = await audience.resolveUserIdsForRoles(["TPO"]);
    for (const tpoId of tpoUserIds) {
      await notificationsService.notifyUser(tpoId, {
        type: "OFFER",
        title: `Offer ${offer.status === "ACCEPTED" ? "accepted" : "declined"} by student`,
        message: `${offer.studentEmail} has ${offer.status === "ACCEPTED" ? "accepted" : "declined"} the offer from ${offer.companyName} for "${offer.role}".`,
        entityId: offer.id,
        driveId: offer.driveId,
        source: "STUDENT"
      });
    }

    res.json({ ok: true, offer });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listOffers,
  getOffer,
  createOffer,
  updateOffer,
  deleteOffer,
  listStudentOffers,
  respondToOffer
};
