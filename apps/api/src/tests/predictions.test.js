const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");

const { env } = require("../config/env");
const { app } = require("../app");
const { ROLES } = require("../core/constants/roles");
const intelligence = require("../integrations/intelligence");
const resumeStore = require("../modules/resumes/store");

function startServer(handler) {
  return new Promise((resolve) => {
    const server = handler ? http.createServer(handler) : http.createServer(app);
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

test("predictions route 404 when ENABLE_PREDICTION is off", async () => {
  const previous = env.features.prediction;
  const prevPg = env.usePostgres;
  const prevPredUrl = env.predictionServiceUrl;
  env.usePostgres = false;
  env.predictionServiceUrl = "";
  resumeStore.clearBackendForTests();
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
    env.usePostgres = prevPg;
    env.predictionServiceUrl = prevPredUrl;
    resumeStore.clearBackendForTests();
    await stopServer(server);
  }
});

test("predictions route returns 503 when ml-service is unreachable", async () => {
  const previous = env.features.prediction;
  const previousUrl = env.mlServiceUrl;
  const prevPg = env.usePostgres;
  const prevPredUrl = env.predictionServiceUrl;
  env.usePostgres = false;
  env.predictionServiceUrl = "";
  resumeStore.clearBackendForTests();
  env.features.prediction = true;
  env.mlServiceUrl = "http://127.0.0.1:1"; // unreachable
  intelligence._resetCircuitForTests();
  const { server, port } = await startServer();
  try {
    const res = await request(port, "/api/v1/predictions/placement", {
      method: "POST",
      token: tokenFor(ROLES.TPO),
      body: { studentId: "demo-user", resumeScore: 80, cgpa: 8.5 }
    });
    assert.equal(res.status, 503);
    assert.equal(res.body?.available, false);
    assert.ok(typeof res.body?.reason === "string");
    assert.ok(res.body?.payload, "should still echo the payload that would have been sent");
  } finally {
    env.features.prediction = previous;
    env.mlServiceUrl = previousUrl;
    env.usePostgres = prevPg;
    env.predictionServiceUrl = prevPredUrl;
    resumeStore.clearBackendForTests();
    intelligence._resetCircuitForTests();
    await stopServer(server);
  }
});

test("predictions route returns 200 against a stub ml-service", async () => {
  const previous = env.features.prediction;
  const previousUrl = env.mlServiceUrl;
  const prevPg = env.usePostgres;
  const prevPredUrl = env.predictionServiceUrl;
  env.usePostgres = false;
  env.predictionServiceUrl = "";
  resumeStore.clearBackendForTests();
  env.features.prediction = true;
  intelligence._resetCircuitForTests();

  const { server: stub, port: stubPort } = await startServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      const payload = raw ? JSON.parse(raw) : {};
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          probability: 0.82,
          riskBand: "high",
          modelVersion: "pp-v0.1.0",
          features: payload,
          contributions: { resume_score: 1.6, cgpa: 1.8, internship: 0.8 }
        })
      );
    });
  });

  env.mlServiceUrl = `http://127.0.0.1:${stubPort}`;

  const { server: api, port: apiPort } = await startServer();
  try {
    const res = await request(apiPort, "/api/v1/predictions/placement", {
      method: "POST",
      token: tokenFor(ROLES.TPO),
      body: { studentId: "demo-user", resumeScore: 78, cgpa: 8.6, hasInternship: true, projectCount: 3, backlogs: 0 }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body?.available, true);
    assert.equal(res.body?.probability, 0.82);
    assert.equal(res.body?.riskBand, "high");
    assert.equal(res.body?.modelVersion, "pp-v0.1.0");
    assert.equal(res.body?.payload?.studentId, "demo-user");
  } finally {
    env.features.prediction = previous;
    env.mlServiceUrl = previousUrl;
    env.usePostgres = prevPg;
    env.predictionServiceUrl = prevPredUrl;
    resumeStore.clearBackendForTests();
    intelligence._resetCircuitForTests();
    await stopServer(api);
    await stopServer(stub);
  }
});

test("circuit breaker opens after consecutive failures", async () => {
  const previousUrl = env.mlServiceUrl;
  env.mlServiceUrl = "http://127.0.0.1:1";
  intelligence._resetCircuitForTests();
  try {
    for (let i = 0; i < 3; i += 1) {
      const result = await intelligence.predictPlacement({ studentId: "x" });
      assert.equal(result.available, false);
    }
    const state = intelligence._circuitStateForTests();
    assert.equal(state.state, "open");

    const open = await intelligence.predictPlacement({ studentId: "x" });
    assert.equal(open.available, false);
    assert.equal(open.reason, "CIRCUIT_OPEN");
  } finally {
    env.mlServiceUrl = previousUrl;
    intelligence._resetCircuitForTests();
  }
});

test("getIntelligenceStatus exposes stable service id and planned state", async () => {
  const intel = intelligence.getIntelligenceStatus();
  assert.equal(intel.service, "orbiton-ml-service");
  assert.equal(intel.status, "planned");
  assert.equal(typeof intel.predictionServiceUrl, "boolean");
});

test("students cannot call predictions/placement (TPO/RECRUITER only)", async () => {
  const previous = env.features.prediction;
  const prevPg = env.usePostgres;
  const prevPredUrl = env.predictionServiceUrl;
  env.usePostgres = false;
  env.predictionServiceUrl = "";
  resumeStore.clearBackendForTests();
  env.features.prediction = true;
  intelligence._resetCircuitForTests();
  const { server, port } = await startServer();
  try {
    const res = await request(port, "/api/v1/predictions/placement", {
      method: "POST",
      token: tokenFor(ROLES.STUDENT),
      body: { studentId: "demo-user" }
    });
    assert.equal(res.status, 403);
  } finally {
    env.features.prediction = previous;
    env.usePostgres = prevPg;
    env.predictionServiceUrl = prevPredUrl;
    resumeStore.clearBackendForTests();
    intelligence._resetCircuitForTests();
    await stopServer(server);
  }
});
