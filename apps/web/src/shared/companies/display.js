/**
 * @param {string|undefined} name
 * @param {string|undefined} [fallback="?"]
 */
export function companyInitials(name, fallback = "?") {
  if (!name || !String(name).trim()) {
    return fallback;
  }
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * @param {string|undefined} status API hiringStatus: ACTIVE | PAST | INACTIVE
 * @returns {string}
 */
export function hiringStatusDisplayLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "ACTIVE") {
    return "Hiring now";
  }
  if (s === "PAST") {
    return "Recently visited";
  }
  return "Inactive";
}

/**
 * BEM-style modifier for `.companies-card__status--*`
 * @param {string|undefined} status
 */
export function hiringStatusCssModifier(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active" || s === "past" || s === "inactive") {
    return s;
  }
  return "inactive";
}

/**
 * @param {object} raw Company summary from API
 */
export function normalizeCompanyListItem(raw) {
  return {
    id: raw.id,
    name: raw.name,
    industry: raw.industry ?? null,
    description: raw.description ?? null,
    website: raw.website ?? null,
    logoUrl: raw.logoUrl ?? null,
    highestPackage: raw.highestPackage != null ? Number(raw.highestPackage) : null,
    avgPackage: raw.avgPackage != null ? Number(raw.avgPackage) : null,
    totalDrives: raw.totalDrives ?? 0,
    activeDrivesCount: raw.activeDrivesCount ?? 0,
    departmentsHired: Array.isArray(raw.departmentsHired) ? raw.departmentsHired : [],
    rolesOffered: Array.isArray(raw.rolesOffered) ? raw.rolesOffered : [],
    hiringStatus: raw.hiringStatus,
    lastActivityAt: raw.lastActivityAt ?? null,
    selectionRatio: raw.selectionRatio ?? null,
    displayHiring: hiringStatusDisplayLabel(raw.hiringStatus)
  };
}

/**
 * Client-side featured strip: prioritize active hiring and high packages.
 * @param {ReturnType<typeof normalizeCompanyListItem>[]} list
 * @param {number} [n=3]
 */
export function selectFeaturedCompanies(list, n = 3) {
  if (!list.length) {
    return [];
  }
  const sorted = [...list].sort((a, b) => {
    if (b.activeDrivesCount !== a.activeDrivesCount) {
      return b.activeDrivesCount - a.activeDrivesCount;
    }
    const hp = (c) => c.highestPackage ?? 0;
    return hp(b) - hp(a);
  });
  return sorted.slice(0, n);
}

/**
 * @param {object} raw
 */
export function normalizeCompanyDetail(raw) {
  const base = normalizeCompanyListItem(raw);
  return {
    ...base,
    designation: raw.designation ?? null,
    activeDrives: Array.isArray(raw.activeDrives) ? raw.activeDrives : [],
    pastDrives: Array.isArray(raw.pastDrives) ? raw.pastDrives : []
  };
}
