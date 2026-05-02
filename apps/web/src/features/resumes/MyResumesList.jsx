import { useState } from "react";
import { openProtectedApiFile } from "../../shared/api/client";
import { deleteMyResume, setActiveResume } from "../../shared/api/myResumes";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

/**
 * "My uploaded resumes" panel for the student profile page.
 * Parents own list data and refresh; this component handles row actions.
 */
export function MyResumesList({ items, loading, error, onRefresh }) {
  const [busyId, setBusyId] = useState(null);
  const [openingId, setOpeningId] = useState(/** @type {string|null} */ (null));
  const [removingId, setRemovingId] = useState(/** @type {string|null} */ (null));

  if (loading) {
    return (
      <article className="dashboard-card">
        <h3>My uploaded resumes</h3>
        <p className="muted">Loading…</p>
      </article>
    );
  }

  if (!items.length && !error) {
    return (
      <article className="dashboard-card">
        <h3>My uploaded resumes</h3>
        <p className="muted">
          No resumes uploaded yet. Use the <em>Upload PDF</em> button above to add one.
        </p>
      </article>
    );
  }

  async function handleActivate(id) {
    setBusyId(id);
    try {
      await setActiveResume(id);
      await onRefresh();
    } catch (err) {
      window.alert(err?.message || "Could not set active resume");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(id) {
    if (!window.confirm("Remove this resume? This cannot be undone.")) {
      return;
    }
    setRemovingId(id);
    try {
      await deleteMyResume(id);
      await onRefresh();
    } catch (err) {
      window.alert(err?.message || "Could not remove resume");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <article className="dashboard-card">
      <h3>My uploaded resumes</h3>
      {error ? <p className="card-note">{error}</p> : null}
      <ul className="detail-list">
        {items.map((r) => (
          <li className="detail-item" key={r.id}>
            <strong>
              {r.isActive ? "★ Active · " : ""}
              {r.fileName || r.filePath?.split("/").pop() || r.id}
            </strong>
            <span className="subtle">Uploaded {formatDate(r.uploadedAt)}</span>
            <div className="table-actions">
              {r.filePath ? (
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={openingId === r.id}
                  onClick={async () => {
                    setOpeningId(r.id);
                    try {
                      await openProtectedApiFile(r.filePath);
                    } catch (e) {
                      window.alert(e?.message || "Could not open file");
                    } finally {
                      setOpeningId(null);
                    }
                  }}
                >
                  {openingId === r.id ? "Opening…" : "View"}
                </button>
              ) : null}
              {!r.isActive ? (
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => handleActivate(r.id)}
                >
                  {busyId === r.id ? "Setting…" : "Set as active"}
                </button>
              ) : null}
              <button
                type="button"
                className="button button-secondary"
                disabled={removingId === r.id}
                onClick={() => handleRemove(r.id)}
              >
                {removingId === r.id ? "Removing…" : "Remove"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
