const express = require("express");
const controller = require("./controller");
const { requireRoles } = require("../../core/middleware/requireRoles");
const { ROLES } = require("../../core/constants/roles");

const router = express.Router();

// Company-role self-service (must come before "/:id").
router.get("/me/profile", requireRoles(ROLES.COMPANY), controller.getMyProfile);
router.put("/me/profile", requireRoles(ROLES.COMPANY), controller.updateMyProfile);
router.get("/me/drives", requireRoles(ROLES.COMPANY), controller.listMyDrives);
router.get("/me/applicants", requireRoles(ROLES.COMPANY), controller.listMyApplicants);
router.post("/me/contact", requireRoles(ROLES.COMPANY), controller.contactApplicant);
router.post("/me/offer", requireRoles(ROLES.COMPANY), controller.giveOffer);
router.get("/me/offers", requireRoles(ROLES.COMPANY), controller.listMyOffers);

router.get("/", controller.listCompanies);
router.get("/:id", controller.getCompany);

module.exports = router;
