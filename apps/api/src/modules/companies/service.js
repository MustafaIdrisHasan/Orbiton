const { recruiterStore } = require("../recruiters/mockData");

function getDrivesForRecruiter(recruiterId) {
  return (recruiterStore.drives || []).filter((d) => d.recruiterId === recruiterId);
}

function isDriveOpen(d) {
  const st = String(d.status || "").toUpperCase();
  if (st === "CLOSED" || st === "CANCELLED") {
    return false;
  }
  if (d.applicationDeadline) {
    if (new Date(d.applicationDeadline).getTime() <= Date.now()) {
      return false;
    }
  }
  return st === "ACTIVE" || st === "OPEN" || st === "PUBLISHED";
}

function buildCompanySummary(rec) {
  const drives = getDrivesForRecruiter(rec.id);
  const packages = drives
    .map((d) => d.packageLpa)
    .filter((n) => n != null && !Number.isNaN(Number(n)));
  const activeDrives = drives.filter(isDriveOpen);
  const highestPackage = packages.length ? Math.max(...packages) : null;
  const avgPackage = packages.length
    ? Math.round((packages.reduce((a, b) => a + b, 0) / packages.length) * 10) / 10
    : null;
  const depts = new Set();
  for (const d of drives) {
    (d.eligibleDepartments || []).forEach((x) => depts.add(x));
  }
  const rolesOffered = [...new Set(drives.map((d) => d.title).filter(Boolean))];
  const deadlines = drives.map((d) => d.applicationDeadline).filter(Boolean);
  const maxDeadline = deadlines.length
    ? deadlines.reduce((a, b) => (new Date(a) > new Date(b) ? a : b))
    : null;
  const lastFromDrives = maxDeadline ? new Date(maxDeadline).toISOString() : null;
  const lastVisit = rec.lastVisitAt ? new Date(rec.lastVisitAt).toISOString() : null;
  let lastActivityAt = null;
  if (lastFromDrives && lastVisit) {
    lastActivityAt =
      new Date(lastFromDrives) > new Date(lastVisit) ? lastFromDrives : lastVisit;
  } else {
    lastActivityAt = lastFromDrives || lastVisit;
  }

  let hiringStatus;
  if (activeDrives.length > 0) {
    hiringStatus = "ACTIVE";
  } else if (drives.length > 0) {
    hiringStatus = "PAST";
  } else {
    hiringStatus = "INACTIVE";
  }

  return {
    id: rec.id,
    name: rec.companyName,
    industry: rec.industry || null,
    description: rec.description || null,
    website: rec.website || null,
    logoUrl: rec.logoUrl ?? null,
    highestPackage,
    avgPackage,
    totalDrives: drives.length,
    activeDrivesCount: activeDrives.length,
    departmentsHired: [...depts].sort(),
    rolesOffered,
    hiringStatus,
    lastActivityAt,
    selectionRatio: null
  };
}

function mapDriveRow(d) {
  return {
    id: d.id,
    title: d.title,
    status: d.status,
    applicationDeadline: d.applicationDeadline,
    packageLpa: d.packageLpa,
    location: d.location,
    openings: d.openings
  };
}

function listCompanies() {
  const recs = recruiterStore.allRecruiters && recruiterStore.allRecruiters.length
    ? recruiterStore.allRecruiters
    : [recruiterStore.recruiter];
  return recs.map(buildCompanySummary);
}

function getCompanyById(id) {
  const recs = recruiterStore.allRecruiters && recruiterStore.allRecruiters.length
    ? recruiterStore.allRecruiters
    : [recruiterStore.recruiter];
  const rec = recs.find((r) => r.id === id);
  if (!rec) {
    return null;
  }
  const base = buildCompanySummary(rec);
  const drives = getDrivesForRecruiter(id);
  const activeDrives = drives.filter(isDriveOpen).map(mapDriveRow);
  const pastDrives = drives.filter((d) => !isDriveOpen(d)).map(mapDriveRow);
  return {
    ...base,
    designation: rec.designation,
    activeDrives,
    pastDrives
  };
}

module.exports = {
  listCompanies,
  getCompanyById
};
