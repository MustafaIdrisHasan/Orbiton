import { useCallback, useEffect, useRef, useState } from "react";
import { fetchChatRooms, fetchMessages, sendMessage } from "../../shared/api/chat";

const POLL_MS = 5000;

export function TpoChatPage() {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      setError("");
      try {
        const r = await fetchChatRooms();
        if (!cancelled) setRooms(r);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Could not load chat rooms");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
  }, []);

  const loadMessages = useCallback(async (roomId) => {
    if (!roomId) return;
    try {
      const msgs = await fetchMessages(roomId);
      setMessages(msgs);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    if (!activeRoom) return;
    loadMessages(activeRoom);
  }, [activeRoom, loadMessages]);

  useEffect(() => {
    if (!activeRoom) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") loadMessages(activeRoom);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [activeRoom, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeRoom) return;
    setSending(true);
    setError("");
    try {
      await sendMessage(activeRoom, trimmed);
      setText("");
      await loadMessages(activeRoom);
    } catch (err) {
      setError(err?.message || "Send failed.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <section className="stack">
        <p className="muted">Loading chat rooms…</p>
      </section>
    );
  }

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">TPO Chat</p>
          <h2>Company Chats</h2>
          <p className="muted">
            Discuss drive details and coordination directly with participating companies.
          </p>
          {error ? <p className="form-error">{error}</p> : null}
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "1rem", alignItems: "flex-start" }}>
        {/* Room list */}
        <div className="dashboard-card" style={{ padding: "0.5rem" }}>
          <p className="eyebrow" style={{ padding: "0.5rem 0.75rem" }}>Companies</p>
          {rooms.length === 0 ? (
            <p className="muted" style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}>
              No company has started a chat yet.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {rooms.map((r) => (
                <li key={r.roomId}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRoom(r.roomId);
                      setMessages([]);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.6rem 0.75rem",
                      background: activeRoom === r.roomId ? "rgba(22,35,33,0.08)" : "transparent",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: activeRoom === r.roomId ? 600 : 400
                    }}
                  >
                    <span style={{ display: "block" }}>{r.label}</span>
                    {r.lastMessage ? (
                      <span style={{ fontSize: "0.72rem", color: "#888", display: "block", marginTop: "0.1rem" }}>
                        {r.lastMessage.text.slice(0, 32)}{r.lastMessage.text.length > 32 ? "…" : ""}
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.72rem", color: "#888" }}>No messages</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chat panel */}
        <div className="dashboard-card" style={{ display: "flex", flexDirection: "column", minHeight: "60vh" }}>
          {!activeRoom ? (
            <p className="muted" style={{ textAlign: "center", marginTop: "4rem" }}>
              Select a company to start chatting.
            </p>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem 0" }}>
                {messages.length === 0 ? (
                  <p className="muted" style={{ textAlign: "center", marginTop: "2rem" }}>
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map((m) => {
                    const isMe = m.fromRole === "TPO";
                    return (
                      <div key={m.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "75%" }}>
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
                  disabled={sending}
                />
                <button type="submit" className="button" disabled={sending || !text.trim()}>
                  {sending ? "…" : "Send"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
