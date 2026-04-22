const express = require("express");
const { getIntelligenceStatus } = require("../../integrations/intelligence");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    query: req.query.q || "",
    items: [],
    intelligence: getIntelligenceStatus()
  });
});

module.exports = router;

