const ROLES = {
  STUDENT: "STUDENT",
  FACULTY: "FACULTY",
  ADMIN: "ADMIN",
  RECRUITER: "RECRUITER",
  TPO: "TPO",
  COMPANY: "COMPANY"
};

function normalizeRoles(value = []) {
  return Array.from(new Set(value.map((role) => String(role).toUpperCase())));
}

module.exports = {
  ROLES,
  normalizeRoles
};

