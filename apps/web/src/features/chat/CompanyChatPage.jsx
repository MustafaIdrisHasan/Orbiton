import { useCallback, useEffect, useRef, useState } from "react";
import { ensureRoom, fetchMessages, sendMessage } from "../../shared/api/chat";

const POLL_MS = 5000;

export function CompanyChatPage() {
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const loadMessages = useCallback(async (rid) => {
    if (!rid) return;
    try {
      const msgs = await fetchMessages(rid);
      setMessages(msgs);
    } catch {
      // non-fatal; keep existing messages
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      setError("");
      try {
        const data = await ensureRoom();
        if (cancelled) return;
        const rid = data?.roomId;
        setRoomId(rid);
        if (rid) {
          const msgs = await fetchMessages(rid);
          if (!cancelled) setMessages(msgs);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Could not open chat room. Make sure your company name is set.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!roomId) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") loadMessages(roomId);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [roomId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !roomId) return;
    setSending(true);
    setError("");
    try {
      await sendMessage(roomId, trimmed);
      setText("");
      await loadMessages(roomId);
    } catch (err) {
      setError(err?.message || "Send failed.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <section className="stack">
        <p className="muted">Opening chat room…</p>
      </section>
    );
  }

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Chat</p>
          <h2>Placement Office Chat</h2>
          <p className="muted">
            Direct channel with the college TPO to discuss drive details and coordination.
          </p>
          {error ? <p className="form-error">{error}</p> : null}
        </div>
      </header>

      <div className="dashboard-card" style={{ display: "flex", flexDirection: "column", minHeight: "60vh" }}>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem 0" }}>
          {messages.length === 0 ? (
            <p className="muted" style={{ textAlign: "center", marginTop: "2rem" }}>
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((m) => {
              const isMe = m.fromRole === "COMPANY";
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isMe ? "flex-end" : "flex-start",
                    maxWidth: "75%"
                  }}
                >
                  <div
                    style={{
                      background: isMe ? "#1a3c34" : "#f0ede6",
                      color: isMe ? "#fff" : "#162321",
                      borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      padding: "0.6rem 1rem",
                      fontSize: "0.95rem"
                    }}
                  >
                    {m.message}
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "#888", margin: "0.2rem 0.4rem", textAlign: isMe ? "right" : "left" }}>
                    {m.fromName} &middot; {new Date(m.sentAt).toLocaleTimeString()}
                  </p>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", borderTop: "1px solid rgba(22,35,33,0.1)", paddingTop: "0.75rem" }}>
          <input
            className="profile-input"
            style={{ flex: 1 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            disabled={sending || !roomId}
          />
          <button type="submit" className="button" disabled={sending || !text.trim() || !roomId}>
            {sending ? "…" : "Send"}
          </button>
        </form>
      </div>
    </section>
  );
}
