import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { deleteDrive, fetchMyDrives, patchDriveStatus } from "../../shared/api/drives";
import { ApiClientError } from "../../shared/api/client";

function formatDate(iso) {
  if (!iso) {
    return "—";
  }
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch {
    return "—";
  }
}

function statusBadgeClass(status) {
  const u = String(status || "").toUpperCase();
  if (u === "DRAFT") {
    return "my-drives-badge my-drives-badge--draft";
  }
  if (u === "PUBLISHED") {
    return "my-drives-badge my-drives-badge--published";
  }
  if (u === "CLOSED") {
    return "my-drives-badge my-drives-badge--closed";
  }
  return "my-drives-badge my-drives-badge--draft";
}

const SORT_OPTIONS = [
  { id: "created", label: "Latest created" },
  { id: "deadline", label: "Deadline" },
  { id: "applicants", label: "Most applicants" }
];

export function MyDrivesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [drives, setDrives] = useState(/** @type {Array<object>} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string|null} */ (null));
  const [kpiKey, setKpiKey] = useState(/** @type {"all"|"PUBLISHED"|"DRAFT"|"CLOSED"} */ ("all"));
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("created");
  const [expandedId, setExpandedId] = useState(/** @type {string|null} */ (null));
  const [busyId, setBusyId] = useState(/** @type {string|null} */ (null));
  const [toast, setToast] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchMyDrives();
      setDrives(Array.isArray(items) ? items : []);
    } catch (e) {
      const msg = e instanceof ApiClientError ? e.message : "Could not load your drives";
      setError(msg);
      setDrives([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const msg = location.state && typeof location.state === "object" ? location.state.toast : null;
    if (msg) {
      setToast(String(msg));
    }
  }, [location.state]);

  const kpis = useMemo(() => {
    const published = drives.filter((d) => String(d.status).toUpperCase() === "PUBLISHED").length;
    const draft = drives.filter((d) => String(d.status).toUpperCase() === "DRAFT").length;
    const closed = drives.filter((d) => String(d.status).toUpperCase() === "CLOSED").length;
    const totalApplicants = drives.reduce((acc, d) => acc + (d.applicants_count ?? 0), 0);
    return { published, draft, closed, totalApplicants };
  }, [drives]);

  const filtered = useMemo(() => {
    let list = [...drives];

    if (kpiKey !== "all") {
      list = list.filter((d) => String(d.status).toUpperCase() === kpiKey);
    }

    if (statusFilter !== "All") {
      list = list.filter((d) => String(d.status).toUpperCase() === statusFilter);
    }

    if (debouncedSearch) {
      list = list.filter((d) => String(d.title || "").toLowerCase().includes(debouncedSearch));
    }

    if (dateFrom) {
      const t = new Date(dateFrom).getTime();
      list = list.filter((d) => {
        const c = d.created_at ? new Date(d.created_at).getTime() : 0;
        return c >= t;
      });
    }
    if (dateTo) {
      const t = new Date(dateTo);
      t.setHours(23, 59, 59, 999);
      const end = t.getTime();
      list = list.filter((d) => {
        const c = d.created_at ? new Date(d.created_at).getTime() : 0;
        return c <= end;
      });
    }

    if (sortBy === "created") {
      list.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
    } else if (sortBy === "deadline") {
      list.sort((a, b) => String(a.deadline || a.applicationDeadline || "").localeCompare(String(b.deadline || b.applicationDeadline || "")));
    } else if (sortBy === "applicants") {
      list.sort((a, b) => (b.applicants_count ?? 0) - (a.applicants_count ?? 0));
    }

    return list;
  }, [drives, kpiKey, statusFilter, debouncedSearch, dateFrom, dateTo, sortBy]);

  function scrollToFilters() {
    document.getElementById("my-drives-filters")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleStatusChange(id, next) {
    setBusyId(id);
    setToast("");
    try {
      const updated = await patchDriveStatus(id, next);
      setDrives((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
      setToast("Status updated");
    } catch (e) {
      setToast(e?.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this draft drive permanently?")) {
      return;
    }
    setBusyId(id);
    setToast("");
    try {
      await deleteDrive(id);
      setDrives((prev) => prev.filter((d) => d.id !== id));
      setToast("Drive deleted");
    } catch (e) {
      setToast(e?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  const empty = !loading && filtered.length === 0;
  const noDrives = !loading && drives.length === 0;

  const heroEyebrow =
    user?.role === "TPO" ? "Placement office" : user?.role === "RECRUITER" ? "Recruiter" : "Host";

  return (
    <section className="dashboard-stack my-drives-page">
      <header className="my-drives-hero">
        <div>
          <p className="eyebrow">{heroEyebrow}</p>
          <h1 className="hero-title my-drives-hero__title">My Drives</h1>
          <p className="subtle my-drives-hero__sub">Manage and track all your placement drives</p>
        </div>
        <div className="my-drives-hero__actions">
          <button type="button" className="button button-secondary" onClick={scrollToFilters}>
            Filter drives
          </button>
          <Link className="button" to="/drives/create">
            Create new drive
          </Link>
        </div>
      </header>

      {toast ? <p className="eyebrow my-drives-toast">{toast}</p> : null}
      {error ? <p className="form-error my-drives-error">{error}</p> : null}

      <div className="my-drives-kpis">
        <button
          type="button"
          className={`dashboard-card my-drives-kpi ${kpiKey === "PUBLISHED" ? "my-drives-kpi--active" : ""}`}
          onClick={() => setKpiKey((k) => (k === "PUBLISHED" ? "all" : "PUBLISHED"))}
        >
          <span className="metric-label">Active drives</span>
          <strong>{kpis.published}</strong>
          <p className="card-note">Published (live)</p>
        </button>
        <button
          type="button"
          className={`dashboard-card my-drives-kpi ${kpiKey === "DRAFT" ? "my-drives-kpi--active" : ""}`}
          onClick={() => setKpiKey((k) => (k === "DRAFT" ? "all" : "DRAFT"))}
        >
          <span className="metric-label">Draft / pending</span>
          <strong>{kpis.draft}</strong>
          <p className="card-note">Not yet published</p>
        </button>
        <button
          type="button"
          className={`dashboard-card my-drives-kpi ${kpiKey === "CLOSED" ? "my-drives-kpi--active" : ""}`}
          onClick={() => setKpiKey((k) => (k === "CLOSED" ? "all" : "CLOSED"))}
        >
          <span className="metric-label">Closed drives</span>
          <strong>{kpis.closed}</strong>
          <p className="card-note">Hiring complete</p>
        </button>
        <button
          type="button"
          className={`dashboard-card my-drives-kpi ${kpiKey === "all" && sortBy === "applicants" ? "my-drives-kpi--active" : ""}`}
          onClick={() => {
            setKpiKey("all");
            setSortBy("applicants");
          }}
        >
          <span className="metric-label">Total applicants</span>
          <strong>{kpis.totalApplicants}</strong>
          <p className="card-note">Across all drives</p>
        </button>
      </div>

      <div id="my-drives-filters" className="filters-bar my-drives-filters">
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="CLOSED">Closed</option>
          </select>
        </label>
        <label>
          Search role
          <input type="search" placeholder="Job title" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label>
          Created from
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label>
          Created to
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <label>
          Sort
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {noDrives ? (
        <div className="dashboard-card my-drives-empty">
          <h2>No drives created yet</h2>
          <p className="subtle">Start by creating a placement drive as a draft, then publish when you are ready.</p>
          <Link className="button" to="/drives/create">
            Create new drive
          </Link>
        </div>
      ) : null}

      {!noDrives && empty ? (
        <div className="dashboard-card my-drives-empty">
          <h2>No drives match</h2>
          <p className="subtle">Adjust filters or clear KPI selection.</p>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              setKpiKey("all");
              setStatusFilter("All");
              setSearch("");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Reset filters
          </button>
        </div>
      ) : null}

      {loading ? <p className="subtle">Loading your drives…</p> : null}

      {!loading && !empty ? (
        <>
          <div className="my-drives-table-wrap">
            <table className="my-drives-table">
              <thead>
                <tr>
                  <th aria-label="Expand" className="my-drives-col--narrow" />
                  <th>Role title</th>
                  <th>Status</th>
                  <th>Applicants</th>
                  <th>Shortlisted</th>
                  <th>Selected</th>
                  <th>Deadline</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const st = String(d.status || "").toUpperCase();
                  const isOpen = expandedId === d.id;
                  const busy = busyId === d.id;
                  return (
                    <DriveTableRows
                      key={d.id}
                      d={d}
                      st={st}
                      isOpen={isOpen}
                      busy={busy}
                      onToggleExpand={() => setExpandedId((id) => (id === d.id ? null : d.id))}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="subtle my-drives-insight">
            Quick insight: {filtered.length} drive{filtered.length === 1 ? "" : "s"} in view
            {kpis.closed > 0 ? ` · ${kpis.closed} closed` : ""}.
          </p>
        </>
      ) : null}
    </section>
  );
}

function DriveTableRows({ d, st, isOpen, busy, onToggleExpand, onStatusChange, onDelete }) {
  return (
    <Fragment>
      <tr className="my-drives-table__row">
        <td>
          <button type="button" className="my-drives-expand" aria-expanded={isOpen} onClick={onToggleExpand}>
            {isOpen ? "▼" : "▶"}
          </button>
        </td>
        <td>
          <strong>{d.title}</strong>
        </td>
        <td>
          <span className={statusBadgeClass(st)}>{st || "—"}</span>
        </td>
        <td>{d.applicants_count ?? 0}</td>
        <td>{d.shortlisted_count ?? 0}</td>
        <td>{d.selected_count ?? 0}</td>
        <td>{formatDate(d.deadline || d.applicationDeadline)}</td>
        <td>{formatDate(d.created_at)}</td>
        <td className="my-drives-table__actions">
          <div className="my-drives-action-stack">
            <Link className="button button-sm" to={`/drives/${d.id}`}>
              View drive
            </Link>
            <Link className="button button-secondary button-sm" to={`/drives/create?edit=${encodeURIComponent(d.id)}`}>
              Edit
            </Link>
            <Link className="button button-secondary button-sm" to={`/dashboard?driveId=${encodeURIComponent(d.id)}`}>
              Manage applicants
            </Link>
            <label className="my-drives-status-select">
              <span className="sr-only">Change status</span>
              <select
                value={st}
                disabled={busy}
                onChange={(e) => onStatusChange(d.id, e.target.value)}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="CLOSED">Closed</option>
              </select>
            </label>
            {st === "DRAFT" ? (
              <button type="button" className="table-icon-button danger" disabled={busy} onClick={() => onDelete(d.id)} title="Delete draft">
                Del
              </button>
            ) : null}
            <div className="my-drives-row-quick">
              {st === "DRAFT" ? (
                <button type="button" className="soft-pill" disabled={busy} onClick={() => onStatusChange(d.id, "PUBLISHED")}>
                  Publish
                </button>
              ) : null}
              {st === "PUBLISHED" ? (
                <button type="button" className="soft-pill" disabled={busy} onClick={() => onStatusChange(d.id, "CLOSED")}>
                  Close drive
                </button>
              ) : null}
              {st === "CLOSED" ? (
                <button type="button" className="soft-pill" disabled={busy} onClick={() => onStatusChange(d.id, "PUBLISHED")}>
                  Reopen
                </button>
              ) : null}
            </div>
          </div>
        </td>
      </tr>
      {isOpen ? (
        <tr className="my-drives-table__detail">
          <td colSpan={9}>
            <div className="my-drives-detail-grid">
              <p>
                <span className="metric-label">Package (LPA)</span> {d.packageLpa != null ? d.packageLpa : "—"}
              </p>
              <p>
                <span className="metric-label">Departments</span> {d.eligibleDepartments?.length ? d.eligibleDepartments.join(", ") : "—"}
              </p>
              <p>
                <span className="metric-label">Employment</span> {d.employmentType || "—"}
              </p>
              <p>
                <span className="metric-label">Rounds</span> {d.rounds_count ?? 0}
              </p>
            </div>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}
