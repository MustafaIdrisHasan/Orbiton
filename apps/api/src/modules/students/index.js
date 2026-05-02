const express = require("express");
const { env } = require("../../config/env");
const resumeStore = require("../resumes/store");

const router = express.Router();

router.get("/profile/me", async (req, res, next) => {
  try {
    const studentId = req.user?.userId || req.user?.id || "demo-user";
    const stored = await resumeStore.getProfile(studentId);
    const education = stored?.education || {};
    res.json({
      success: true,
      data: {
        profileCompletionPercent: stored ? 85 : 40,
        resumeUploaded: Boolean(stored),
        resumeScore: null,
        department: education.branch || stored?.department || "CSE",
        cgpa: education.cgpa ?? stored?.cgpa ?? 8.6,
        backlogs: stored?.backlogs ?? 0,
        skills: stored?.skills?.length ? stored.skills : []
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get("/profile/me/full", async (req, res, next) => {
  if (!env.features.resumeScoring) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  try {
    const studentId = req.user?.userId || req.user?.id || "demo-user";
    const stored = await resumeStore.getProfile(studentId);
    const latestScore = await resumeStore.getLatestScoreForStudent(studentId);
  res.json({
    success: true,
    data: {
      profileCompletionPercent: 72,
      resumeUploaded: true,
      resumeScore: latestScore?.finalScore ?? null,
      department: stored?.education?.branch || "CSE",
      cgpa: stored?.education?.cgpa ?? 8.6,
      backlogs: stored?.backlogs ?? 0,
      skills: stored?.skills || ["React", "Node.js", "SQL", "System design"],
      education: stored?.education || {
        cgpa: 8.6,
        branch: "CSE",
        degree: "B.Tech",
        year: "Final Year"
      },
      projects: stored?.projects || [],
      experience: stored?.experience || [],
      latestResumeId: latestScore?.resumeId || null,
      modelVersion: latestScore?.breakdown?.modelVersion || null
    }
  });
  } catch (err) {
    next(err);
  }
});

router.get("/", (_req, res) => {
  res.json({
    resource: "students",
    items: [],
    message: "Students list endpoint ready for implementation"
  });
});

module.exports = router;
