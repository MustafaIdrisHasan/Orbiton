const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");

const { env } = require("../config/env");
const { app } = require("../app");
const { ROLES } = require("../core/constants/roles");

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
            } catch (_e) {
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

test("feature flags default to off when env vars are unset", () => {
  assert.equal(typeof env.features, "object");
  assert.equal("resumeScoring" in env.features, true);
  assert.equal("matching" in env.features, true);
  assert.equal("prediction" in env.features, true);
});

test("matching router returns 404 when ENABLE_MATCHING is off", async () => {
  const previous = env.features.matching;
  env.features.matching = false;
  const { server, port } = await startServer();
  try {
    const res = await request(port, "/api/v1/matching/drives", {
      token: tokenFor(ROLES.STUDENT)
    });
    assert.equal(res.status, 404);
  } finally {
    env.features.matching = previous;
    await stopServer(server);
  }
});

test("predictions router returns 404 when ENABLE_PREDICTION is off", async () => {
  const previous = env.features.prediction;
  env.features.prediction = false;
  const { server, port } = await startServer();
  try {
    const res = await request(port, "/api/v1/predictions/placement", {
      method: "POST",
      token: tokenFor(ROLES.TPO),
      body: { studentId: "demo-user" }
    });
    assert.equal(res.status, 404);
  } finally {
    env.features.prediction = previous;
    await stopServer(server);
  }
});

test("existing /students/profile/me payload shape is unchanged", async () => {
  const { server, port } = await startServer();
  try {
    const res = await request(port, "/api/v1/students/profile/me", {
      token: tokenFor(ROLES.STUDENT)
    });
    assert.equal(res.status, 200);
    assert.equal(res.body?.success, true);
    const data = res.body?.data || {};
    for (const key of [
      "profileCompletionPercent",
      "resumeUploaded",
      "resumeScore",
      "department",
      "cgpa",
      "backlogs",
      "skills"
    ]) {
      assert.ok(key in data, `expected key '${key}' in /students/profile/me payload`);
    }
    assert.ok(Array.isArray(data.skills), "skills should be an array");
  } finally {
    await stopServer(server);
  }
});

test("existing /drives list returns the resource+items envelope", async () => {
  const { server, port } = await startServer();
  try {
    const res = await request(port, "/api/v1/drives", {
      token: tokenFor(ROLES.STUDENT)
    });
    assert.equal(res.status, 200);
    assert.equal(res.body?.resource, "drives");
    assert.ok(Array.isArray(res.body?.items));
    if (res.body.items.length > 0) {
      const first = res.body.items[0];
      for (const key of [
        "id",
        "title",
        "status",
        "requiredSkills",
        "minCgpa",
        "eligibleDepartments"
      ]) {
        assert.ok(key in first, `expected '${key}' on drive summary`);
      }
    }
  } finally {
    await stopServer(server);
  }
});

test("existing /companies list returns an array of company summaries", async () => {
  const { server, port } = await startServer();
  try {
    const res = await request(port, "/api/v1/companies", {
      token: tokenFor(ROLES.STUDENT)
    });
    assert.equal(res.status, 200);
    const items = Array.isArray(res.body) ? res.body : res.body?.items;
    assert.ok(Array.isArray(items));
    if (items.length > 0) {
      const first = items[0];
      for (const key of ["id", "name", "industry", "totalDrives", "hiringStatus"]) {
        assert.ok(key in first, `expected '${key}' on company summary`);
      }
    }
  } finally {
    await stopServer(server);
  }
});
