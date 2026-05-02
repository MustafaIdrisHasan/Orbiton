import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { getDrawerMenu, getRoleLabel } from "../../shared/data/accountData";
import { fetchNotifications } from "../../shared/api/notifications";
import { normalizeNotificationItem } from "../../shared/notifications/normalize";

const NOTIFICATIONS_POLL_MS = 20_000;

const navItems = [
  ["Placements", "/drives"],
  ["Companies", "/companies"]
];

function BellIcon() {
  return (
    <svg aria-hidden="true" className="icon-svg" viewBox="0 0 24 24">
      <path
        d="M12 3a4 4 0 0 0-4 4v2.2c0 .9-.3 1.8-.9 2.5L5.9 13a1.5 1.5 0 0 0 1.1 2.5h10a1.5 1.5 0 0 0 1.1-2.5l-1.2-1.3a3.8 3.8 0 0 1-.9-2.5V7a4 4 0 0 0-4-4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M10 18a2.2 2.2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" className="icon-svg" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5.5 18.2a6.7 6.7 0 0 1 13 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function IconButton({ label, children, onClick }) {
  return (
    <button className="icon-button" aria-label={label} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function AccountDrawer({ isOpen, onClose, user, onLogout }) {
  const navigate = useNavigate();
  const role = user?.roles?.[0];
  const menuItems = useMemo(() => getDrawerMenu(role), [role]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const displayName = user?.email?.split("@")[0] || "User";

  return (
    <>
      <button aria-label="Close account drawer" className="drawer-backdrop" onClick={onClose} type="button" />
      <aside className="account-drawer" aria-label="Account drawer">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Account</p>
            <h2>{displayName}</h2>
            <p className="subtle">{getRoleLabel(role)}</p>
          </div>
          <button className="drawer-close" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="drawer-menu">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={item.tone === "danger" ? "drawer-link danger" : "drawer-link"}
              type="button"
              onClick={() => {
                if (item.action === "logout") {
                  onLogout();
                  onClose();
                  return;
                }

                navigate(item.to);
                onClose();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(/** @type {number | null} */ (null));
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.email) {
      setUnreadNotifCount(0);
      return undefined;
    }
    let cancelled = false;
    async function tick() {
      try {
        const data = await fetchNotifications();
        const list = Array.isArray(data?.items) ? data.items : [];
        const n = list
          .map((raw) => normalizeNotificationItem(raw))
          .filter((item) => !item.isRead).length;
        if (!cancelled) {
          setUnreadNotifCount(n);
        }
      } catch {
        if (!cancelled) {
          setUnreadNotifCount((c) => (c == null ? 0 : c));
        }
      }
    }
    tick();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        tick();
      }
    }, NOTIFICATIONS_POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user?.email]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-slot">
          <div className="brand-mark">O</div>
          <div>
            <strong>Orbiton</strong>
            <p className="subtle">Placement Management System</p>
          </div>
        </div>

        <div className="topbar-center" aria-hidden="true" />

        <div className="topbar-actions">
          <nav className="topbar-nav" aria-label="Primary">
            {navItems.map(([label, to]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => (isActive ? "topbar-link active" : "topbar-link")}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <IconButton label="Notifications" onClick={() => navigate("/notifications")}>
            {unreadNotifCount != null && unreadNotifCount > 0 ? (
              <span className="icon-badge">{unreadNotifCount > 99 ? "99+" : unreadNotifCount}</span>
            ) : null}
            <BellIcon />
          </IconButton>

          <div className="profile-chip">
            <IconButton label="Profile" onClick={() => setIsDrawerOpen(true)}>
              <UserIcon />
            </IconButton>
            <div className="profile-meta">
              <strong>{user?.email?.split("@")[0] || "User"}</strong>
              <span>{getRoleLabel(user?.roles?.[0])}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <AccountDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        onLogout={() => {
          logout();
          navigate("/auth/login");
        }}
      />
    </div>
  );
}
