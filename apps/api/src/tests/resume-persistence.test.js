const crypto = require("node:crypto");
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");

const { env } = require("../config/env");
const { app } = require("../app");
const { ROLES } = require("../core/constants/roles");
const resumeStore = require("../modules/resumes/store");
const memoryStore = require("../modules/resumes/store.memory");

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

function httpRequest(port, path, { method = "GET", token } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
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
    req.end();
  });
}

function tokenFor(role) {
  return jwt.sign({ userId: "demo-user", role, roles: [role] }, env.jwtSecret, {
    expiresIn: "1h"
  });
}

function multipartUpload(port, path, token, fieldName, filename, buffer, contentType) {
  return new Promise((resolve, reject) => {
    const boundary = `----orbitontest${Date.now()}${Math.random().toString(16).slice(2)}`;
    const head = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n` +
        `Content-Type: ${contentType}\r\n\r\n`,
      "utf8"
    );
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`, "utf8");
    const body = Buffer.concat([head, buffer, tail]);

    const headers = {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": body.length
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(
      { method: "POST", host: "127.0.0.1", port, path, headers },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (raw += chunk));
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
    req.write(body);
    req.end();
  });
}

test("resume store dispatcher selects memory when USE_POSTGRES is off", () => {
  const prev = env.usePostgres;
  env.usePostgres = false;
  resumeStore.clearBackendForTests();
  try {
    assert.equal(resumeStore.getBackendName(), "memory");
  } finally {
    env.usePostgres = prev;
    resumeStore.clearBackendForTests();
  }
});

test("dispatcher delegates to whichever backend is selected", async () => {
  let calls = 0;
  const stub = {
    backend: "stub",
    setProfile: async (id, p) => {
      calls += 1;
      return { ...p, studentId: id, updatedAt: "stub" };
    },
    getProfile: async () => ({ stub: true }),
    setScore: async () => null,
    getScore: async () => null,
    setResumeForStudent: async () => null,
    getStudentForResume: async () => null,
    getLatestScoreForStudent: async () => null,
    recordUpload: async (u) => u,
    getUpload: async () => null,
    _resetForTests: async () => {
      calls = 0;
    }
  };
  resumeStore.setBackendForTests(stub);
  try {
    assert.equal(resumeStore.getBackendName(), "stub");
    const stored = await resumeStore.setProfile("s1", { skills: ["x"] });
    assert.equal(stored.studentId, "s1");
    assert.equal(calls, 1);
    const profile = await resumeStore.getProfile("s1");
    assert.equal(profile.stub, true);
  } finally {
    resumeStore.clearBackendForTests();
  }
});

test("memory backend round-trips profile, score, and upload rows", async () => {
  await memoryStore._resetForTests();

  const stored = await memoryStore.setProfile("stu-1", {
    skills: ["React"],
    education: { cgpa: 8.0, branch: "CSE" }
  });
  assert.equal(stored.studentId, "stu-1");
  assert.equal((await memoryStore.getProfile("stu-1")).skills[0], "React");

  const sample = {
    modelVersion: "rs-v0.1.0",
    computedAt: new Date().toISOString(),
    weights: {},
    subscores: {
      skills: { score: 80 },
      experience: { score: 50 },
      completeness: { score: 75 }
    },
    finalScore: 70,
    tips: []
  };
  const row = await memoryStore.setScore("res-1", "stu-1", sample);
  assert.equal(row.finalScore, 70);
  assert.equal((await memoryStore.getScore("res-1")).studentId, "stu-1");

  const latest = await memoryStore.getLatestScoreForStudent("stu-1");
  assert.equal(latest.resumeId, "res-1");

  const upload = await memoryStore.recordUpload({
    uploadId: "up-1",
    studentId: "stu-1",
    filename: "r.pdf",
    contentType: "application/pdf",
    sizeBytes: 1024,
    storageKey: "k",
    extractedTextLength: 0
  });
  assert.equal(upload.uploadId, "up-1");
  assert.equal((await memoryStore.getUpload("up-1")).filename, "r.pdf");

  await memoryStore._resetForTests();
  assert.equal(await memoryStore.getProfile("stu-1"), null);
});

test("postgres migrate runner is order-deterministic and discovers SQL files", async () => {
  const { listMigrations } = require("../integrations/postgres/migrate");
  const migrations = await listMigrations();
  assert.ok(migrations.length >= 1);
  for (let i = 1; i < migrations.length; i += 1) {
    assert.ok(migrations[i] > migrations[i - 1], "migrations must be lexically ordered");
  }
  assert.ok(migrations.includes("001_resume_tables.sql"));
});

test("postgres store rejects use when POSTGRES_URL is unset", async () => {
  const original = env.postgresUrl;
  env.postgresUrl = "";
  try {
    delete require.cache[require.resolve("../integrations/postgres/pool")];
    delete require.cache[require.resolve("../modules/resumes/store.postgres")];
    const pgStore = require("../modules/resumes/store.postgres");
    await assert.rejects(() => pgStore.getProfile("anyone"), /POSTGRES_URL/);
  } finally {
    env.postgresUrl = original;
    delete require.cache[require.resolve("../integrations/postgres/pool")];
    delete require.cache[require.resolve("../modules/resumes/store.postgres")];
  }
});

test("POST /resumes/upload 404s when ENABLE_RESUME_SCORING is off", async () => {
  const previous = env.features.resumeScoring;
  env.features.resumeScoring = false;
  const { server, port } = await startServer();
  try {
    const token = tokenFor(ROLES.STUDENT);
    const res = await multipartUpload(
      port,
      "/api/v1/resumes/upload",
      token,
      "file",
      "r.pdf",
      Buffer.from("not-a-real-pdf"),
      "application/pdf"
    );
    assert.equal(res.status, 404);
  } finally {
    env.features.resumeScoring = previous;
    await stopServer(server);
  }
});

test("POST /resumes/upload accepts a PDF, persists the upload, and produces a score", async () => {
  const previous = env.features.resumeScoring;
  const prevPg = env.usePostgres;
  env.features.resumeScoring = true;
  env.usePostgres = false;
  resumeStore.clearBackendForTests();
  await resumeStore._resetForTests();
  const { server, port } = await startServer();
  try {
    const token = tokenFor(ROLES.STUDENT);
    // Minimal byte payload — pdf-parse will fail to parse it, which is the
    // exact graceful path we exercise in tests (extracted text falls back
    // to "" and the route still records the upload + score).
    const res = await multipartUpload(
      port,
      "/api/v1/resumes/upload",
      token,
      "file",
      "resume.pdf",
      Buffer.from("This is plaintext masquerading as a PDF for the test."),
      "application/pdf"
    );

    assert.equal(res.status, 201);
    assert.ok(res.body?.uploadId);
    assert.equal(res.body?.studentId, "demo-user");
    assert.equal(res.body?.upload?.filename, "resume.pdf");
    assert.equal(res.body?.upload?.contentType, "application/pdf");
    assert.ok(res.body?.upload?.sizeBytes > 0);
    assert.equal(res.body?.backend, "memory");
    assert.equal(res.body?.score?.modelVersion, "rs-v0.1.0");
    assert.ok(typeof res.body?.score?.finalScore === "number");

    const stored = await resumeStore.getUpload(res.body.uploadId);
    assert.equal(stored.uploadId, res.body.uploadId);
    assert.equal(stored.studentId, "demo-user");

    const del = await httpRequest(port, `/api/v1/resumes/${res.body.uploadId}`, {
      method: "DELETE",
      token
    });
    assert.equal(del.status, 204);
    assert.equal(await resumeStore.getUpload(res.body.uploadId), null);
  } finally {
    env.features.resumeScoring = previous;
    env.usePostgres = prevPg;
    resumeStore.clearBackendForTests();
    await resumeStore._resetForTests();
    await stopServer(server);
  }
});

test("DELETE /resumes/:id returns 404 when the upload does not exist", async () => {
  const { server, port } = await startServer();
  try {
    const token = tokenFor(ROLES.STUDENT);
    const id = crypto.randomUUID();
    const del = await httpRequest(port, `/api/v1/resumes/${id}`, { method: "DELETE", token });
    assert.equal(del.status, 404);
  } finally {
    await stopServer(server);
  }
});

test("POST /resumes/upload rejects non-multipart bodies with 400", async () => {
  const previous = env.features.resumeScoring;
  env.features.resumeScoring = true;
  const { server, port } = await startServer();
  try {
    const token = tokenFor(ROLES.STUDENT);
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const result = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          method: "POST",
          host: "127.0.0.1",
          port,
          path: "/api/v1/resumes/upload",
          headers
        },
        (res) => {
          let raw = "";
          res.on("data", (chunk) => (raw += chunk));
          res.on("end", () => resolve({ status: res.statusCode, raw }));
        }
      );
      req.on("error", reject);
      req.write(JSON.stringify({ no: "file" }));
      req.end();
    });
    assert.ok(result.status === 400 || result.status === 415, `got ${result.status}`);
  } finally {
    env.features.resumeScoring = previous;
    await stopServer(server);
  }
});

test("inferSkills picks up tokens from extracted text", () => {
  const { inferSkills } = require("../modules/resumes/upload");
  const text = "Built with React and Node.js. Used Postgres.";
  const skills = inferSkills(text);
  assert.ok(skills.includes("react"));
  assert.ok(skills.includes("node.js"));
  assert.ok(skills.includes("postgres"));
});
