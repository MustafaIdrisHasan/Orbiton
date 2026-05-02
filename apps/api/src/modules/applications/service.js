const repository = require("./repository");
const resumeStore = require("../resumes/store");
const authRepository = require("../auth/auth.repository");
const notificationsService = require("../notifications/service");
const drivesService = require("../drives/service");

function toCandidateRow(candidate) {
  return {
    applicationId: candidate.id,
    serialNo: candidate.serialNo,
    name: candidate.name,
    email: candidate.email,
    branch: candidate.branch,
    rollNumber: candidate.rollNumber,
    cgpa: candidate.cgpa,
    backlogs: candidate.backlogs,
    skills: candidate.skills,
    status: candidate.status,
    currentRound: candidate.currentRound,
    driveId: candidate.driveId,
    driveTitle: candidate.driveTitle
  };
}

function toCandidateProfile(candidate) {
  return {
    applicationId: candidate.id,
    driveId: candidate.driveId,
    driveTitle: candidate.driveTitle,
    personalDetails: {
      name: candidate.name,
      rollNumber: candidate.rollNumber,
      branch: candidate.branch,
      year: candidate.year,
      gender: candidate.gender,
      email: candidate.email
    },
    academics: {
      cgpa: candidate.cgpa,
      backlogs: candidate.backlogs
    },
    skills: candidate.skills,
    projects: candidate.projects,
    resumePreview: candidate.resumePreview,
    testScores: candidate.testScores,
    notes: candidate.notes,
    status: candidate.status,
    currentRound: candidate.currentRound
  };
}

function listApplications() {
  return repository.listAllApplications().map(toCandidateRow);
}

function listCandidatesForDrive(driveId, query = {}) {
  const candidates = repository.listCandidatesByDriveId(driveId)
    .filter((candidate) => !query.branch || candidate.branch === query.branch)
    .filter((candidate) => !query.status || candidate.status === query.status)
    .filter((candidate) => !query.cgpaMin || candidate.cgpa >= Number(query.cgpaMin))
    .filter((candidate) => {
      if (!query.search) {
        return true;
      }

      const search = String(query.search).toLowerCase();
      return (
        candidate.name.toLowerCase().includes(search) ||
        candidate.rollNumber.toLowerCase().includes(search) ||
        String(candidate.serialNo).includes(search)
      );
    })
    .map(toCandidateRow);

  return {
    items: candidates,
    total: candidates.length
  };
}

function getCandidateProfile(applicationId) {
  const candidate = repository.getCandidateByApplicationId(applicationId);
  return candidate ? toCandidateProfile(candidate) : null;
}

function updateApplicationStatus(applicationId, nextStatus) {
  const candidate = repository.updateApplicationStatus(applicationId, nextStatus);
  return candidate
    ? {
        applicationId: candidate.id,
        driveId: candidate.driveId,
        status: candidate.status,
        currentRound: candidate.currentRound
      }
    : null;
}

async function resolveApplicantFromAuth(userId) {
  const uid = String(userId || "").trim();
  let email = "";
  let name = "Student";
  try {
    const user = await authRepository.findUserWithRolesById(uid);
    if (user?.email) {
      email = user.email;
      const local = email.split("@")[0] || "student";
      name = local
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  } catch {
    /* auth store optional in some dev setups */
  }
  if (!email) {
    email = uid ? `${uid}@applicant.local` : "applicant@orbiton.local";
  }

  const profile = await resumeStore.getProfile(uid);
  const education = profile?.education || {};
  const branch = education.branch || profile?.department || "";
  const year = education.year || "";

  return {
    userId: uid,
    email,
    name,
    branch,
    year,
    cgpa: education.cgpa ?? profile?.cgpa ?? null,
    backlogs: profile?.backlogs ?? 0,
    skills: profile?.skills || [],
    resumePreview: profile?.summary || profile?.headline || "",
    projects: (profile?.projects || []).map((p) => (typeof p === "string" ? p : p?.name || p?.title || "")).filter(Boolean),
    rollNumber: profile?.rollNumber || ""
  };
}

async function applyToDrive(driveId, userId) {
  const applicant = await resolveApplicantFromAuth(userId);
  const result = repository.applyToDrive(driveId, {
    ...applicant,
    applicationId: `app-${Date.now()}`,
    notes: `Applied via student portal (${new Date().toISOString()})`
  });

  if (result.error) {
    return result;
  }

  const app = result.application;
  const driveMeta = drivesService.getDrive(driveId);
  const company = driveMeta?.companyName || "Company";
  const skillLine = (app.skills || []).length ? app.skills.join(", ") : "—";

  // Fan out to TPO+RECRUITER+ADMIN — the notifications service resolves
  // role -> user_ids and persists one row per recipient so each viewer
  // gets it scoped to their own inbox.
  try {
    await notificationsService.createApplicationAlert({
      title: `New application: ${app.name}`,
      message: `${app.name} (${app.email}) applied to ${app.driveTitle} · ${company}. Branch: ${app.branch || "—"}, CGPA: ${app.cgpa ?? "—"}, Skills: ${skillLine}`,
      applicationId: app.id,
      driveId: app.driveId,
      audienceRoles: ["TPO", "RECRUITER", "ADMIN"],
      studentSnapshot: {
        name: app.name,
        email: app.email,
        branch: app.branch,
        rollNumber: app.rollNumber,
        cgpa: app.cgpa,
        backlogs: app.backlogs,
        skills: app.skills,
        year: app.year
      }
    });
  } catch (err) {
    // Non-fatal: missing recipients or PG outage shouldn't block the apply.
    // eslint-disable-next-line no-console
    console.warn("[applications] application alert fan-out failed:", err.message);
  }

  // Confirmation row in the applying student's own inbox so /notifications
  // shows their freshly-submitted application immediately.
  try {
    await notificationsService.notifyUser(userId, {
      type: "APPLICATION",
      title: `Application submitted · ${company}`,
      message: `Your application to ${app.driveTitle} (${company}) was received. Track status in Applications.`,
      entityId: app.id,
      driveId: app.driveId,
      source: "STUDENT",
    });
  } catch (err) {
    // Non-fatal: confirmation toast in the UI still tells the student.
    // eslint-disable-next-line no-console
    console.warn("[applications] student confirmation notification failed:", err.message);
  }

  return {
    ok: true,
    applicationId: app.id,
    driveId: app.driveId,
    driveTitle: app.driveTitle,
    status: app.status
  };
}

module.exports = {
  listApplications,
  listCandidatesForDrive,
  getCandidateProfile,
  updateApplicationStatus,
  applyToDrive
};
