const jwt = require("jsonwebtoken");
const { env } = require("../../config/env");
const { ApiError } = require("../errors/ApiError");
const { normalizeRoles } = require("../constants/roles");

function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    next(new ApiError(401, "AUTH_REQUIRED", "Authentication required"));
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    // `[]` is truthy in JS — empty roles must not hide a valid `role` claim (breaks /drives?created_by=me vs /auth/me).
    let rawRoles = decoded.roles;
    if (typeof rawRoles === "string" && rawRoles.trim()) {
      rawRoles = [rawRoles];
    }
    if (!Array.isArray(rawRoles) || rawRoles.length === 0) {
      rawRoles = decoded.role ? [decoded.role] : [];
    }
    const roles = normalizeRoles(rawRoles);

    req.user = {
      ...decoded,
      id: decoded.userId || decoded.id || null,
      userId: decoded.userId || decoded.id || null,
      role: roles[0] || decoded.role || null,
      roles
    };
    next();
  } catch (_error) {
    next(new ApiError(401, "AUTH_INVALID_TOKEN", "Invalid or expired token"));
  }
}

module.exports = {
  requireAuth
};

