const service = require("./service");

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

module.exports = {
  listOffers,
  getOffer,
  createOffer,
  updateOffer,
  deleteOffer
};
