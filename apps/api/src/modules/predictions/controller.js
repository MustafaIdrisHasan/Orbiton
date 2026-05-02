const service = require("./service");

async function placement(req, res, next) {
  try {
    const studentId =
      req.body?.studentId ||
      req.query?.studentId ||
      req.user?.userId ||
      req.user?.id ||
      null;

    if (!studentId) {
      res.status(400).json({ message: "studentId is required" });
      return;
    }

    const override = {
      resumeScore: req.body?.resumeScore,
      cgpa: req.body?.cgpa,
      hasInternship: req.body?.hasInternship,
      projectCount: req.body?.projectCount,
      backlogs: req.body?.backlogs,
      skillCount: req.body?.skillCount,
      department: req.body?.department,
      year: req.body?.year,
      hackathonCount: req.body?.hackathonCount,
      certificationCount: req.body?.certificationCount,
      communicationScore: req.body?.communicationScore
    };

    const { payload, result } = await service.predictForStudent({ studentId, override });

    if (!result?.available) {
      res.status(503).json({
        available: false,
        reason: result?.reason || "UNAVAILABLE",
        payload
      });
      return;
    }

    res.json({
      available: true,
      studentId,
      payload,
      probability: result.probability,
      riskBand: result.riskBand,
      modelVersion: result.modelVersion,
      contributions: result.contributions,
      features: result.features,
      preview: result.preview,
      rationale: result.rationale,
      backend: result.backend
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  placement
};
