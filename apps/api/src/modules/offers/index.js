const express = require("express");
const controller = require("./controller");

const router = express.Router();

router.get("/", controller.listOffers);
router.get("/:id", controller.getOffer);
router.post("/", controller.createOffer);
router.patch("/:id", controller.updateOffer);
router.delete("/:id", controller.deleteOffer);

module.exports = router;

