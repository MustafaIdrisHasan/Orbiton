const test = require("node:test");
const assert = require("node:assert/strict");
const { createAuthService } = require("../modules/auth/auth.service");

function createRepository(user) {
  return {
    async findUserWithRolesByEmail() {
      return user;
    },
    async withTransaction(callback) {
      return callback({});
    }
  };
}

test("login succeeds with valid credentials", async () => {
  const authService = createAuthService({
    repository: createRepository({
      id: "user-1",
      email: "admin@orbiton",
      password_hash_txt: "hashed-password",
      is_active: true,
      roles: ["ADMIN"]
    }),
    bcryptLib: {
      async compare(password, hash) {
        return password === "1234" && hash === "hashed-password";
      }
    },
    jwtLib: {
      sign(payload, secret, options) {
        assert.deepEqual(payload, { userId: "user-1", role: "ADMIN", roles: ["ADMIN"] });
        assert.equal(secret, "test-secret");
        assert.equal(options.expiresIn, "1d");
        return "signed-token";
      }
    },
    jwtSecret: "test-secret"
  });

  const result = await authService.login({
    email: "admin@orbiton",
    password: "1234"
  });

  assert.deepEqual(result, { token: "signed-token" });
});

test("login rejects invalid password", async () => {
  const authService = createAuthService({
    repository: createRepository({
      id: "user-1",
      email: "admin@orbiton",
      password_hash_txt: "hashed-password",
      is_active: true,
      roles: ["ADMIN"]
    }),
    bcryptLib: {
      async compare() {
        return false;
      }
    },
    jwtLib: { sign() {} },
    jwtSecret: "test-secret"
  });

  await assert.rejects(
    authService.login({ email: "admin@orbiton", password: "wrong" }),
    (error) => error.code === "AUTH_INVALID_CREDENTIALS"
  );
});

test("login rejects non-existent user", async () => {
  const authService = createAuthService({
    repository: createRepository(null),
    bcryptLib: {
      async compare() {
        return true;
      }
    },
    jwtLib: { sign() {} },
    jwtSecret: "test-secret"
  });

  await assert.rejects(
    authService.login({ email: "missing@orbiton", password: "1234" }),
    (error) => error.code === "AUTH_INVALID_CREDENTIALS"
  );
});

test("login rejects inactive user", async () => {
  const authService = createAuthService({
    repository: createRepository({
      id: "user-2",
      email: "faculty@orbiton",
      password_hash_txt: "hashed-password",
      is_active: false,
      roles: ["FACULTY"]
    }),
    bcryptLib: {
      async compare() {
        return true;
      }
    },
    jwtLib: { sign() {} },
    jwtSecret: "test-secret"
  });

  await assert.rejects(
    authService.login({ email: "faculty@orbiton", password: "1234" }),
    (error) => error.code === "AUTH_INACTIVE_USER"
  );
});
