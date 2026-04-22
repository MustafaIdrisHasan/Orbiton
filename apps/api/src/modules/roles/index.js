const express = require("express");
const { ROLES } = require("../../core/constants/roles");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({
    roles: Object.values(ROLES)
  });
});

module.exports = router;

