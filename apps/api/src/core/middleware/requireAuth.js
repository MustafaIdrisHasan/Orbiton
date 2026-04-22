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
    const roles = normalizeRoles(decoded.roles || (decoded.role ? [decoded.role] : []));

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

