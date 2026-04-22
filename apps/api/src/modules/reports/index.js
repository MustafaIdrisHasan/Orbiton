const express = require("express");
const controller = require("./controller");

const router = express.Router();

router.get("/placement-summary", controller.getPlacementSummary);
router.get("/exports", controller.listExports);

module.exports = router;

