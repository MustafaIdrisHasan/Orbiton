import { useState } from "react";
import { tpoDashboardData } from "./tpoData";

export function TpoAnnouncementsPage() {
  const [audience, setAudience] = useState("All students");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState(tpoDashboardData.announcements.recent);

  function sendAnnouncement() {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    setHistory((current) => [
      {
        id: `ann-${current.length + 1}`,
        audience,
        time: "Just now",
        message: trimmed
      },
      ...current
    ]);
    setMessage("");
  }

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">TPO Workspace</p>
          <h2>Announcements</h2>
          <p className="muted">Broadcast authoritative placement updates to all students, departments, or drive applicants.</p>
        </div>
      </header>

      <div className="tpo-communications-grid">
        <article className="dashboard-card">
          <label className="settings-field">
            Send To
            <select value={audience} onChange={(event) => setAudience(event.target.value)}>
              <option>All students</option>
              <option>Specific departments</option>
              <option>Specific drive applicants</option>
            </select>
          </label>
          <label className="settings-field">
            Message
            <textarea
              className="profile-input recruiter-textarea"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type a system announcement or drive-specific notice."
            />
          </label>
          <button className="button section-action" type="button" onClick={sendAnnouncement}>
            Send Announcement
          </button>
        </article>

        <article className="dashboard-card">
          <h3>Recent Broadcasts</h3>
          <div className="detail-list">
            {history.map((announcement) => (
              <div className="detail-item" key={announcement.id}>
                <strong>{announcement.audience}</strong>
                <span className="subtle">{announcement.time}</span>
                <p className="card-note">{announcement.message}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
