const express = require("express");
const controller = require("./controller");

const router = express.Router();

router.get("/", controller.listDrives);
router.get("/featured/list", controller.listFeaturedDrives);
router.get("/:id", controller.getDrive);
router.post("/", controller.createDrive);
router.patch("/:id", controller.updateDrive);
router.delete("/:id", controller.deleteDrive);

module.exports = router;

