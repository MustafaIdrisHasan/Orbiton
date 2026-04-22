const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { env } = require("../../config/env");
const { ApiError } = require("../../core/errors/ApiError");
const { ROLES, normalizeRoles } = require("../../core/constants/roles");
const authRepository = require("./auth.repository");

const DEFAULT_USERS = [
  { email: "admin@orbiton", role: ROLES.ADMIN, phoneNumber: "+91 90000 00001" },
  { email: "faculty@orbiton", role: ROLES.FACULTY, phoneNumber: "+91 90000 00002" },
  { email: "recruiter@orbiton", role: ROLES.RECRUITER, phoneNumber: "+91 90000 00003" },
  { email: "student@orbiton", role: ROLES.STUDENT, phoneNumber: "+91 90000 00004" },
  { email: "tpo@orbiton", role: ROLES.TPO, phoneNumber: "+91 90000 00005" }
];

function createAuthService({
  repository = authRepository,
  bcryptLib = bcrypt,
  jwtLib = jwt,
  jwtSecret = env.jwtSecret
} = {}) {
  return {
    async login(payload = {}) {
      const email = String(payload.email || "").trim();
      const password = String(payload.password || "");

      if (!email || !password) {
        throw new ApiError(400, "AUTH_VALIDATION_ERROR", "Email and password are required");
      }

      const user = await repository.findUserWithRolesByEmail(email);

      if (!user) {
        throw new ApiError(401, "AUTH_INVALID_CREDENTIALS", "Invalid email or password");
      }

      if (!user.is_active) {
        throw new ApiError(403, "AUTH_INACTIVE_USER", "User account is inactive");
      }

      const passwordMatches = await bcryptLib.compare(password, user.password_hash_txt);

      if (!passwordMatches) {
        throw new ApiError(401, "AUTH_INVALID_CREDENTIALS", "Invalid email or password");
      }

      const roles = normalizeRoles(user.roles || []);
      const role = roles[0];

      if (!role) {
        throw new ApiError(403, "AUTH_ROLE_UNASSIGNED", "User does not have an assigned role");
      }

      const token = jwtLib.sign(
        {
          userId: user.id,
          role
        },
        jwtSecret,
        { expiresIn: "1d" }
      );

      return {
        token
      };
    },

    async getCurrentUser(userId) {
      const normalizedUserId = String(userId || "").trim();
      if (!normalizedUserId) {
        throw new ApiError(401, "AUTH_INVALID_SESSION", "Missing authenticated user");
      }

      const user = await repository.findUserWithRolesById(normalizedUserId);
      if (!user || !user.is_active) {
        throw new ApiError(401, "AUTH_INVALID_SESSION", "Authenticated user is not available");
      }

      const roles = normalizeRoles(user.roles || []);
      const role = roles[0];

      if (!role) {
        throw new ApiError(403, "AUTH_ROLE_UNASSIGNED", "User does not have an assigned role");
      }

      return {
        userId: user.id,
        email: user.email,
        role,
        roles: [role]
      };
    },

    async requestReset(payload = {}) {
      const email = String(payload.email || "").trim();

      if (!email) {
        throw new ApiError(400, "AUTH_VALIDATION_ERROR", "Email is required");
      }

      return {
        message: "Password reset request accepted"
      };
    },

    async resetPassword(payload = {}) {
      const token = String(payload.token || "").trim();
      const newPassword = String(payload.newPassword || "").trim();

      if (!token || !newPassword) {
        throw new ApiError(400, "AUTH_VALIDATION_ERROR", "Token and new password are required");
      }

      return {
        message: "Password reset placeholder completed"
      };
    },

    async seedDefaultUsers() {
      const roleNames = Object.values(ROLES);

      return repository.withTransaction(async (client) => {
        await repository.ensureRoles(roleNames, client);

        const seededUsers = [];
        for (const defaultUser of DEFAULT_USERS) {
          const passwordHash = await bcryptLib.hash("1234", 10);
          const user = await repository.upsertUser(
            {
              email: defaultUser.email,
              passwordHash,
              phoneNumber: defaultUser.phoneNumber,
              isActive: true
            },
            client
          );
          await repository.assignRoleToUser(user.id, defaultUser.role, client);
          seededUsers.push({
            id: user.id,
            email: user.email,
            role: defaultUser.role
          });
        }

        return {
          seededUsers
        };
      });
    }
  };
}

const authService = createAuthService();

module.exports = {
  DEFAULT_USERS,
  createAuthService,
  authService
};
