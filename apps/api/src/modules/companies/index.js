const express = require("express");
const controller = require("./controller");

const router = express.Router();

router.get("/", controller.listCompanies);
router.get("/:id", controller.getCompany);

module.exports = router;
