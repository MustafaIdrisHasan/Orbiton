const express = require("express");
const { env } = require("../../config/env");
const { ROLES } = require("../../core/constants/roles");
const { requireRoles } = require("../../core/middleware/requireRoles");
const controller = require("./controller");

const router = express.Router();

router.use((req, res, next) => {
  if (!env.features.prediction) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  next();
});

router.post("/placement", requireRoles(ROLES.TPO, ROLES.RECRUITER), controller.placement);

module.exports = router;
