const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");

const { env } = require("../config/env");
const { app } = require("../app");
const { ROLES } = require("../core/constants/roles");
const resumeStore = require("../modules/resumes/store");
const { cosine, dot, norm } = require("../modules/matching/similarity");
const { getVocabulary, _resetForTests: resetVocab } = require("../modules/matching/vocabulary");
const { encodeStudent, encodeDrive, topContributingDimensions } = require("../modules/matching/encoder");
const { skillsAlignForRecommendation } = require("../modules/matching/skillGate");

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

function request(port, path, { method = "GET", token } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const req = http.request({ method, host: "127.0.0.1", port, path, headers }, (res) => {
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
    });
    req.on("error", reject);
    req.end();
  });
}

function tokenFor(role) {
  return jwt.sign({ userId: "demo-user", role, roles: [role] }, env.jwtSecret, {
    expiresIn: "1h"
  });
}

test("cosine of identical non-zero vectors is 1 (within FP tolerance)", () => {
  assert.ok(Math.abs(cosine([1, 0, 1], [1, 0, 1]) - 1) < 1e-12);
});

test("cosine of orthogonal vectors is 0", () => {
  assert.equal(cosine([1, 0], [0, 1]), 0);
});

test("cosine handles zero-norm safely (returns 0, no NaN)", () => {
  const result = cosine([0, 0, 0], [1, 1, 1]);
  assert.equal(result, 0);
  assert.equal(Number.isNaN(result), false);
});

test("cosine handles empty arrays without crashing", () => {
  assert.equal(cosine([], []), 0);
  assert.equal(cosine([1, 2], []), 0);
});

test("dot and norm primitives behave as expected", () => {
  assert.equal(dot([1, 2, 3], [4, 5, 6]), 32);
  assert.equal(norm([3, 4]), 5);
});

test("encodeStudent and encodeDrive produce same-length vectors of expected dim", () => {
  resetVocab();
  const vocab = getVocabulary();
  const sv = encodeStudent({ skills: ["React"], education: { branch: "CSE" } }, vocab);
  const dv = encodeDrive({ requiredSkills: ["React"], eligibleDepartments: ["CSE"] }, vocab);
  assert.equal(sv.length, dv.length);
  assert.equal(sv.length, vocab.dim());
  assert.ok(sv.length > 0);
});

test("a student fully aligned with a drive scores highest", () => {
  resetVocab();
  const vocab = getVocabulary();
  const aligned = encodeStudent(
    { skills: ["React", "Node.js", "SQL"], education: { branch: "CSE" } },
    vocab
  );
  const unaligned = encodeStudent(
    { skills: ["Java"], education: { branch: "MECH" } },
    vocab
  );
  const drive = encodeDrive(
    { requiredSkills: ["React", "Node.js", "SQL"], eligibleDepartments: ["CSE"] },
    vocab
  );
  assert.ok(cosine(aligned, drive) > cosine(unaligned, drive));
});

test("skillsAlignForRecommendation requires every drive required skill on student profile", () => {
  const dockerProfile = { skills: ["Docker", "Kubernetes"] };
  const reactDrive = { requiredSkills: ["React", "Node.js"] };
  const dockerDrive = { requiredSkills: ["Docker"] };
  assert.equal(skillsAlignForRecommendation(dockerProfile, reactDrive), false);
  assert.equal(skillsAlignForRecommendation(dockerProfile, dockerDrive), true);
  assert.equal(skillsAlignForRecommendation(dockerProfile, { requiredSkills: [] }), true);
});

test("topContributingDimensions returns intersected skills", () => {
  resetVocab();
  const vocab = getVocabulary();
  const sv = encodeStudent({ skills: ["React", "SQL"], education: { branch: "CSE" } }, vocab);
  const dv = encodeDrive(
    { requiredSkills: ["React", "Node.js"], eligibleDepartments: ["CSE"] },
    vocab
  );
  const top = topContributingDimensions(sv, dv, vocab);
  assert.ok(top.includes("react"));
  assert.equal(top.includes("node.js"), false);
});

test("matching routes 404 when ENABLE_MATCHING is off", async () => {
  const previous = env.features.matching;
  const prevPg = env.usePostgres;
  const prevVec = env.features.usePgvectorMatching;
  env.usePostgres = false;
  env.features.usePgvectorMatching = false;
  resumeStore.clearBackendForTests();
  env.features.matching = false;
  const { server, port } = await startServer();
  try {
    const drives = await request(port, "/api/v1/matching/drives", {
      token: tokenFor(ROLES.STUDENT)
    });
    assert.equal(drives.status, 404);
    const students = await request(
      port,
      "/api/v1/matching/students?driveId=drive-northstar-ase",
      { token: tokenFor(ROLES.TPO) }
    );
    assert.equal(students.status, 404);
  } finally {
    env.features.matching = previous;
    env.usePostgres = prevPg;
    env.features.usePgvectorMatching = prevVec;
    resumeStore.clearBackendForTests();
    await stopServer(server);
  }
});

test("matching routes return ranked items when ENABLE_MATCHING is on", async () => {
  const previous = env.features.matching;
  const prevPg = env.usePostgres;
  const prevVec = env.features.usePgvectorMatching;
  env.usePostgres = false;
  env.features.usePgvectorMatching = false;
  resumeStore.clearBackendForTests();
  env.features.matching = true;
  const { server, port } = await startServer();
  try {
    const drives = await request(port, "/api/v1/matching/drives", {
      token: tokenFor(ROLES.STUDENT)
    });
    assert.equal(drives.status, 200);
    assert.equal(typeof drives.body?.vocabularyVersion, "string");
    assert.ok(Array.isArray(drives.body?.items));
    if (drives.body.items.length > 1) {
      const sims = drives.body.items.map((i) => i.similarity);
      for (let i = 1; i < sims.length; i += 1) {
        assert.ok(sims[i - 1] >= sims[i], "items should be ranked by descending similarity");
      }
      const sample = drives.body.items[0];
      assert.equal(typeof sample.matchPercent, "number");
      assert.ok(Array.isArray(sample.topContributingDimensions));
    }

    const students = await request(
      port,
      "/api/v1/matching/students?driveId=drive-northstar-ase",
      { token: tokenFor(ROLES.TPO) }
    );
    assert.equal(students.status, 200);
    assert.ok(Array.isArray(students.body?.items));

    const missingDrive = await request(
      port,
      "/api/v1/matching/students?driveId=nonexistent-id",
      { token: tokenFor(ROLES.TPO) }
    );
    assert.equal(missingDrive.status, 404);

    const studentForbidden = await request(
      port,
      "/api/v1/matching/students?driveId=drive-northstar-ase",
      { token: tokenFor(ROLES.STUDENT) }
    );
    assert.equal(studentForbidden.status, 403);
  } finally {
    env.features.matching = previous;
    env.usePostgres = prevPg;
    env.features.usePgvectorMatching = prevVec;
    resumeStore.clearBackendForTests();
    await stopServer(server);
  }
});
