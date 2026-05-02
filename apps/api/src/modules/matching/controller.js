const service = require("./service");
const drivesService = require("../drives/service");
const { recruiterStore } = require("../recruiters/mockData");
const { env } = require("../../config/env");

function getStudentId(req) {
  return req.query?.studentId || req.user?.userId || req.user?.id || "demo-user";
}

function round4(n) {
  return Math.round(Number(n) * 10000) / 10000;
}

function findCandidateMeta(studentId) {
  const sid = String(studentId);
  for (const drive of recruiterStore.drives || []) {
    for (const c of drive.candidates || []) {
      if (c && String(c.id) === sid) {
        return c;
      }
    }
  }
  return null;
}

function formatVectorDriveRanking({ studentId, results, weights_used, model_version, note }) {
  const drives = drivesService.listDrives();
  const byId = new Map(drives.map((d) => [String(d.id), d]));
  const items = (results || [])
    .filter((r) => r.boolean_pass !== false)
    .map((r) => {
    const extId = String(r.drive_id);
    const d = byId.get(extId);
    const exp = r.explanations || {};
    return {
      driveId: extId,
      title: d?.title ?? extId,
      companyName: d?.companyName ?? "",
      similarity: round4(exp.cosine_similarity ?? 0),
      matchPercent: Math.round((r.composite_score ?? 0) * 100),
      topContributingDimensions: exp.matched_skills || [],
      compositeScore: r.composite_score,
      booleanPass: r.boolean_pass
    };
  });
  return {
    vocabularyVersion: model_version || "pgvector-matching-v1",
    studentId,
    items,
    weightsUsed: weights_used,
    note
  };
}

function formatVectorStudentRanking({ driveId, results, weights_used, model_version, note }) {
  const items = (results || []).map((r) => {
    const sid = String(r.student_id);
    const meta = findCandidateMeta(sid);
    const exp = r.explanations || {};
    return {
      candidateId: sid,
      name: meta?.name ?? sid,
      email: meta?.email ?? "",
      branch: meta?.branch ?? meta?.education?.branch ?? "",
      cgpa: meta?.cgpa ?? meta?.education?.cgpa ?? null,
      similarity: round4(exp.cosine_similarity ?? 0),
      matchPercent: Math.round((r.composite_score ?? 0) * 100),
      topContributingDimensions: exp.matched_skills || [],
      compositeScore: r.composite_score,
      booleanPass: r.boolean_pass
    };
  });
  const drive = drivesService.getDrive(driveId);
  return {
    vocabularyVersion: model_version || "pgvector-matching-v1",
    driveId,
    driveTitle: drive?.title ?? driveId,
    items,
    weightsUsed: weights_used,
    note
  };
}

async function listDrivesForStudent(req, res, next) {
  try {
    const studentId = getStudentId(req);
    if (env.features.usePgvectorMatching) {
      try {
        const vectorSvc = require("./matching.service");
        const out = await vectorSvc.matchDrivesForStudent({ studentId, limit: 100 });
        return res.json(formatVectorDriveRanking(out));
      } catch (e) {
        if (e.status === 404) {
          res.status(404).json({ message: "Student not found" });
          return;
        }
        // eslint-disable-next-line no-console
        console.warn("[matching] pgvector path failed, using legacy:", e.message);
      }
    }
    const result = await service.rankDrivesForStudent(studentId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function listStudentsForDrive(req, res, next) {
  try {
    const driveId = req.query?.driveId;
    if (!driveId) {
      res.status(400).json({ message: "driveId query parameter is required" });
      return;
    }
    if (env.features.usePgvectorMatching) {
      try {
        const vectorSvc = require("./matching.service");
        const out = await vectorSvc.matchStudentsForDrive({ driveId, limit: 100 });
        res.json(formatVectorStudentRanking({ ...out, driveId }));
        return;
      } catch (e) {
        if (e.status === 404) {
          res.status(404).json({ message: "Drive not found" });
          return;
        }
        // eslint-disable-next-line no-console
        console.warn("[matching] pgvector path failed, using legacy:", e.message);
      }
    }
    const result = service.rankStudentsForDrive(driveId);
    if (!result) {
      res.status(404).json({ message: "Drive not found" });
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listDrivesForStudent,
  listStudentsForDrive
};
