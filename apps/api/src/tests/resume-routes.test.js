const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");

const { env } = require("../config/env");
const { app } = require("../app");
const { ROLES } = require("../core/constants/roles");
const resumeStore = require("../modules/resumes/store");

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

function stopServer(server) {
  return new Promise((resolve) => server.close(() => resolve()));
}

function request(port, path, { method = "GET", token, body } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (body) {
      headers["Content-Type"] = "application/json";
    }
    const req = http.request(
      { method, host: "127.0.0.1", port, path, headers },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          let parsed = null;
          if (raw) {
            try {
              parsed = JSON.parse(raw);
            } catch {
              parsed = raw;
            }
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function tokenFor(role) {
  return jwt.sign({ userId: "demo-user", role, roles: [role] }, env.jwtSecret, {
    expiresIn: "1h"
  });
}

test("resume scoring routes 404 when ENABLE_RESUME_SCORING is off", async () => {
  const previous = env.features.resumeScoring;
  env.features.resumeScoring = false;
  const { server, port } = await startServer();
  try {
    const token = tokenFor(ROLES.STUDENT);

    const put = await request(port, "/api/v1/resumes/me/profile", {
      method: "PUT",
      token,
      body: { skills: ["React"] }
    });
    assert.equal(put.status, 404);

    const analyze = await request(port, "/api/v1/resumes/abc/analyze", {
      method: "POST",
      token,
      body: {}
    });
    assert.equal(analyze.status, 404);

    const get = await request(port, "/api/v1/resumes/abc/score", { token });
    assert.equal(get.status, 404);

    const full = await request(port, "/api/v1/students/profile/me/full", { token });
    assert.equal(full.status, 404);

    const adapter = await request(port, "/api/v1/resumes/storage/adapter", { token });
    assert.equal(adapter.status, 200);
  } finally {
    env.features.resumeScoring = previous;
    await stopServer(server);
  }
});

test("resume scoring round trip when ENABLE_RESUME_SCORING is on", async () => {
  const previous = env.features.resumeScoring;
  const prevPg = env.usePostgres;
  env.features.resumeScoring = true;
  env.usePostgres = false;
  resumeStore.clearBackendForTests();
  await resumeStore._resetForTests();
  const { server, port } = await startServer();
  try {
    const token = tokenFor(ROLES.STUDENT);

    const put = await request(port, "/api/v1/resumes/me/profile", {
      method: "PUT",
      token,
      body: {
        skills: ["React", "Node.js", "SQL", "System design", "Express", "Postgres"],
        education: { cgpa: 8.6, branch: "CSE", degree: "B.Tech", year: "Final Year" },
        projects: [
          { title: "Campus portal", description: "React + Node", tech: ["React", "Node.js"] },
          { title: "Notice system", description: "WebSockets", tech: ["Node.js"] }
        ],
        experience: [{ role: "SDE Intern", durationMonths: 6, internship: true }]
      }
    });
    assert.equal(put.status, 200);
    assert.equal(put.body?.success, true);
    assert.equal(put.body?.data?.studentId, "demo-user");

    const full = await request(port, "/api/v1/students/profile/me/full", { token });
    assert.equal(full.status, 200);
    assert.equal(full.body?.success, true);
    assert.ok(Array.isArray(full.body?.data?.projects));
    assert.equal(full.body.data.projects.length, 2);

    const analyze = await request(port, "/api/v1/resumes/me-resume/analyze", {
      method: "POST",
      token,
      body: {}
    });
    assert.equal(analyze.status, 200);
    assert.equal(analyze.body?.modelVersion, "rs-v0.1.0");
    assert.ok(typeof analyze.body?.finalScore === "number");
    assert.ok(analyze.body.finalScore > 50);
    assert.ok(analyze.body?.subscores?.skills);
    assert.ok(Array.isArray(analyze.body?.tips));

    const score = await request(port, "/api/v1/resumes/me-resume/score", { token });
    assert.equal(score.status, 200);
    assert.equal(score.body?.modelVersion, "rs-v0.1.0");
    assert.equal(score.body?.finalScore, analyze.body.finalScore);

    const fullAfter = await request(port, "/api/v1/students/profile/me/full", { token });
    assert.equal(fullAfter.body?.data?.resumeScore, analyze.body.finalScore);
    assert.equal(fullAfter.body?.data?.latestResumeId, "me-resume");
  } finally {
    env.features.resumeScoring = previous;
    env.usePostgres = prevPg;
    resumeStore.clearBackendForTests();
    await resumeStore._resetForTests();
    await stopServer(server);
  }
});

test("/profile/me preserves its original payload shape with flag on or off", async () => {
  const { server, port } = await startServer();
  try {
    const token = tokenFor(ROLES.STUDENT);
    const res = await request(port, "/api/v1/students/profile/me", { token });
    assert.equal(res.status, 200);
    const data = res.body?.data || {};
    assert.equal(data.profileCompletionPercent, 72);
    assert.equal(data.resumeUploaded, true);
    assert.equal(data.resumeScore, null);
    assert.equal(data.department, "CSE");
    assert.equal(data.cgpa, 8.6);
    assert.equal(data.backlogs, 0);
    assert.deepEqual(data.skills, ["React", "Node.js", "SQL", "System design"]);
    assert.equal("education" in data, false, "/profile/me must not leak extended fields");
    assert.equal("projects" in data, false, "/profile/me must not leak extended fields");
  } finally {
    await stopServer(server);
  }
});
