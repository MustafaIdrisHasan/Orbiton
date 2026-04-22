import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getProfileData,
  getRoleLabel,
  isFieldEditable,
  PROFILE_SECTIONS,
  profileSectionLabels
} from "../../shared/data/accountData";
import { useAuth } from "../../app/providers/AuthProvider";

function InfoSection({ fields, isEditing, onEdit, onCancel, onSave, draftValues, onFieldChange }) {
  return (
    <article className="dashboard-card tab-panel">
      <div className="section-heading">
        <div>
          <h2>Your Info</h2>
          <p className="subtle">Static by default. Contact fields become editable when edit mode is enabled.</p>
        </div>
        <div className="actions">
          {isEditing ? (
            <>
              <button className="button button-secondary" type="button" onClick={onCancel}>
                Cancel
              </button>
              <button className="button" type="button" onClick={onSave}>
                Save
              </button>
            </>
          ) : (
            <button className="button" type="button" onClick={onEdit}>
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="info-grid">
        {fields.map((field) => {
          const editable = isFieldEditable(field);
          return (
            <div className="info-row" key={field.label}>
              <span className="metric-label">{field.label}</span>
              {isEditing && editable ? (
                <input
                  className="profile-input"
                  type={field.label.includes("Email") ? "email" : "text"}
                  value={draftValues[field.label] ?? ""}
                  onChange={(event) => onFieldChange(field.label, event.target.value)}
                />
              ) : (
                <strong>{draftValues[field.label]}</strong>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function SecuritySection({ security }) {
  return (
    <article className="dashboard-card tab-panel">
      <div className="section-heading">
        <h2>Security</h2>
      </div>
      <div className="detail-list">
        <button className="button section-action" type="button">
          {security.primaryAction}
        </button>
        <button className="button button-secondary section-action" type="button">
          {security.secondaryAction}
        </button>
        <p className="card-note">{security.helperText}</p>
      </div>
    </article>
  );
}

function PrivacySection({ privacy, checked, onToggle }) {
  return (
    <article className="dashboard-card tab-panel">
      <div className="section-heading">
        <h2>Privacy</h2>
      </div>
      <label className="toggle-card">
        <input checked={checked} type="checkbox" onChange={(event) => onToggle(event.target.checked)} />
        <div>
          <strong>{privacy.label}</strong>
          <p className="card-note">{privacy.description}</p>
        </div>
      </label>
    </article>
  );
}

function NotificationSection({ notifications, selectedEmail, onEmailChange, paused, onPauseChange }) {
  return (
    <article className="dashboard-card tab-panel">
      <div className="section-heading">
        <h2>Notification Settings</h2>
      </div>
      <div className="detail-list">
        <label className="settings-field">
          <span className="metric-label">Default notifications email</span>
          <select className="profile-input" value={selectedEmail} onChange={(event) => onEmailChange(event.target.value)}>
            {notifications.emailOptions.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>
        </label>

        <label className="toggle-card">
          <input checked={paused} type="checkbox" onChange={(event) => onPauseChange(event.target.checked)} />
          <div>
            <strong>Pause all Notifications</strong>
            <p className="card-note">Temporarily stop all app and email notifications without choosing a timeframe.</p>
          </div>
        </label>
      </div>
    </article>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const role = user?.roles?.[0] || "STUDENT";
  const profile = getProfileData(role);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = searchParams.get("section") || PROFILE_SECTIONS.INFO;
  const [activeSection, setActiveSection] = useState(initialSection);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [draftFields, setDraftFields] = useState(() =>
    Object.fromEntries(profile.info.map((field) => [field.label, field.value]))
  );
  const [isPrivate, setIsPrivate] = useState(profile.privacy.checked);
  const [selectedEmail, setSelectedEmail] = useState(profile.notifications.defaultEmail);
  const [notificationsPaused, setNotificationsPaused] = useState(profile.notifications.paused);

  useEffect(() => {
    const section = searchParams.get("section");
    if (section && Object.values(PROFILE_SECTIONS).includes(section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  useEffect(() => {
    setDraftFields(Object.fromEntries(profile.info.map((field) => [field.label, field.value])));
    setIsPrivate(profile.privacy.checked);
    setSelectedEmail(profile.notifications.defaultEmail);
    setNotificationsPaused(profile.notifications.paused);
    setIsEditingInfo(false);
  }, [role, profile]);

  const sectionOrder = useMemo(
    () => [
      PROFILE_SECTIONS.INFO,
      PROFILE_SECTIONS.SECURITY,
      PROFILE_SECTIONS.PRIVACY,
      PROFILE_SECTIONS.NOTIFICATIONS
    ],
    []
  );

  function openSection(section) {
    setActiveSection(section);
    setSearchParams({ section });
  }

  function renderSection() {
    switch (activeSection) {
      case PROFILE_SECTIONS.SECURITY:
        return <SecuritySection security={profile.security} />;
      case PROFILE_SECTIONS.PRIVACY:
        return <PrivacySection privacy={profile.privacy} checked={isPrivate} onToggle={setIsPrivate} />;
      case PROFILE_SECTIONS.NOTIFICATIONS:
        return (
          <NotificationSection
            notifications={profile.notifications}
            selectedEmail={selectedEmail}
            onEmailChange={setSelectedEmail}
            paused={notificationsPaused}
            onPauseChange={setNotificationsPaused}
          />
        );
      case PROFILE_SECTIONS.INFO:
      default:
        return (
          <InfoSection
            fields={profile.info}
            isEditing={isEditingInfo}
            onEdit={() => setIsEditingInfo(true)}
            onCancel={() => {
              setDraftFields(Object.fromEntries(profile.info.map((field) => [field.label, field.value])));
              setIsEditingInfo(false);
            }}
            onSave={() => setIsEditingInfo(false)}
            draftValues={draftFields}
            onFieldChange={(label, value) => setDraftFields((current) => ({ ...current, [label]: value }))}
          />
        );
    }
  }

  return (
    <section className="dashboard-stack">
      <section className="hero-banner compact-hero">
        <div>
          <p className="eyebrow">Account Workspace</p>
          <h1 className="hero-title">Profile & Settings</h1>
          <p className="subtle">Single-route account management for {getRoleLabel(role).toLowerCase()} users.</p>
        </div>
      </section>

      <section className="profile-overview">
        <div className="profile-summary">
          <div className="avatar-shell">{user?.email?.slice(0, 1)?.toUpperCase() || "O"}</div>
          <div>
            <h2>{user?.email}</h2>
            <p className="subtle">{getRoleLabel(role)}</p>
          </div>
        </div>
        <div className="pill-row">
          {profile.summary.map((item) => (
            <span className="soft-pill" key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="profile-workspace">
        <aside className="tab-column">
          {sectionOrder.map((section) => (
            <button
              key={section}
              className={section === activeSection ? "tab-button active" : "tab-button"}
              type="button"
              onClick={() => openSection(section)}
            >
              {profileSectionLabels[section]}
            </button>
          ))}
        </aside>

        {renderSection()}
      </section>
    </section>
  );
}
