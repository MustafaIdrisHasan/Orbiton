import { useMemo, useState } from "react";
import { recruiterDashboardData } from "./recruiterData";

export function RecruiterCommunicationsPage() {
  const [driveId, setDriveId] = useState(recruiterDashboardData.drives[0].id);
  const [audience, setAudience] = useState("All applicants");
  const [message, setMessage] = useState("");

  const driveMessages = useMemo(
    () => recruiterDashboardData.broadcasts.filter((broadcast) => broadcast.driveId === driveId),
    [driveId]
  );

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Recruiter Operations</p>
          <h2>Communications</h2>
          <p className="muted">Broadcast updates by drive and keep recent applicant communications in one place.</p>
        </div>
      </header>

      <section className="dashboard-section">
        <div className="detail-grid">
          <label className="settings-field">
            Drive
            <select value={driveId} onChange={(event) => setDriveId(event.target.value)}>
              {recruiterDashboardData.drives.map((drive) => (
                <option key={drive.id} value={drive.id}>
                  {drive.title}
                </option>
              ))}
            </select>
          </label>
          <label className="settings-field">
            Audience
            <select value={audience} onChange={(event) => setAudience(event.target.value)}>
              <option>All applicants</option>
              <option>Shortlisted candidates</option>
              <option>Interview candidates</option>
              <option>Selected candidates</option>
            </select>
          </label>
        </div>

        <label className="settings-field">
          Broadcast Draft
          <textarea
            className="profile-input recruiter-textarea"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Draft an update for the selected applicant audience."
          />
        </label>

        <div className="actions">
          <button className="button" type="button">
            Broadcast Message
          </button>
          <button className="button button-secondary" type="button">
            Save Template
          </button>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Recent Broadcasts</h3>
        </div>
        <div className="detail-list">
          {driveMessages.map((broadcast) => (
            <div className="detail-item" key={broadcast.id}>
              <strong>{broadcast.sentTo}</strong>
              <span className="subtle">{broadcast.sentAt}</span>
              <p className="card-note">{broadcast.message}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
