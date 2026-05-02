import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { fetchCompanies } from "../../shared/api/companies";
import {
  companyInitials,
  hiringStatusCssModifier,
  normalizeCompanyListItem,
  selectFeaturedCompanies
} from "../../shared/companies/display";

const PAGE_SIZE = 6;

function formatActivity(iso) {
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
    return "—";
  }
}

function CompanyCard({ company }) {
  const mod = hiringStatusCssModifier(company.hiringStatus);
  return (
    <article className="dashboard-card companies-card">
      <div className="companies-card__row">
        <div className="companies-card__mark" aria-hidden>
          {company.logoUrl ? (
            <img src={company.logoUrl} alt="" className="companies-card__logo" />
          ) : (
            <span className="companies-card__initials">{companyInitials(company.name)}</span>
          )}
        </div>
        <div className="companies-card__head">
          <p className="eyebrow">{company.industry || "Company"}</p>
          <h3>{company.name}</h3>
        </div>
        <span className={`companies-card__status companies-card__status--${mod}`}>{company.displayHiring}</span>
      </div>
      <p className="companies-card__chips muted">
        <span>
          <strong>Departments:</strong> {company.departmentsHired.length ? company.departmentsHired.join(", ") : "—"}
        </span>
        <span>
          <strong>Roles:</strong> {company.rolesOffered.length ? company.rolesOffered.slice(0, 2).join(", ") : "—"}
          {company.rolesOffered.length > 2 ? "…" : ""}
        </span>
      </p>
      <div className="companies-card__metrics">
        <span>Max: {company.highestPackage != null ? `${company.highestPackage} LPA` : "—"}</span>
        <span>Avg: {company.avgPackage != null ? `${company.avgPackage} LPA` : "—"}</span>
        <span>Last activity: {formatActivity(company.lastActivityAt)}</span>
        <span>
          Drives: {company.activeDrivesCount} open / {company.totalDrives} total
        </span>
      </div>
      <div className="companies-card__actions">
        <Link className="button" to={`/companies/${company.id}`}>
          View details
        </Link>
        <Link className="button button-secondary" to={`/companies/${company.id}#drives`}>
          View drives
        </Link>
      </div>
    </article>
  );
}

function FeaturedStripItem({ company }) {
  return (
    <article className="dashboard-card companies-featured-card">
      <div className="companies-featured-card__row">
        <div className="companies-card__mark companies-card__mark--sm" aria-hidden>
          <span className="companies-card__initials">{companyInitials(company.name)}</span>
        </div>
        <div>
          <h3 className="companies-featured-card__title">{company.name}</h3>
          <p className="muted subtle">{company.industry || "—"}</p>
        </div>
      </div>
      <p className="companies-featured-card__package">{company.highestPackage != null ? `Up to ${company.highestPackage} LPA` : "Package TBD"}</p>
      <div className="companies-card__actions">
        <Link className="button" to={`/companies/${company.id}`}>
          View company
        </Link>
        <Link className="button button-secondary" to={`/companies/${company.id}#drives`}>
          Drives
        </Link>
      </div>
    </article>
  );
}

export function CompaniesPage() {
  const { user } = useAuth();
  const role = user?.roles?.[0];

  const [rawList, setRawList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string|null} */ (null));
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [industry, setIndustry] = useState("All");
  const [hiringStatus, setHiringStatus] = useState("All");
  const [packageMin, setPackageMin] = useState("");
  const [packageMax, setPackageMax] = useState("");
  const [roleKeyword, setRoleKeyword] = useState("");
  const [department, setDepartment] = useState("All");
  const [sortBy, setSortBy] = useState("active");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchCompanies();
      setRawList(list);
    } catch (e) {
      setError(e?.message || "Could not load companies");
      setRawList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const companies = useMemo(() => rawList.map((r) => normalizeCompanyListItem(r)), [rawList]);

  const industryOptions = useMemo(() => {
    const s = new Set();
    companies.forEach((c) => {
      if (c.industry) {
        s.add(c.industry);
      }
    });
    return ["All", ...Array.from(s).sort()];
  }, [companies]);

  const departmentOptions = useMemo(() => {
    const s = new Set();
    companies.forEach((c) => c.departmentsHired.forEach((d) => s.add(d)));
    return ["All", ...Array.from(s).sort()];
  }, [companies]);

  const stats = useMemo(() => {
    const hiringNow = companies.filter((c) => c.hiringStatus === "ACTIVE").length;
    const withDrives = companies.filter((c) => c.totalDrives > 0).length;
    return {
      total: companies.length,
      hiringNow,
      withDrives
    };
  }, [companies]);

  const featured = useMemo(() => selectFeaturedCompanies(companies, 3), [companies]);

  const filtered = useMemo(() => {
    let list = [...companies];

    if (debouncedSearch) {
      list = list.filter((c) => {
        const blob = [c.name, c.industry, ...(c.rolesOffered || [])].join(" ").toLowerCase();
        return blob.includes(debouncedSearch);
      });
    }

    if (industry !== "All") {
      list = list.filter((c) => c.industry === industry);
    }

    if (hiringStatus !== "All") {
      list = list.filter((c) => c.hiringStatus === hiringStatus);
    }

    if (packageMin !== "") {
      const v = Number(packageMin);
      list = list.filter((c) => c.highestPackage != null && c.highestPackage >= v);
    }
    if (packageMax !== "") {
      const v = Number(packageMax);
      list = list.filter((c) => c.highestPackage != null && c.highestPackage <= v);
    }

    if (roleKeyword.trim()) {
      const q = roleKeyword.trim().toLowerCase();
      list = list.filter((c) => c.rolesOffered.some((r) => r.toLowerCase().includes(q)));
    }

    if (department !== "All") {
      list = list.filter((c) => c.departmentsHired.includes(department));
    }

    if (sortBy === "active") {
      list.sort((a, b) => b.activeDrivesCount - a.activeDrivesCount || (b.highestPackage || 0) - (a.highestPackage || 0));
    } else if (sortBy === "package") {
      list.sort((a, b) => (b.highestPackage || 0) - (a.highestPackage || 0));
    } else if (sortBy === "recent") {
      list.sort((a, b) => String(b.lastActivityAt || "").localeCompare(String(a.lastActivityAt || "")));
    }

    return list;
  }, [companies, debouncedSearch, industry, hiringStatus, packageMin, packageMax, roleKeyword, department, sortBy]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filtered.length, search, industry, hiringStatus, sortBy]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  return (
    <section className="dashboard-stack companies-directory">
      <section className="hero-banner companies-directory-hero">
        <div>
          <p className="eyebrow">Placements</p>
          <h1 className="hero-title">Company directory</h1>
          <p className="subtle">Explore employers connected to campus drives, packages, and hiring status.</p>
        </div>
        <div className="companies-hero__stats">
          <article className="dashboard-card companies-stat-card">
            <span className="metric-label">Total companies</span>
            <strong>{stats.total}</strong>
            <p className="card-note">Recruiter orgs on the directory</p>
          </article>
          <article className="dashboard-card companies-stat-card">
            <span className="metric-label">Hiring now</span>
            <strong>{stats.hiringNow}</strong>
            <p className="card-note">At least one open drive</p>
          </article>
          <article className="dashboard-card companies-stat-card">
            <span className="metric-label">With drive history</span>
            <strong>{stats.withDrives}</strong>
            <p className="card-note">Past or present campus drives</p>
          </article>
        </div>
      </section>

      {role ? (
        <p className="subtle">Signed in as {role}. {role === "STUDENT" ? "Open a company to apply to eligible drives from the drive list." : null}</p>
      ) : null}

      <div className="drives-discovery-filters companies-filters">
        <label>
          Search
          <input
            type="search"
            placeholder="Company, industry, or role"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Industry
          <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
            {industryOptions.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label>
          Hiring status
          <select value={hiringStatus} onChange={(e) => setHiringStatus(e.target.value)}>
            <option>All</option>
            <option value="ACTIVE">Hiring now</option>
            <option value="PAST">Recently visited</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <label>
          Department hired
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            {departmentOptions.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label>
          Role keyword
          <input type="search" placeholder="e.g. Engineer" value={roleKeyword} onChange={(e) => setRoleKeyword(e.target.value)} />
        </label>
        <label>
          Package min (LPA)
          <input type="number" step="0.5" value={packageMin} onChange={(e) => setPackageMin(e.target.value)} />
        </label>
        <label>
          Package max (LPA)
          <input type="number" step="0.5" value={packageMax} onChange={(e) => setPackageMax(e.target.value)} />
        </label>
        <label>
          Sort
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="active">Most active (open drives)</option>
            <option value="package">Highest package</option>
            <option value="recent">Recently active</option>
          </select>
        </label>
      </div>

      {featured.length > 0 ? (
        <section className="dashboard-section">
          <div className="section-heading">
            <h2>Featured</h2>
            <span className="subtle">Open drives and strong packages (client-side)</span>
          </div>
          <div className="carousel-row companies-featured-strip">
            {featured.map((c) => (
              <FeaturedStripItem key={c.id} company={c} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>All companies</h2>
          <span className="subtle">{loading ? "Loading…" : `${filtered.length} match your filters`}</span>
        </div>
        {error ? <p className="card-note">{error}</p> : null}
        {!loading && filtered.length === 0 ? (
          <div className="dashboard-card companies-empty">
            <h3>No companies found</h3>
            <p className="subtle">Try clearing filters or widening the package range.</p>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setSearch("");
                setIndustry("All");
                setHiringStatus("All");
                setPackageMin("");
                setPackageMax("");
                setRoleKeyword("");
                setDepartment("All");
                setSortBy("active");
              }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            <div className="drives-grid companies-grid">
              {visible.map((c) => (
                <CompanyCard key={c.id} company={c} />
              ))}
            </div>
            {filtered.length > visible.length ? (
              <button type="button" className="button button-secondary companies-load-more" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                Load more
              </button>
            ) : null}
          </>
        )}
      </section>
    </section>
  );
}
