// In-memory store for COMPANY-role users' self-managed profile (company
// name, contact details). Keyed by the user's PG userId (JWT `userId`).
//
// Kept in-process for parity with the rest of the demo data (drives,
// applications) which all live in `recruiterStore`. Resets on restart.
//
// Each profile shape:
//   { userId, email, companyName, designation, industry, description,
//     website, updatedAt }

const profilesByUserId = new Map();

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function getProfile(userId) {
  if (!userId) return null;
  return profilesByUserId.get(userId) || null;
}

function upsertProfile(userId, payload = {}) {
  if (!userId) return null;
  const current = profilesByUserId.get(userId) || {};
  const next = {
    userId,
    email: payload.email || current.email || "",
    companyName: payload.companyName ?? current.companyName ?? "",
    designation: payload.designation ?? current.designation ?? "",
    industry: payload.industry ?? current.industry ?? "",
    description: payload.description ?? current.description ?? "",
    website: payload.website ?? current.website ?? "",
    updatedAt: new Date().toISOString()
  };
  profilesByUserId.set(userId, next);
  return next;
}

/**
 * Return all COMPANY-user profiles whose set companyName matches the given
 * drive company name. Match is case-insensitive on trimmed strings.
 *
 * @param {string} companyName
 * @returns {Array<{userId:string, companyName:string}>}
 */
function findUserIdsByCompanyName(companyName) {
  const target = normalizeName(companyName);
  if (!target) return [];
  const out = [];
  for (const profile of profilesByUserId.values()) {
    if (normalizeName(profile.companyName) === target) {
      out.push({ userId: profile.userId, companyName: profile.companyName });
    }
  }
  return out;
}

function listProfiles() {
  return Array.from(profilesByUserId.values());
}

module.exports = {
  getProfile,
  upsertProfile,
  findUserIdsByCompanyName,
  listProfiles
};
