const { ApiError } = require("../errors/ApiError");
const { normalizeRoles } = require("../constants/roles");

function requireRoles(...allowedRoles) {
  const normalizedAllowed = normalizeRoles(allowedRoles);

  return function roleMiddleware(req, _res, next) {
    const userRoles = normalizeRoles(req.user?.roles || []);
    const permitted = userRoles.some((role) => normalizedAllowed.includes(role));

    if (!permitted) {
      next(new ApiError(403, "AUTH_FORBIDDEN", "You do not have permission to access this resource"));
      return;
    }

    next();
  };
}

module.exports = {
  requireRoles
};

