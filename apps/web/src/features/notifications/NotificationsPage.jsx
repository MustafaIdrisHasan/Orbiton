import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../../shared/api/notifications";
import { applyToDriveRequest, updateOfferRequest } from "../../shared/api/student";
import { normalizeNotificationItem } from "../../shared/notifications/normalize";
import { resolveNotificationTarget } from "../../shared/notifications/routes";

const PAGE_SIZE = 6;
/** Poll so a TPO and student in two browsers see new items without a full refresh. */
const NOTIFICATIONS_POLL_MS = 20_000;

const TYPE_ICONS = {
  APPLICATION: "📄",
  SHORTLIST: "🎯",
  ROUND: "🧪",
  OFFER: "💼",
  DRIVE: "📋",
  ANNOUNCEMENT: "📢"
};

const FILTER_TABS = [
  { id: "ALL", label: "All" },
  { id: "UNREAD", label: "Unread" },
  { id: "APPLICATION", label: "Applications" },
  { id: "SHORTLIST", label: "Shortlist" },
  { id: "ROUND", label: "Rounds" },
  { id: "OFFER", label: "Offers" },
  { id: "DRIVE", label: "Drives" },
  { id: "ANNOUNCEMENT", label: "Announcements" }
];

function formatRelativeTime(iso) {
  if (!iso) {
    return "";
  }
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) {
    return "";
  }
  const sec = Math.round((Date.now() - t) / 1000);
  if (sec < 45) {
    return "just now";
  }
  if (sec < 3600) {
    const m = Math.floor(sec / 60);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (sec < 86400) {
    const h = Math.floor(sec / 3600);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  const d = Math.floor(sec / 86400);
  if (d < 14) {
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }
  return new Date(iso).toLocaleDateString();
}

function OfferQuickModal({ offerId, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function handle(decision) {
    setBusy(true);
    setMsg("");
    try {
      await updateOfferRequest(offerId, { decision });
      setMsg(decision === "accept" ? "Offer accepted." : "Offer declined.");
      onDone();
    } catch (e) {
      setMsg(e?.message || "Could not update offer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-panel dashboard-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2>Respond to offer</h2>
        <p className="subtle">Offer ID: {offerId}</p>
        {msg ? <p className="eyebrow">{msg}</p> : null}
        <div className="modal-actions">
          <button type="button" className="button" disabled={busy} onClick={() => handle("accept")}>
            Accept
          </button>
          <button type="button" className="button button-secondary" disabled={busy} onClick={() => handle("reject")}>
            Reject
          </button>
          <button type="button" className="button button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.roles?.[0];

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string|null} */ (null));
  const [filterTab, setFilterTab] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("newest");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [offerModalId, setOfferModalId] = useState(/** @type {string|null} */ (null));
  const [actionMessage, setActionMessage] = useState("");

  const normalized = useMemo(() => items.map((raw) => normalizeNotificationItem(raw)), [items]);

  const unreadCount = useMemo(() => normalized.filter((n) => !n.isRead).length, [normalized]);

  const load = useCallback(async (opts = {}) => {
    const silent = Boolean(opts.silent);
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await fetchNotifications();
      const list = Array.isArray(data?.items) ? data.items : [];
      setItems(list);
      setError(null);
    } catch (e) {
      if (!silent) {
        setError(e?.message || "Failed to load notifications");
        setItems([]);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        load({ silent: true });
      }
    }, NOTIFICATIONS_POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") {
        load({ silent: true });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filterTab, sortOrder, search]);

  const filteredSorted = useMemo(() => {
    let list = [...normalized];

    if (filterTab === "UNREAD") {
      list = list.filter((n) => !n.isRead);
    } else if (filterTab !== "ALL") {
      list = list.filter((n) => n.type === filterTab);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((n) => `${n.title} ${n.message}`.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      const ta = new Date(a.sentAt || 0).getTime();
      const tb = new Date(b.sentAt || 0).getTime();
      return sortOrder === "newest" ? tb - ta : ta - tb;
    });

    return list;
  }, [normalized, filterTab, search, sortOrder]);

  const visible = useMemo(() => filteredSorted.slice(0, visibleCount), [filteredSorted, visibleCount]);

  const sourceCounts = useMemo(() => {
    const acc = { STUDENT: 0, RECRUITER: 0, INSTITUTION: 0 };
    normalized.forEach((n) => {
      const s = n.source && acc[n.source] !== undefined ? n.source : "INSTITUTION";
      acc[s] += 1;
    });
    return acc;
  }, [normalized]);

  const typeCounts = useMemo(() => {
    const acc = { APPLICATION: 0, SHORTLIST: 0, ROUND: 0, OFFER: 0, DRIVE: 0, ANNOUNCEMENT: 0 };
    normalized.forEach((n) => {
      if (acc[n.type] !== undefined) {
        acc[n.type] += 1;
      }
    });
    return acc;
  }, [normalized]);

  async function patchLocalRead(id) {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, isRead: true } : row)));
  }

  async function handleOpenNotification(n) {
    if (!n.isRead) {
      try {
        await markNotificationRead(n.id);
        await patchLocalRead(n.id);
      } catch {
        patchLocalRead(n.id);
      }
    }

    const target = resolveNotificationTarget(role, n.type, n.entityId, n.driveId);
    if (target.kind === "navigate") {
      navigate(target.to);
    } else if (target.kind === "offer") {
      setOfferModalId(target.offerId);
    }
  }

  async function handleMarkAllRead() {
    setActionMessage("");
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((row) => ({ ...row, isRead: true })));
      setActionMessage("All notifications marked as read.");
    } catch (e) {
      setActionMessage(e?.message || "Could not mark all as read.");
    }
  }

  async function handleApplyDrive(driveId, e) {
    e.stopPropagation();
    setActionMessage("");
    try {
      await applyToDriveRequest(driveId);
      setActionMessage("Application submitted.");
    } catch (err) {
      setActionMessage(err?.message || "Apply failed. Open the drive for details.");
    }
  }

  return (
    <section className="dashboard-stack notifications-page">
      <section className="hero-banner notifications-hero">
        <div>
          <p className="eyebrow">Orbiton workspace</p>
          <h1 className="hero-title">Notifications</h1>
          <p className="subtle">Track placement updates, application status, rounds, and offers.</p>
          {actionMessage ? <p className="eyebrow">{actionMessage}</p> : null}
        </div>
        <div className="notifications-hero__actions">
          <button type="button" className="button" onClick={handleMarkAllRead} disabled={loading || unreadCount === 0}>
            Mark all as read
          </button>
        </div>
      </section>

      <div className="notifications-layout">
        <div className="notifications-main">
          <div className="notifications-controls">
            <div className="notifications-tabs" role="tablist" aria-label="Notification filters">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={filterTab === tab.id}
                  className={`notifications-tab ${filterTab === tab.id ? "is-active" : ""}`}
                  onClick={() => setFilterTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="notifications-controls__row">
              <label className="notifications-sort">
                Sort
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                  <option value="newest">Latest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
              <label className="notifications-search">
                Search
                <input
                  type="search"
                  placeholder="Company or role"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>
          </div>

          {loading ? <p className="subtle">Loading notifications…</p> : null}
          {error ? <p className="card-note">{error}</p> : null}

          {!loading && filteredSorted.length === 0 ? (
            <div className="dashboard-card notifications-empty">
              <h2>No notifications yet</h2>
              <p className="subtle">Browse drives to get started.</p>
              <Link className="button" to="/drives">
                Browse drives
              </Link>
            </div>
          ) : (
            <ul className="notifications-feed">
              {visible.map((n) => {
                const icon = TYPE_ICONS[n.type] || "📌";
                return (
                  <li key={n.id}>
                    <article
                      className={`dashboard-card notifications-card ${n.isRead ? "is-read" : "is-unread"}`}
                      onClick={() => handleOpenNotification(n)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleOpenNotification(n);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="notifications-card__icon" aria-hidden="true">
                        {icon}
                      </div>
                      <div className="notifications-card__body">
                        <h3>{n.title}</h3>
                        <p className="notifications-card__message">{n.message}</p>
                        <p className="notifications-card__time muted">{formatRelativeTime(n.sentAt)}</p>
                        <div className="notifications-card__actions" onClick={(e) => e.stopPropagation()}>
                          {role === "STUDENT" && n.type === "OFFER" && n.entityId ? (
                            <>
                              <button type="button" className="button button-secondary" onClick={() => setOfferModalId(n.entityId)}>
                                Accept / Reject
                              </button>
                            </>
                          ) : null}
                          {role === "STUDENT" && n.type === "ROUND" && (n.driveId || n.entityId) ? (
                            <button
                              type="button"
                              className="button button-secondary"
                              onClick={() =>
                                navigate(`/drives/${n.driveId || n.entityId}`)
                              }
                            >
                              View details
                            </button>
                          ) : null}
                          {role === "STUDENT" && n.type === "DRIVE" && (n.entityId || n.driveId) ? (
                            <button
                              type="button"
                              className="button button-secondary"
                              onClick={(e) => handleApplyDrive(n.entityId || n.driveId, e)}
                            >
                              Apply
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="notifications-card__status">
                        <span className={n.isRead ? "notifications-pill is-muted" : "notifications-pill is-live"}>
                          {n.isRead ? "Read" : "Unread"}
                        </span>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}

          {!loading && filteredSorted.length > visible.length ? (
            <button type="button" className="button button-secondary notifications-load-more" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
              Load more
            </button>
          ) : null}
        </div>

        <aside className="notifications-aside">
          <article className="dashboard-card">
            <h3>Summary</h3>
            <p>
              <span className="metric-label">Unread</span>
              <strong>{unreadCount}</strong>
            </p>
            <p>
              <span className="metric-label">Total</span>
              <strong>{normalized.length}</strong>
            </p>
          </article>
          <article className="dashboard-card">
            <h3>Sources</h3>
            <ul className="notifications-aside-list">
              <li>
                <span>Student</span>
                <strong>{sourceCounts.STUDENT}</strong>
              </li>
              <li>
                <span>Recruiter</span>
                <strong>{sourceCounts.RECRUITER}</strong>
              </li>
              <li>
                <span>Admin / TPO</span>
                <strong>{sourceCounts.INSTITUTION}</strong>
              </li>
            </ul>
          </article>
          <article className="dashboard-card">
            <h3>Recent activity breakdown</h3>
            <ul className="notifications-aside-list">
              <li>
                <span>Applications</span>
                <strong>{typeCounts.APPLICATION}</strong>
              </li>
              <li>
                <span>Rounds</span>
                <strong>{typeCounts.ROUND}</strong>
              </li>
              <li>
                <span>Offers</span>
                <strong>{typeCounts.OFFER}</strong>
              </li>
            </ul>
          </article>
        </aside>
      </div>

      {offerModalId ? (
        <OfferQuickModal
          offerId={offerModalId}
          onClose={() => setOfferModalId(null)}
          onDone={() => {
            setOfferModalId(null);
            load();
          }}
        />
      ) : null}
    </section>
  );
}
