import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  applyToDriveRequest,
  updateOfferRequest,
  withdrawApplicationRequest
} from "../../shared/api/student";
import { normalizeNotificationItem } from "../../shared/notifications/normalize";
import { applicationProgressRatio, metaForApplicationStatus } from "../../shared/student/applicationStatus";
import { useStudentDashboardData } from "./hooks/useStudentDashboardData";

function formatDeadline(iso) {
  if (!iso) {
    return "—";
  }
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return String(iso);
  }
}

function DriveLogo({ name }) {
  const initials = String(name || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return <div className="drive-logo">{initials}</div>;
}

function DriveCard({ drive, variant, onApply, applyBusyId }) {
  const navigate = useNavigate();
  const busy = applyBusyId === drive.id;
  return (
    <article className={`dashboard-card drive-card student-drive-card student-drive-card--${variant}`}>
      <button type="button" className="student-drive-card__main" onClick={() => navigate(`/drives/${drive.id}`)}>
        <DriveLogo name={drive.companyName} />
        <div className="student-drive-card__body">
          <p className="eyebrow">{drive.companyName}</p>
          <h3>{drive.roleTitle}</h3>
          <p className="muted">
            {drive.packageLpa != null ? `${drive.packageLpa} LPA` : "Package TBD"} · {formatDeadline(drive.deadlineAt)}
          </p>
          <p className="muted">{drive.location}</p>
        </div>
      </button>
      <div className="student-drive-card__actions">
        <button
          className="button button-secondary"
          type="button"
          disabled={drive.status !== "Open" || busy}
          onClick={(e) => {
            e.stopPropagation();
            onApply(drive.id);
          }}
        >
          {busy ? "Applying…" : "Apply"}
        </button>
      </div>
    </article>
  );
}

function OfferDetailModal({ offer, onClose, onDecision }) {
  if (!offer) {
    return null;
  }
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel dashboard-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="offer-modal-title">Offer details</h2>
        <p className="eyebrow">{offer.companyName}</p>
        <p className="subtle">{offer.roleTitle}</p>
        <p>
          <strong>Package:</strong> {offer.packageLpa != null ? `${offer.packageLpa} LPA` : "—"}
        </p>
        <p>
          <strong>Joining:</strong> {offer.joiningDate ? formatDeadline(offer.joiningDate) : "—"}
        </p>
        <div className="modal-actions">
          <button className="button" type="button" onClick={() => onDecision("accept")}>
            Accept
          </button>
          <button className="button button-secondary" type="button" onClick={() => onDecision("reject")}>
            Reject
          </button>
          <button className="button button-secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudentDashboardPage() {
  const {
    loading,
    error,
    refresh,
    user,
    profile,
    drives,
    featuredDrives,
    recommendedDrives,
    applications,
    rounds,
    offers,
    notifications,
    stats
  } = useStudentDashboardData();

  const navigate = useNavigate();
  const drivesAnchorRef = useRef(null);
  const [filters, setFilters] = useState({
    department: "All",
    status: "All",
    packageMin: "",
    packageMax: "",
    search: ""
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [applyBusyId, setApplyBusyId] = useState(/** @type {string|null} */ (null));
  const [offerFocus, setOfferFocus] = useState(/** @type {object|null} */ (null));
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [filters.search]);

  const departments = useMemo(() => {
    const set = new Set();
    drives.forEach((d) => {
      if (d.department) {
        set.add(d.department);
      }
    });
    return ["All", ...Array.from(set).sort()];
  }, [drives]);

  const filteredGridDrives = useMemo(() => {
    return [...drives]
      .filter((d) => filters.department === "All" || d.department === filters.department)
      .filter((d) => filters.status === "All" || d.status === filters.status)
      .filter((d) => {
        if (!filters.packageMin) {
          return true;
        }
        return d.packageLpa != null && d.packageLpa >= Number(filters.packageMin);
      })
      .filter((d) => {
        if (!filters.packageMax) {
          return true;
        }
        return d.packageLpa != null && d.packageLpa <= Number(filters.packageMax);
      })
      .filter((d) => {
        if (!debouncedSearch) {
          return true;
        }
        const hay = `${d.companyName} ${d.roleTitle} ${d.location}`.toLowerCase();
        return hay.includes(debouncedSearch);
      })
      .sort((a, b) => String(a.deadlineAt).localeCompare(String(b.deadlineAt)));
  }, [drives, debouncedSearch, filters]);

  async function handleApply(driveId) {
    setApplyBusyId(driveId);
    setActionMessage("");
    try {
      await applyToDriveRequest(driveId);
      setActionMessage("Application submitted successfully.");
      await refresh();
    } catch (e) {
      setActionMessage(e?.message || "Could not apply. Try again from the drive page.");
    } finally {
      setApplyBusyId(null);
    }
  }

  async function handleWithdraw(appId) {
    if (!window.confirm("Withdraw this application?")) {
      return;
    }
    setActionMessage("");
    try {
      await withdrawApplicationRequest(appId);
      setActionMessage("Application withdrawn.");
      await refresh();
    } catch (e) {
      setActionMessage(e?.message || "Withdraw is not available for this application.");
    }
  }

  async function handleOfferDecision(decision) {
    if (!offerFocus) {
      return;
    }
    try {
      await updateOfferRequest(offerFocus.id, { decision });
      setActionMessage(decision === "accept" ? "Offer accepted." : "Offer declined.");
      setOfferFocus(null);
      await refresh();
    } catch (e) {
      setActionMessage(e?.message || "Could not update offer. The request may still be processing.");
      setOfferFocus(null);
    }
  }

  const displayName = user?.email?.split("@")[0] || "Student";
  const rejected = applications.filter((a) => a.status === "REJECTED").length;
  const wins = applications.filter((a) => a.status === "OFFERED" || a.status === "SELECTED").length;
  const successRate = applications.length ? Math.round((wins / applications.length) * 100) : 0;
  const readiness = Math.min(
    100,
    Math.round((profile.profileCompletionPercent || 0) * 0.75 + (profile.resumeUploaded ? 25 : 0))
  );

  if (loading && !applications.length) {
    return (
      <section className="dashboard-stack">
        <p className="subtle">Loading your placement dashboard…</p>
      </section>
    );
  }

  return (
    <section className="dashboard-stack student-dashboard">
      {error ? <p className="card-note">{error}</p> : null}
      {actionMessage ? <p className="eyebrow">{actionMessage}</p> : null}

      <section className="hero-banner student-hero">
        <div className="student-hero__left">
          <p className="eyebrow">Student Portal</p>
          <h1 className="hero-title">Hello, {displayName}</h1>
          <p className="subtle">
            Your placement journey: strengthen your profile, apply to drives, track every round, and respond to offers — all in
            one place.
          </p>
        </div>
        <div className="student-hero__right">
          <Link className="button" to="/profile?section=info">
            Complete Profile
          </Link>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => drivesAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            Browse Drives
          </button>
        </div>
        <div className="student-stat-chips">
          <article className="dashboard-card student-stat-chip">
            <span className="metric-label">Eligible drives</span>
            <strong>{stats.eligibleDrives}</strong>
          </article>
          <article className="dashboard-card student-stat-chip">
            <span className="metric-label">Applications submitted</span>
            <strong>{stats.applicationsSubmitted}</strong>
          </article>
          <article className="dashboard-card student-stat-chip">
            <span className="metric-label">Offers received</span>
            <strong>{stats.offersReceived}</strong>
          </article>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>Featured drives</h2>
          <span className="subtle">High-visibility and time-sensitive opportunities</span>
        </div>
        <div className="carousel-row">
          {featuredDrives.map((d) => (
            <DriveCard key={d.id} drive={d} variant="featured" onApply={handleApply} applyBusyId={applyBusyId} />
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>Recommended for you</h2>
          <span className="subtle">Based on your profile skills (overlap with each drive&apos;s requirements), department, and CGPA</span>
        </div>
        <div className="drives-grid student-rec-grid">
          {recommendedDrives.map((d) => (
            <DriveCard key={`rec-${d.id}`} drive={d} variant="recommended" onApply={handleApply} applyBusyId={applyBusyId} />
          ))}
        </div>
      </section>

      <section className="dashboard-section" id="all-drives" ref={drivesAnchorRef}>
        <div className="section-heading">
          <h2>All drives</h2>
          <span className="subtle">Explore every open role and apply when you are ready</span>
        </div>
        <div className="filters-bar student-filters">
          <label>
            Search
            <input
              type="search"
              placeholder="Role or company"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </label>
          <label>
            Department
            <select value={filters.department} onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}>
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              <option>All</option>
              <option>Open</option>
              <option>Closed</option>
            </select>
          </label>
          <label>
            Package min (LPA)
            <input
              type="number"
              min="0"
              step="0.25"
              value={filters.packageMin}
              onChange={(e) => setFilters((f) => ({ ...f, packageMin: e.target.value }))}
            />
          </label>
          <label>
            Package max (LPA)
            <input
              type="number"
              min="0"
              step="0.25"
              value={filters.packageMax}
              onChange={(e) => setFilters((f) => ({ ...f, packageMax: e.target.value }))}
            />
          </label>
          <button
            type="button"
            className="button button-secondary"
            onClick={() =>
              setFilters({ department: "All", status: "All", packageMin: "", packageMax: "", search: "" })
            }
          >
            Clear filters
          </button>
        </div>
        {filteredGridDrives.length === 0 ? (
          <p className="subtle">No drives match these filters.</p>
        ) : (
          <div className="drives-grid">
            {filteredGridDrives.map((d) => (
              <DriveCard key={d.id} drive={d} variant="grid" onApply={handleApply} applyBusyId={applyBusyId} />
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>My applications</h2>
          <span className="subtle">Track status and open details for each pipeline</span>
        </div>
        <div className="student-app-table" role="table">
          <div className="student-app-row student-app-row--head" role="row">
            <span role="columnheader">Role / company</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Progress</span>
            <span role="columnheader">Actions</span>
          </div>
          {applications.map((app) => {
            const meta = metaForApplicationStatus(app.status);
            const pct = Math.round(applicationProgressRatio(app.status) * 100);
            return (
              <div className="student-app-row" role="row" key={app.id}>
                <button type="button" className="student-app-cell student-app-cell--link" onClick={() => navigate(`/student/applications/${app.id}`)}>
                  <strong>{app.roleTitle}</strong>
                  <span className="muted">{app.companyName}</span>
                </button>
                <span className={`status-chip ${meta.chipClass}`} role="cell">
                  {meta.label}
                </span>
                <div className="student-progress" role="cell">
                  <div className="student-progress__bar">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <span className="muted">{pct}%</span>
                </div>
                <div className="student-app-actions" role="cell">
                  <button type="button" className="button button-secondary" onClick={() => navigate(`/student/applications/${app.id}`)}>
                    View details
                  </button>
                  {app.withdrawable ? (
                    <button type="button" className="button button-secondary" onClick={() => handleWithdraw(app.id)}>
                      Withdraw
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>Upcoming rounds</h2>
          <span className="subtle">Stay ahead of interviews and assessments</span>
        </div>
        <div className="rounds-list">
          {rounds.map((round) => (
            <article className="dashboard-card round-card" key={round.id}>
              <h3>{round.roundName}</h3>
              <p className="eyebrow">
                {round.companyName} · {round.roleTitle}
              </p>
              <div className="round-meta">
                <span>{formatDeadline(round.dateTime)}</span>
                <span>{round.mode}</span>
              </div>
              <p className="card-note">{round.locationOrLink}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>Offers</h2>
          <span className="subtle">Decide on packages and joining timelines</span>
        </div>
        <div className="drives-grid student-offers-grid">
          {offers
            .filter((o) => o.status === "OFFERED")
            .map((offer) => (
              <article className="dashboard-card" key={offer.id}>
                <p className="eyebrow">{offer.companyName}</p>
                <h3>{offer.roleTitle}</h3>
                <p>{offer.packageLpa != null ? `${offer.packageLpa} LPA` : "Package —"}</p>
                <p className="muted">Joining: {offer.joiningDate ? formatDeadline(offer.joiningDate) : "—"}</p>
                <div className="student-app-actions">
                  <button type="button" className="button" onClick={() => setOfferFocus(offer)}>
                    Review offer
                  </button>
                </div>
              </article>
            ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>Profile and resume</h2>
        </div>
        <article className="dashboard-card student-readiness-card">
          <p>
            <strong>Profile completion:</strong> {profile.profileCompletionPercent ?? 0}%
          </p>
          <p>
            <strong>Resume uploaded:</strong> {profile.resumeUploaded ? "Yes" : "No"}
          </p>
          <p className="muted">Resume score: {profile.resumeScore != null ? profile.resumeScore : "Coming soon"}</p>
          <div className="student-app-actions">
            <Link className="button" to="/profile?section=info">
              Complete profile
            </Link>
            <Link className="button button-secondary" to="/resumes">
              Upload resume
            </Link>
          </div>
        </article>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>Notifications</h2>
          <Link className="subtle" to="/notifications">
            View all
          </Link>
        </div>
        <ul className="student-notifications">
          {notifications.slice(0, 8).map((raw) => {
            const n = normalizeNotificationItem(raw);
            return (
              <li key={n.id} className="dashboard-card student-notification-item">
                <p className="eyebrow">{n.title}</p>
                <p className="card-note">{n.message}</p>
                <span className="muted">{n.sentAt ? formatDeadline(n.sentAt) : ""}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h2>Placement analytics</h2>
          <span className="subtle">Lightweight signals to calibrate your effort</span>
        </div>
        <div className="overview-grid three-columns">
          <article className="dashboard-card">
            <span className="metric-label">Application success rate</span>
            <strong>{successRate}%</strong>
            <p className="card-note">
              {wins} positive outcomes vs {rejected} rejections across {applications.length} tracked applications.
            </p>
          </article>
          <article className="dashboard-card">
            <span className="metric-label">Readiness score</span>
            <strong>{readiness}</strong>
            <p className="card-note">Blends profile completion with resume presence.</p>
          </article>
          <article className="dashboard-card">
            <span className="metric-label">Skill gaps (heuristic)</span>
            <p className="card-note">
              Compare your skills ({(profile.skills || []).slice(0, 3).join(", ") || "—"}) with tags on eligible drives and close gaps
              via projects or coursework.
            </p>
          </article>
        </div>
      </section>

      <OfferDetailModal
        offer={offerFocus}
        onClose={() => setOfferFocus(null)}
        onDecision={(d) => handleOfferDecision(d)}
      />
    </section>
  );
}
