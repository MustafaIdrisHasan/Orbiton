const express = require("express");
const controller = require("./controller");

const router = express.Router();

router.get("/", controller.listNotifications);
router.post("/broadcast", controller.broadcast);
router.post("/:id/read", controller.markAsRead);

module.exports = router;

