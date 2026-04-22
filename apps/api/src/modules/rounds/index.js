const express = require("express");
const controller = require("./controller");

const router = express.Router();

router.get("/", controller.listRounds);
router.get("/:id", controller.getRound);
router.post("/", controller.createRound);
router.patch("/:id", controller.updateRound);
router.delete("/:id", controller.deleteRound);

module.exports = router;

