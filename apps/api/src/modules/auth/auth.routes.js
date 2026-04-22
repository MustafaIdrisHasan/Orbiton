const express = require("express");
const { authController } = require("./auth.controller");
const { requireAuth } = require("../../core/middleware/requireAuth");

const router = express.Router();

router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.post("/request-reset", authController.requestReset);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
