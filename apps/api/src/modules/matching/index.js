const express = require("express");
const { env } = require("../../config/env");
const { ROLES } = require("../../core/constants/roles");
const { requireRoles } = require("../../core/middleware/requireRoles");
const controller = require("./controller");

const router = express.Router();

router.use((req, res, next) => {
  if (!env.features.matching) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  next();
});

router.get("/drives", controller.listDrivesForStudent);
router.get("/students", requireRoles(ROLES.TPO, ROLES.RECRUITER), controller.listStudentsForDrive);

module.exports = router;
