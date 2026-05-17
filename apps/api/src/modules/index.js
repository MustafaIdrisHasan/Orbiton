const express = require("express");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { requireAuth } = require("../core/middleware/requireAuth");
const { requireRoles } = require("../core/middleware/requireRoles");
const { ROLES } = require("../core/constants/roles");
const authRouter = require("./auth/auth.routes");
const usersRouter = require("./users");
const rolesRouter = require("./roles");
const studentsRouter = require("./students");
const facultyRouter = require("./faculty");
const recruitersRouter = require("./recruiters");
const drivesRouter = require("./drives");
const applicationsRouter = require("./applications");
const roundsRouter = require("./rounds");
const offersRouter = require("./offers");
const placementsRouter = require("./placements");
const resumesRouter = require("./resumes");
const skillsRouter = require("./skills");
const certificationsRouter = require("./certifications");
const marksRouter = require("./marks");
const notificationsRouter = require("./notifications");
const auditRouter = require("./audit");
const reportsRouter = require("./reports");
const searchRouter = require("./search");
const companiesRouter = require("./companies");
const tpoRouter = require("./tpo");
const adminRouter = require("./admin");
const matchingRouter = require("./matching");
const predictionsRouter = require("./predictions");
const internalRouter = require("./internal");
const chatRouter = require("./chat");
const intelligence = require("../integrations/intelligence");

const apiRouter = express.Router();

apiRouter.get("/", (_req, res) => {
  res.json({
    name: "Orbiton API",
    version: "v1",
    docs: "/packages/openapi/openapi.yaml"
  });
});

apiRouter.get("/intelligence/status", (_req, res) => {
  res.json(intelligence.getIntelligenceStatus());
});

apiRouter.get("/session/demo-token", (req, res) => {
  const requestedRole = String(req.query.role || ROLES.ADMIN).toUpperCase();
  const role = ROLES[requestedRole] || ROLES.ADMIN;
  const tokenPayload = {
    userId: "demo-user",
    role
  };

  res.json({
    success: true,
    data: {
      token: jwt.sign(tokenPayload, env.jwtSecret, { expiresIn: "1d" })
    }
  });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", requireAuth, requireRoles(ROLES.ADMIN), usersRouter);
apiRouter.use("/roles", requireAuth, requireRoles(ROLES.ADMIN), rolesRouter);
apiRouter.use("/students", requireAuth, studentsRouter);
apiRouter.use("/faculty", requireAuth, facultyRouter);
apiRouter.use("/recruiters", requireAuth, recruitersRouter);
apiRouter.use("/recruiter", requireAuth, requireRoles(ROLES.RECRUITER), recruitersRouter);
apiRouter.use("/drives", requireAuth, drivesRouter);
apiRouter.use("/companies", requireAuth, companiesRouter);
apiRouter.use("/applications", requireAuth, applicationsRouter);
apiRouter.use("/rounds", requireAuth, roundsRouter);
apiRouter.use("/offers", requireAuth, offersRouter);
apiRouter.use("/placements", requireAuth, placementsRouter);
apiRouter.use("/resumes", requireAuth, resumesRouter);
apiRouter.use("/skills", requireAuth, skillsRouter);
apiRouter.use("/certifications", requireAuth, certificationsRouter);
apiRouter.use("/marks", requireAuth, marksRouter);
apiRouter.use("/notifications", requireAuth, notificationsRouter);
apiRouter.use("/audit", requireAuth, requireRoles(ROLES.ADMIN), auditRouter);
apiRouter.use("/reports", requireAuth, requireRoles(ROLES.ADMIN, ROLES.FACULTY, ROLES.TPO), reportsRouter);
apiRouter.use("/search", requireAuth, searchRouter);
apiRouter.use("/tpo", requireAuth, requireRoles(ROLES.TPO), tpoRouter);
apiRouter.use("/admin", requireAuth, requireRoles(ROLES.ADMIN), adminRouter);
apiRouter.use("/matching", requireAuth, matchingRouter);
apiRouter.use("/predictions", requireAuth, predictionsRouter);
apiRouter.use("/internal", internalRouter);
apiRouter.use("/chat", requireAuth, chatRouter);

module.exports = {
  apiRouter
};

