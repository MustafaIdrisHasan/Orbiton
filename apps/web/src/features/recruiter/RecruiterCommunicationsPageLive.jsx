import { useEffect, useMemo, useState } from "react";
import { fetchRecruiterBroadcasts, fetchRecruiterDrives, sendRecruiterBroadcast } from "../../shared/api/recruiter";

export function RecruiterCommunicationsPageLive() {
  const [drives, setDrives] = useState([]);
  const [driveId, setDriveId] = useState("");
  const [audience, setAudience] = useState("All applicants");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    let ignore = false;

    async function loadDrives() {
      const items = await fetchRecruiterDrives();
      if (ignore) {
        return;
      }

      setDrives(items);
      if (items[0]) {
        setDriveId(items[0].id);
      }
    }

    loadDrives();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadMessages() {
      if (!driveId) {
        return;
      }

      const items = await fetchRecruiterBroadcasts(driveId);
      if (!ignore) {
        setMessages(items);
      }
    }

    loadMessages();

    return () => {
      ignore = true;
    };
  }, [driveId]);

  const driveMessages = useMemo(() => messages.filter((broadcast) => broadcast.driveId === driveId), [driveId, messages]);

  async function handleBroadcast() {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !driveId) {
      return;
    }

    const broadcast = await sendRecruiterBroadcast({
      driveId,
      audience,
      message: trimmedMessage
    });

    setMessages((current) => [broadcast, ...current]);
    setMessage("");
  }

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Recruiter Operations</p>
          <h2>Communications</h2>
          <p className="muted">Broadcast updates by drive and review the live message history coming from the recruiter API.</p>
        </div>
      </header>

      <section className="dashboard-section">
        <div className="detail-grid">
          <label className="settings-field">
            Drive
            <select value={driveId} onChange={(event) => setDriveId(event.target.value)}>
              {drives.map((drive) => (
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
          <button className="button" type="button" onClick={handleBroadcast}>
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
