const express = require("express");
const controller = require("./controller");

const router = express.Router();

router.get("/dashboard", controller.getDashboard);
router.get("/users", controller.listUsers);
router.get("/users/:id", controller.getUser);
router.get("/roles", controller.listRoles);
router.get("/logs", controller.listLogs);
router.get("/drives", controller.listDrives);
router.get("/reports", controller.listReports);

module.exports = router;
