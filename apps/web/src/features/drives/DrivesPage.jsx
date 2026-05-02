import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { fetchDrivesList, fetchFeaturedDrivesList } from "../../shared/api/drives";
import { applyToDriveRequest, fetchStudentProfileMe } from "../../shared/api/student";
import { fetchMatchingDrives } from "../../shared/api/matching";
import {
  CLOSING_SOON_DAYS,
  DRIVES_LIST_POLL_MS,
  eligibilityTier,
  normalizeListingDrive,
  skillsAlignWithProfile
} from "../../shared/drives/discovery";

const PAGE_SIZE = 6;

const EMPLOYMENT_LABEL = {
  FULL_TIME: "Full-time",
  INTERNSHIP: "Internship"
};

function formatDeadline(iso) {
  if (!iso) {
    return "—";
  }
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return String(iso);
  }
}

function DriveDiscoveryCard({ drive, tier, role, onApply, applyBusyId, matchPercent }) {
  const busy = applyBusyId === drive.id;
  const tierClass =
    tier === "eligible" ? "eligibility-eligible" : tier === "borderline" ? "eligibility-borderline" : tier === "ineligible" ? "eligibility-ineligible" : "eligibility-neutral";

  const canApply = role === "STUDENT" && drive.displayStatus !== "Closed" && tier !== "ineligible";

  return (
    <article className={`dashboard-card drive-discovery-card ${tierClass}`}>
      <div className="drive-discovery-card__top">
        <p className="eyebrow">{drive.companyName}</p>
        <h3>{drive.roleTitle}</h3>
        {matchPercent != null ? (
          <span className="drive-discovery-card__match-badge" title="Cosine similarity vs your profile">
            {matchPercent}% match
          </span>
        ) : null}
      </div>
      <div className="drive-discovery-card__mid">
        <p className="muted">
          <strong>Departments:</strong> {drive.eligibleDepartments?.length ? drive.eligibleDepartments.join(", ") : "All"}
        </p>
        <p className="drive-discovery-card__package">{drive.packageLpa != null ? `${drive.packageLpa} LPA` : "Package TBD"}</p>
        <p className="muted">{drive.location}</p>
        <p className="muted">{EMPLOYMENT_LABEL[drive.employmentType] || drive.employmentType}</p>
      </div>
      <div className="drive-discovery-card__deadline">
        <span className={`drive-status-badge drive-status-badge--${drive.displayStatus.replace(/\s+/g, "-").toLowerCase()}`}>
          {drive.displayStatus}
        </span>
        <span className="muted">Deadline: {formatDeadline(drive.deadlineAt)}</span>
      </div>
      <div className="drive-discovery-card__snapshot muted">
        <span>Min CGPA {drive.minCgpa ?? "—"}</span>
        <span>Max backlogs {drive.maxBacklogs ?? "—"}</span>
        <span>{drive.eligibleYears?.length ? drive.eligibleYears.join(", ") : "—"}</span>
      </div>
      <div className="drive-discovery-card__actions">
        <Link className="button" to={`/drives/${drive.id}`}>
          View details
        </Link>
        {canApply ? (
          <button type="button" className="button button-secondary" disabled={busy} onClick={() => onApply(drive.id)}>
            {busy ? "Applying…" : "Apply"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function DrivesPage() {
  const { user } = useAuth();
  const role = user?.roles?.[0];

  const [rawList, setRawList] = useState([]);
  const [featuredRaw, setFeaturedRaw] = useState([]);
  const [profile, setProfile] = useState(/** @type {object|null} */ (null));
  const [matchByDriveId, setMatchByDriveId] = useState(/** @type {Record<string, number>} */ ({}));
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [error, setError] = useState(/** @type {string|null} */ (null));
  const [applyBusyId, setApplyBusyId] = useState(/** @type {string|null} */ (null));
  const [toast, setToast] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [minCgpaFilter, setMinCgpaFilter] = useState("");
  const [packageMin, setPackageMin] = useState("");
  const [packageMax, setPackageMax] = useState("");
  const [employmentType, setEmploymentType] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("latest");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState("");
  const [skillsFilter, setSkillsFilter] = useState("");
  /** When on, hide drives whose required skills are not fully covered by the student's profile skills. */
  const [skillFitOnly, setSkillFitOnly] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (options = {}) => {
    const silent = Boolean(options.silent);
    if (silent) {
      setListRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
    }
    try {
      const [list, feat] = await Promise.all([fetchDrivesList(), fetchFeaturedDrivesList()]);
      setRawList(list);
      setFeaturedRaw(feat);
      if (role === "STUDENT") {
        try {
          const me = await fetchStudentProfileMe();
          setProfile(me || null);
        } catch {
          setProfile(null);
        }
        try {
          const match = await fetchMatchingDrives();
          if (match && Array.isArray(match.items)) {
            const map = {};
            for (const item of match.items) {
              if (item?.driveId != null && item?.matchPercent != null) {
                map[item.driveId] = item.matchPercent;
              }
            }
            setMatchByDriveId(map);
          } else {
            setMatchByDriveId({});
          }
        } catch {
          setMatchByDriveId({});
        }
      } else {
        setProfile(null);
        setMatchByDriveId({});
      }
    } catch (e) {
      if (!silent) {
        setError(e?.message || "Could not load drives");
        setRawList([]);
        setFeaturedRaw([]);
      }
    } finally {
      if (silent) {
        setListRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [role]);

  useEffect(() => {
    load({ silent: false });
  }, [load]);

  useEffect(() => {
    const refresh = () => load({ silent: true });
    const intervalId = window.setInterval(refresh, DRIVES_LIST_POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  const drives = useMemo(() => rawList.map((r) => normalizeListingDrive(r)), [rawList]);
  const featuredDrives = useMemo(() => {
    let list = featuredRaw.map((r) => normalizeListingDrive(r));
    if (role === "STUDENT" && skillFitOnly && profile?.skills?.length) {
      list = list.filter((d) => skillsAlignWithProfile(profile, d));
    }
    return list;
  }, [featuredRaw, role, skillFitOnly, profile]);

  const departmentOptions = useMemo(() => {
    const set = new Set();
    drives.forEach((d) => d.eligibleDepartments?.forEach((x) => set.add(x)));
    return ["All", ...Array.from(set).sort()];
  }, [drives]);

  const stats = useMemo(() => {
    const active = drives.filter((d) => d.displayStatus === "Open" || d.displayStatus === "Closing soon").length;
    const closingSoon = drives.filter((d) => d.displayStatus === "Closing soon").length;
    return { active, closingSoon };
  }, [drives]);

  const filtered = useMemo(() => {
    let list = [...drives];

    if (debouncedSearch) {
      list = list.filter((d) => `${d.companyName} ${d.roleTitle}`.toLowerCase().includes(debouncedSearch));
    }

    if (department !== "All") {
      list = list.filter((d) => !d.eligibleDepartments?.length || d.eligibleDepartments.includes(department));
    }

    if (minCgpaFilter !== "") {
      const v = Number(minCgpaFilter);
      list = list.filter((d) => d.minCgpa == null || d.minCgpa <= v);
    }

    if (packageMin !== "") {
      const v = Number(packageMin);
      list = list.filter((d) => d.packageLpa != null && d.packageLpa >= v);
    }

    if (packageMax !== "") {
      const v = Number(packageMax);
      list = list.filter((d) => d.packageLpa != null && d.packageLpa <= v);
    }

    if (employmentType !== "All") {
      list = list.filter((d) => d.employmentType === employmentType);
    }

    if (statusFilter !== "All") {
      list = list.filter((d) => d.displayStatus === statusFilter);
    }

    if (locationFilter.trim()) {
      const q = locationFilter.trim().toLowerCase();
      list = list.filter((d) => d.location?.toLowerCase().includes(q));
    }

    if (skillsFilter.trim()) {
      const parts = skillsFilter
        .toLowerCase()
        .split(/[,\s]+/)
        .filter(Boolean);
      list = list.filter((d) => {
        const skills = (d.requiredSkills || []).map((s) => s.toLowerCase());
        return parts.some((p) => skills.some((s) => s.includes(p)));
      });
    }

    if (role === "STUDENT" && skillFitOnly && profile?.skills?.length) {
      list = list.filter((d) => skillsAlignWithProfile(profile, d));
    }

    if (sortBy === "latest") {
      list.sort((a, b) => String(b.deadlineAt).localeCompare(String(a.deadlineAt)));
    } else if (sortBy === "package") {
      list.sort((a, b) => (b.packageLpa || 0) - (a.packageLpa || 0));
    } else if (sortBy === "deadline") {
      list.sort((a, b) => String(a.deadlineAt).localeCompare(String(b.deadlineAt)));
    }

    return list;
  }, [
    drives,
    debouncedSearch,
    department,
    minCgpaFilter,
    packageMin,
    packageMax,
    employmentType,
    statusFilter,
    locationFilter,
    skillsFilter,
    skillFitOnly,
    role,
    profile,
    sortBy
  ]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filtered.length, search, department, statusFilter, sortBy]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  async function handleApply(driveId) {
    setApplyBusyId(driveId);
    setToast("");
    try {
      await applyToDriveRequest(driveId);
      setToast("Application submitted.");
    } catch (e) {
      setToast(e?.message || "Apply failed.");
    } finally {
      setApplyBusyId(null);
    }
  }

  return (
    <section className="dashboard-stack drives-discovery">
      <section className="hero-banner drives-discovery-hero">
        <div>
          <p className="eyebrow">Placements</p>
          <h1 className="hero-title">Drive Discovery</h1>
          <p className="subtle">Browse, filter, and apply to placement opportunities.</p>
          {toast ? <p className="eyebrow">{toast}</p> : null}
        </div>
        <div className="drives-discovery-hero__stats">
          <article className="dashboard-card drives-stat-card">
            <span className="metric-label">Total active drives</span>
            <strong>{stats.active}</strong>
            <p className="card-note">Open + closing within {CLOSING_SOON_DAYS} days</p>
          </article>
          <article className="dashboard-card drives-stat-card">
            <span className="metric-label">Closing soon</span>
            <strong>{stats.closingSoon}</strong>
            <p className="card-note">Deadline window per status rules</p>
          </article>
        </div>
      </section>

      <div className="drives-discovery-filters">
        <label>
          Search
          <input type="search" placeholder="Role or company" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label>
          Department
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            {departmentOptions.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label>
          Min CGPA (you meet)
          <input type="number" step="0.1" min="0" placeholder="e.g. 8" value={minCgpaFilter} onChange={(e) => setMinCgpaFilter(e.target.value)} />
        </label>
        <label>
          Package min (LPA)
          <input type="number" step="0.25" value={packageMin} onChange={(e) => setPackageMin(e.target.value)} />
        </label>
        <label>
          Package max (LPA)
          <input type="number" step="0.25" value={packageMax} onChange={(e) => setPackageMax(e.target.value)} />
        </label>
        <label>
          Employment type
          <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
            <option>All</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            <option>Open</option>
            <option>Closing soon</option>
            <option>Closed</option>
          </select>
        </label>
        <label>
          Sort
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="latest">Latest deadline</option>
            <option value="package">Highest package</option>
            <option value="deadline">Deadline (soonest)</option>
          </select>
        </label>
        <button type="button" className="button button-secondary" onClick={() => setAdvancedOpen((o) => !o)}>
          {advancedOpen ? "Hide advanced" : "Advanced filters"}
        </button>
      </div>

      {advancedOpen ? (
        <div className="drives-discovery-filters drives-discovery-filters--advanced">
          <label>
            Location
            <input type="text" placeholder="City or Remote" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
          </label>
          <label>
            Skills (any match)
            <input type="text" placeholder="e.g. React, SQL" value={skillsFilter} onChange={(e) => setSkillsFilter(e.target.value)} />
          </label>
        </div>
      ) : null}

      {role === "STUDENT" && !profile && !loading ? (
        <p className="subtle">Sign in as a student and load your profile to see eligibility highlights on cards.</p>
      ) : null}

      {role === "STUDENT" && profile?.skills?.length ? (
        <label className="drives-skill-fit-toggle subtle">
          <input type="checkbox" checked={skillFitOnly} onChange={(e) => setSkillFitOnly(e.target.checked)} />
          <span>Show only drives that match my listed skills (hide roles that need skills I have not added)</span>
        </label>
      ) : null}

      {featuredDrives.length > 0 ? (
        <section className="dashboard-section">
          <div className="section-heading">
            <h2>Featured drives</h2>
            <span className="subtle">High package, featured, or urgent timelines</span>
          </div>
          <div className="carousel-row drives-featured-strip">
            {featuredDrives.map((d) => (
              <DriveDiscoveryCard
                key={d.id}
                drive={d}
                tier={eligibilityTier(profile, d)}
                role={role}
                onApply={handleApply}
                applyBusyId={applyBusyId}
                matchPercent={matchByDriveId[d.id] ?? null}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>All drives</h2>
          <span className="subtle">
            {loading ? "Loading…" : `${filtered.length} match your filters`}
            {!loading && listRefreshing ? " · Updating…" : null}
            {!loading && !listRefreshing ? (
              <span className="drives-live-hint" title="List refreshes every 20s and when you return to this tab">
                {" "}
                · Live
              </span>
            ) : null}
          </span>
        </div>
        {error ? <p className="card-note">{error}</p> : null}
        {!loading && filtered.length === 0 ? (
          <div className="dashboard-card drives-empty">
            <h3>No drives found</h3>
            <p className="subtle">Try clearing filters or widening package and department criteria.</p>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setSearch("");
                setDepartment("All");
                setMinCgpaFilter("");
                setPackageMin("");
                setPackageMax("");
                setEmploymentType("All");
                setStatusFilter("All");
                setLocationFilter("");
                setSkillsFilter("");
              }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            <div className="drives-grid drives-discovery-grid">
              {visible.map((d) => (
                <DriveDiscoveryCard
                  key={d.id}
                  drive={d}
                  tier={eligibilityTier(profile, d)}
                  role={role}
                  onApply={handleApply}
                  applyBusyId={applyBusyId}
                  matchPercent={matchByDriveId[d.id] ?? null}
                />
              ))}
            </div>
            {filtered.length > visible.length ? (
              <button type="button" className="button button-secondary drives-load-more" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Load more
              </button>
            ) : null}
          </>
        )}
      </section>
    </section>
  );
}
