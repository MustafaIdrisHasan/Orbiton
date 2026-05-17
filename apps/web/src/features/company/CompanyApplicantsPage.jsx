import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  contactCompanyApplicant,
  fetchCompanyApplicants,
  giveOffer,
} from "../../shared/api/company";

function ContactModal({ applicant, onClose, onSent }) {
  const [subject, setSubject] = useState(`Re: ${applicant.driveTitle}`);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Message cannot be empty.");
      return;
    }
    setBusy(true);
    try {
      await contactCompanyApplicant({
        applicationId: applicant.applicationId,
        subject,
        message: trimmed,
      });
      onSent(`Message sent to ${applicant.name || "student"}.`);
    } catch (err) {
      setError(err?.message || "Could not send message.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel dashboard-card"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Contact {applicant.name}</h2>
        <p className="subtle">{applicant.email}</p>
        <form onSubmit={handleSubmit} className="stack">
          <label className="settings-field">
            Subject
            <input
              className="profile-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <label className="settings-field">
            Message
            <textarea
              className="profile-input"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message…"
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="modal-actions">
            <button type="submit" className="button" disabled={busy}>
              {busy ? "Sending…" : "Send message"}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OfferModal({ applicant, onClose, onSent }) {
  const [role, setRole] = useState(applicant.driveTitle || "");
  const [packageLpa, setPackageLpa] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyContact, setCompanyContact] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!role.trim()) {
      setError("Role / position is required.");
      return;
    }
    setBusy(true);
    try {
      await giveOffer({
        applicationId: applicant.applicationId,
        role: role.trim(),
        packageLpa: packageLpa !== "" ? Number(packageLpa) : null,
        joiningDate: joiningDate || null,
        companyEmail: companyEmail.trim(),
        companyContact: companyContact.trim(),
        note: note.trim()
      });
      onSent(`Offer sent to ${applicant.name || "student"}.`);
    } catch (err) {
      setError(err?.message || "Could not send offer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel dashboard-card"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Give Offer to {applicant.name}</h2>
        <p className="subtle">{applicant.email} &middot; {applicant.driveTitle}</p>
        <form onSubmit={handleSubmit} className="stack">
          <label className="settings-field">
            Role / Position
            <input
              className="profile-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer"
              required
            />
          </label>
          <div className="resume-grid-4">
            <label className="settings-field">
              Package (LPA)
              <input
                className="profile-input"
                type="number"
                min="0"
                step="0.1"
                value={packageLpa}
                onChange={(e) => setPackageLpa(e.target.value)}
                placeholder="e.g. 12"
              />
            </label>
            <label className="settings-field">
              Joining Date
              <input
                className="profile-input"
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
              />
            </label>
          </div>
          <div className="resume-grid-4">
            <label className="settings-field">
              Company Email
              <input
                className="profile-input"
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="hr@company.com"
              />
            </label>
            <label className="settings-field">
              Company Contact
              <input
                className="profile-input"
                value={companyContact}
                onChange={(e) => setCompanyContact(e.target.value)}
                placeholder="+91 99999 00000"
              />
            </label>
          </div>
          <label className="settings-field">
            Additional Note
            <textarea
              className="profile-input"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any other offer details or instructions…"
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="modal-actions">
            <button type="submit" className="button" disabled={busy}>
              {busy ? "Sending…" : "Send Offer"}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CompanyApplicantsPage() {
  const [applicants, setApplicants] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contactTarget, setContactTarget] = useState(null);
  const [offerTarget, setOfferTarget] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [driveFilter, setDriveFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchCompanyApplicants();
      setApplicants(data.items);
      setCompanyName(data.companyName);
    } catch (err) {
      setError(err?.message || "Could not load applicants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const driveOptions = useMemo(() => {
    const set = new Map();
    for (const a of applicants) {
      if (!set.has(a.driveId)) {
        set.set(a.driveId, a.driveTitle);
      }
    }
    return [...set.entries()];
  }, [applicants]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applicants.filter((a) => {
      if (driveFilter !== "ALL" && a.driveId !== driveFilter) return false;
      if (!q) return true;
      return (
        (a.name || "").toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q) ||
        (a.rollNumber || "").toLowerCase().includes(q)
      );
    });
  }, [applicants, driveFilter, search]);

  if (loading) {
    return (
      <section className="stack">
        <p className="muted">Loading applicants…</p>
      </section>
    );
  }

  if (!companyName) {
    return (
      <section className="empty-state">
        <p className="eyebrow">Company workspace</p>
        <h2>Set your company name first</h2>
        <p className="muted">
          Add your company name on your portal to start receiving applicants.
        </p>
        <Link className="button" to="/company">Go to company workspace</Link>
      </section>
    );
  }

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{companyName}</p>
          <h2>Applicants</h2>
          <p className="muted">
            Students who applied to drives associated with your company.
          </p>
          {statusMessage ? <p className="eyebrow">{statusMessage}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </div>
        <Link className="button button-secondary" to="/company">
          Back to workspace
        </Link>
      </header>

      <div className="notifications-controls">
        <div className="notifications-controls__row">
          <label className="notifications-sort">
            Drive
            <select value={driveFilter} onChange={(e) => setDriveFilter(e.target.value)}>
              <option value="ALL">All drives</option>
              {driveOptions.map(([id, title]) => (
                <option key={id} value={id}>{title}</option>
              ))}
            </select>
          </label>
          <label className="notifications-search">
            Search
            <input
              type="search"
              placeholder="Name, email, roll number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="dashboard-card">
          <p className="muted">No applicants match the current filters.</p>
        </div>
      ) : (
        <ul className="detail-list">
          {filtered.map((a) => (
            <li className="detail-item" key={a.applicationId}>
              <strong>{a.name}</strong>
              <span className="subtle">
                {a.driveTitle}
                {a.branch ? ` • ${a.branch}` : ""}
                {a.cgpa != null ? ` • CGPA ${a.cgpa}` : ""}
                {a.rollNumber ? ` • ${a.rollNumber}` : ""}
                {a.status ? ` • ${a.status}` : ""}
              </span>
              <span className="subtle">{a.email}</span>
              {Array.isArray(a.skills) && a.skills.length ? (
                <span className="subtle">Skills: {a.skills.join(", ")}</span>
              ) : null}
              <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setStatusMessage("");
                    setContactTarget(a);
                  }}
                >
                  Contact
                </button>
                <button
                  type="button"
                  className="button"
                  style={{ background: "#2e7d32" }}
                  onClick={() => {
                    setStatusMessage("");
                    setOfferTarget(a);
                  }}
                >
                  Give Offer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {contactTarget ? (
        <ContactModal
          applicant={contactTarget}
          onClose={() => setContactTarget(null)}
          onSent={(msg) => {
            setContactTarget(null);
            setStatusMessage(msg);
          }}
        />
      ) : null}

      {offerTarget ? (
        <OfferModal
          applicant={offerTarget}
          onClose={() => setOfferTarget(null)}
          onSent={(msg) => {
            setOfferTarget(null);
            setStatusMessage(msg);
          }}
        />
      ) : null}
    </section>
  );
}
