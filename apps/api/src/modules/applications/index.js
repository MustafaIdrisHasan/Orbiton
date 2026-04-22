const express = require("express");
const controller = require("./controller");

const router = express.Router();

router.get("/", controller.listApplications);
router.get("/:id", controller.getApplication);
router.post("/", controller.createApplication);
router.patch("/:id", controller.updateApplication);
router.delete("/:id", controller.deleteApplication);
router.post("/apply/:driveId", controller.applyToDrive);
router.post("/:applicationId/shortlist", controller.shortlistApplication);
router.post("/:applicationId/reject", controller.rejectApplication);
router.post("/:applicationId/schedule-final-interview", controller.scheduleFinalInterview);

module.exports = router;

