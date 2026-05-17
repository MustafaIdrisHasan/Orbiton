const express = require("express");
const controller = require("./controller");

const router = express.Router();

router.get("/dashboard", controller.getDashboard);
router.get("/students", controller.listStudents);
router.get("/students/:id", controller.getStudent);
router.get("/students/:id/resumes", controller.getStudentResumes);
router.get("/applications/:applicationId/profile", controller.getApplicationProfile);
router.post("/applications/:applicationId/contact", controller.contactApplicant);
router.get("/drives", controller.listDrives);
router.get("/drives/:id", controller.getDrive);
router.get("/reports", controller.listReports);
router.get("/announcements", controller.listAnnouncements);
router.post("/announcements", controller.createAnnouncement);

module.exports = router;
