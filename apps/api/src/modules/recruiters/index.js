const express = require("express");
const controller = require("./controller");

const router = express.Router();

router.get("/", controller.listRecruiters);
router.get("/dashboard", controller.getDashboard);
router.get("/drives", controller.listDrives);
router.get("/drives/:driveId/candidates", controller.listCandidates);
router.get("/candidates/:candidateId", controller.getCandidate);
router.post("/applications/:applicationId/shortlist", controller.shortlist);
router.post("/applications/:applicationId/reject", controller.reject);
router.post("/applications/:applicationId/schedule-final-interview", controller.scheduleFinalInterview);
router.get("/interviews", controller.listInterviews);
router.post("/interviews", controller.createInterview);
router.get("/communications", controller.listBroadcasts);
router.post("/communications/broadcast", controller.broadcast);
router.get("/reports/exports", controller.listExports);
router.get("/:id", controller.getRecruiter);
router.post("/", controller.createRecruiter);
router.patch("/:id", controller.updateRecruiter);
router.delete("/:id", controller.deleteRecruiter);

module.exports = router;

