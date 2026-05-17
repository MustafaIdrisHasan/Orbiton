const service = require("./service");
const notificationsService = require("../notifications/service");
const audience = require("../notifications/audience");
const { recruiterStore } = require("../recruiters/mockData");

function listCompanies(_req, res) {
  const items = service.listCompanies();
  res.json({ resource: "companies", items });
}

function getCompany(req, res) {
  const company = service.getCompanyById(req.params.id);
  if (!company) {
    res.status(404).json({ message: "Company not found" });
    return;
  }
  res.json(company);
}

// --- COMPANY-role self-service endpoints ---------------------------------

function getMyProfile(req, res) {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  const profile = service.getCompanyProfile(userId, req.user?.email);
  res.json(profile);
}

function updateMyProfile(req, res) {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  const body = req.body || {};
  const next = service.updateCompanyProfile(userId, req.user?.email, {
    companyName: typeof body.companyName === "string" ? body.companyName : undefined,
    designation: typeof body.designation === "string" ? body.designation : undefined,
    industry: typeof body.industry === "string" ? body.industry : undefined,
    description: typeof body.description === "string" ? body.description : undefined,
    website: typeof body.website === "string" ? body.website : undefined
  });
  res.json(next);
}

function listMyDrives(req, res) {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  const profile = service.getCompanyProfile(userId, req.user?.email);
  if (!profile.companyName) {
    res.json({ items: [], companyName: "" });
    return;
  }
  const drives = service
    .listDrivesByCompanyName(profile.companyName)
    .map(service.toCompanyDriveSummary);
  res.json({ items: drives, companyName: profile.companyName });
}

function listMyApplicants(req, res) {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  const profile = service.getCompanyProfile(userId, req.user?.email);
  if (!profile.companyName) {
    res.json({ items: [], companyName: "" });
    return;
  }
  const items = service.listApplicantsForCompanyName(profile.companyName);
  res.json({ items, companyName: profile.companyName });
}

/**
 * POST /api/v1/companies/me/contact
 * Body: { applicationId, subject?, message }
 * Sends a notification to the student behind `applicationId` so long as
 * that student's drive belongs to this company user's `companyName`.
 */
async function contactApplicant(req, res, next) {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { applicationId, subject, message } = req.body || {};
    const trimmedMessage = String(message || "").trim();
    if (!applicationId || !trimmedMessage) {
      res.status(400).json({ message: "applicationId and message are required" });
      return;
    }

    const profile = service.getCompanyProfile(userId, req.user?.email);
    if (!profile.companyName) {
      res.status(400).json({ message: "Set your company name before contacting students" });
      return;
    }

    // Locate the application across all drives + verify drive belongs to us.
    let foundDrive = null;
    let foundCandidate = null;
    for (const drive of recruiterStore.drives || []) {
      const candidate = (drive.candidates || []).find((c) => c.id === applicationId);
      if (candidate) {
        foundDrive = drive;
        foundCandidate = candidate;
        break;
      }
    }
    if (!foundDrive || !foundCandidate) {
      res.status(404).json({ message: "Application not found" });
      return;
    }
    const driveCompany = String(foundDrive.companyName || "").trim().toLowerCase();
    const myCompany = String(profile.companyName || "").trim().toLowerCase();
    if (!driveCompany || driveCompany !== myCompany) {
      res.status(403).json({
        message: "This application does not belong to a drive associated with your company"
      });
      return;
    }

    const studentEmail = foundCandidate.email;
    const studentUserId = await audience.resolveStudentUserIdByApplicantEmail(studentEmail);
    if (!studentUserId) {
      res.status(404).json({ message: "Student account could not be resolved" });
      return;
    }

    const title = subject && String(subject).trim()
      ? String(subject).trim()
      : `Message from ${profile.companyName}`;

    const notification = await notificationsService.notifyUser(studentUserId, {
      type: "ANNOUNCEMENT",
      title,
      message: trimmedMessage,
      entityId: applicationId,
      driveId: foundDrive.id,
      source: "RECRUITER"
    });

    res.status(201).json({
      ok: true,
      notificationId: notification?.id || null,
      message: "Message sent to student"
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/companies/me/offer
 * Body: { applicationId, role, packageLpa, joiningDate, companyEmail, companyContact, note }
 * Creates an offer, sends a notification to the student and to every TPO user.
 */
async function giveOffer(req, res, next) {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const { applicationId, role, packageLpa, joiningDate, companyEmail, companyContact, note } = req.body || {};
    if (!applicationId || !role) {
      res.status(400).json({ message: "applicationId and role are required" });
      return;
    }

    const profile = service.getCompanyProfile(userId, req.user?.email);
    if (!profile.companyName) {
      res.status(400).json({ message: "Set your company name before issuing offers" });
      return;
    }

    let foundDrive = null;
    let foundCandidate = null;
    for (const drive of recruiterStore.drives || []) {
      const candidate = (drive.candidates || []).find((c) => c.id === applicationId);
      if (candidate) {
        foundDrive = drive;
        foundCandidate = candidate;
        break;
      }
    }
    if (!foundDrive || !foundCandidate) {
      res.status(404).json({ message: "Application not found" });
      return;
    }
    const driveCompany = String(foundDrive.companyName || "").trim().toLowerCase();
    const myCompany = String(profile.companyName || "").trim().toLowerCase();
    if (!driveCompany || driveCompany !== myCompany) {
      res.status(403).json({ message: "This application does not belong to a drive associated with your company" });
      return;
    }

    const offerId = `offer-${Date.now()}-${Math.floor(Math.random() * 1e5)}`;
    const offer = {
      id: offerId,
      applicationId,
      studentEmail: foundCandidate.email,
      studentUserId: null,
      driveId: foundDrive.id,
      driveTitle: foundDrive.title,
      companyName: profile.companyName,
      companyEmail: companyEmail || profile.email || "",
      companyContact: companyContact || "",
      role: String(role).trim(),
      packageLpa: packageLpa != null ? Number(packageLpa) : null,
      joiningDate: joiningDate || null,
      note: note ? String(note).trim() : "",
      status: "PENDING",
      createdAt: new Date().toISOString()
    };
    recruiterStore.companyOffers.unshift(offer);

    // Notify student
    const studentUserId = await audience.resolveStudentUserIdByApplicantEmail(foundCandidate.email);
    if (studentUserId) {
      offer.studentUserId = studentUserId;
      await notificationsService.notifyUser(studentUserId, {
        type: "OFFER",
        title: `Offer from ${profile.companyName}`,
        message: `You have received an offer for "${role}"${packageLpa ? ` · ${packageLpa} LPA` : ""}${joiningDate ? ` · Joining ${joiningDate}` : ""}. Check your Offers page to accept or decline.`,
        entityId: offerId,
        driveId: foundDrive.id,
        source: "RECRUITER"
      });
    }

    // Notify all TPO users
    const tpoUserIds = await audience.resolveUserIdsForRoles(["TPO"]);
    for (const tpoId of tpoUserIds) {
      await notificationsService.notifyUser(tpoId, {
        type: "OFFER",
        title: `Offer issued to ${foundCandidate.name || foundCandidate.email}`,
        message: `${profile.companyName} has issued an offer to ${foundCandidate.name || foundCandidate.email} for "${role}" on drive "${foundDrive.title}"${packageLpa ? ` · ${packageLpa} LPA` : ""}.`,
        entityId: offerId,
        driveId: foundDrive.id,
        source: "RECRUITER"
      });
    }

    res.status(201).json({ ok: true, offerId, offer });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/companies/me/offers — list all offers this company has issued. */
function listMyOffers(req, res) {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  const profile = service.getCompanyProfile(userId, req.user?.email);
  const myName = String(profile.companyName || "").trim().toLowerCase();
  const items = myName
    ? recruiterStore.companyOffers.filter(
        (o) => String(o.companyName || "").trim().toLowerCase() === myName
      )
    : [];
  res.json({ items });
}

module.exports = {
  listCompanies,
  getCompany,
  getMyProfile,
  updateMyProfile,
  listMyDrives,
  listMyApplicants,
  contactApplicant,
  giveOffer,
  listMyOffers
};
