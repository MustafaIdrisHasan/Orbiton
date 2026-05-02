import { useCallback, useEffect, useState } from "react";
import {
  createTpoAnnouncement,
  fetchTpoAnnouncements,
} from "../../shared/api/tpo";

const AUDIENCE_OPTIONS = [
  { label: "All students", roles: ["STUDENT"] },
  { label: "Specific departments", roles: ["STUDENT"] },
  { label: "Specific drive applicants", roles: ["STUDENT"] },
];

export function TpoAnnouncementsPage() {
  const [audienceLabel, setAudienceLabel] = useState(AUDIENCE_OPTIONS[0].label);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchTpoAnnouncements();
      setHistory(items);
    } catch (err) {
      setFeedback(err?.message || "Could not load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function sendAnnouncement() {
    const trimmed = message.trim();
    if (!trimmed) {
      setFeedback("Please type a message before sending.");
      return;
    }
    const audienceMeta = AUDIENCE_OPTIONS.find((a) => a.label === audienceLabel) || AUDIENCE_OPTIONS[0];
    setBusy(true);
    setFeedback("");
    try {
      const item = await createTpoAnnouncement({
        audience: audienceLabel,
        audienceRoles: audienceMeta.roles,
        message: trimmed,
        title: `TPO Announcement · ${audienceLabel}`,
      });
      setMessage("");
      setFeedback(
        item?.recipients != null
          ? `Sent to ${item.recipients} student${item.recipients === 1 ? "" : "s"}.`
          : "Announcement sent."
      );
      await load();
    } catch (err) {
      setFeedback(err?.message || "Could not send announcement");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">TPO Workspace</p>
          <h2>Announcements</h2>
          <p className="muted">
            Broadcast authoritative placement updates. Students see your message in their Notifications inbox under the
            <em> Announcements</em> filter.
          </p>
        </div>
      </header>

      <div className="tpo-communications-grid">
        <article className="dashboard-card">
          <label className="settings-field">
            Send To
            <select value={audienceLabel} onChange={(event) => setAudienceLabel(event.target.value)}>
              {AUDIENCE_OPTIONS.map((option) => (
                <option key={option.label}>{option.label}</option>
              ))}
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
          {feedback ? <p className="card-note">{feedback}</p> : null}
          <button
            className="button section-action"
            type="button"
            onClick={sendAnnouncement}
            disabled={busy}
          >
            {busy ? "Sending…" : "Send Announcement"}
          </button>
        </article>

        <article className="dashboard-card">
          <h3>Recent Broadcasts</h3>
          {loading ? <p className="muted">Loading…</p> : null}
          {!loading && history.length === 0 ? (
            <p className="muted">No announcements yet.</p>
          ) : null}
          <div className="detail-list">
            {history.map((announcement) => (
              <div className="detail-item" key={announcement.id}>
                <strong>{announcement.audience || "All students"}</strong>
                <span className="subtle">{announcement.time}</span>
                <p className="card-note">{announcement.message}</p>
                {announcement.recipients != null ? (
                  <span className="muted">→ {announcement.recipients} recipients</span>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
