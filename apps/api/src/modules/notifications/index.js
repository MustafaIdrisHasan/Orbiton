const express = require("express");
const controller = require("./controller");

const router = express.Router();

router.get("/", controller.listNotifications);
router.post("/broadcast", controller.broadcast);
router.post("/read-all", controller.markAllAsRead);
router.patch("/:id/read", controller.markAsRead);
router.post("/:id/read", controller.markAsRead);

module.exports = router;

