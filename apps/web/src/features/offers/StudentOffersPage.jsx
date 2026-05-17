import { useCallback, useEffect, useState } from "react";
import { fetchStudentOffers, respondToOffer } from "../../shared/api/studentOffers";

const STATUS_LABELS = {
  PENDING: "Pending response",
  ACCEPTED: "Accepted",
  DECLINED: "Declined"
};

const STATUS_COLORS = {
  PENDING: "#b45309",
  ACCEPTED: "#2e7d32",
  DECLINED: "#c62828"
};

function OfferCard({ offer, onRespond }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handle(response) {
    setBusy(true);
    setError("");
    try {
      await onRespond(offer.id, response);
    } catch (err) {
      setError(err?.message || "Could not respond.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="dashboard-card" style={{ borderLeft: `4px solid ${STATUS_COLORS[offer.status] || "#888"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <p className="eyebrow">{offer.companyName}</p>
          <h3 style={{ margin: "0.25rem 0" }}>{offer.role}</h3>
        </div>
        <span
          style={{
            padding: "0.25rem 0.75rem",
            borderRadius: "999px",
            fontSize: "0.75rem",
            fontWeight: 600,
            background: STATUS_COLORS[offer.status] + "20",
            color: STATUS_COLORS[offer.status]
          }}
        >
          {STATUS_LABELS[offer.status] || offer.status}
        </span>
      </div>

      <div className="detail-grid" style={{ marginTop: "0.75rem" }}>
        {offer.driveTitle ? (
          <div className="detail-item">
            <span className="subtle">Drive</span>
            <strong>{offer.driveTitle}</strong>
          </div>
        ) : null}
        {offer.packageLpa != null ? (
          <div className="detail-item">
            <span className="subtle">Package</span>
            <strong>{offer.packageLpa} LPA</strong>
          </div>
        ) : null}
        {offer.joiningDate ? (
          <div className="detail-item">
            <span className="subtle">Joining date</span>
            <strong>{offer.joiningDate}</strong>
          </div>
        ) : null}
        {offer.companyEmail ? (
          <div className="detail-item">
            <span className="subtle">Company email</span>
            <strong>{offer.companyEmail}</strong>
          </div>
        ) : null}
        {offer.companyContact ? (
          <div className="detail-item">
            <span className="subtle">Contact</span>
            <strong>{offer.companyContact}</strong>
          </div>
        ) : null}
        <div className="detail-item">
          <span className="subtle">Received</span>
          <strong>{new Date(offer.createdAt).toLocaleString()}</strong>
        </div>
      </div>

      {offer.note ? (
        <p className="card-note" style={{ marginTop: "0.75rem" }}>{offer.note}</p>
      ) : null}

      {error ? <p className="form-error" style={{ marginTop: "0.5rem" }}>{error}</p> : null}

      {offer.status === "PENDING" ? (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button
            type="button"
            className="button"
            style={{ background: "#2e7d32" }}
            disabled={busy}
            onClick={() => handle("ACCEPTED")}
          >
            {busy ? "Saving…" : "Accept Offer"}
          </button>
          <button
            type="button"
            className="button button-secondary"
            disabled={busy}
            onClick={() => handle("DECLINED")}
          >
            Decline
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function StudentOffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await fetchStudentOffers();
      setOffers(items);
    } catch (err) {
      setError(err?.message || "Could not load offers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRespond(offerId, response) {
    await respondToOffer(offerId, response);
    await load();
  }

  if (loading) {
    return (
      <section className="stack">
        <p className="muted">Loading offers…</p>
      </section>
    );
  }

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">My Offers</p>
          <h2>Placement Offers</h2>
          <p className="muted">
            Companies issue offers here. Accept or decline — the placement office is notified automatically.
          </p>
          {error ? <p className="form-error">{error}</p> : null}
        </div>
      </header>

      {offers.length === 0 ? (
        <div className="dashboard-card">
          <p className="muted">No offers yet. Check back after your interviews.</p>
        </div>
      ) : (
        <div className="stack">
          {offers.map((o) => (
            <OfferCard key={o.id} offer={o} onRespond={handleRespond} />
          ))}
        </div>
      )}
    </section>
  );
}
