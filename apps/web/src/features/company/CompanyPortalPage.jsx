import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchCompanyApplicants,
  fetchCompanyDrives,
  fetchCompanyProfile,
  updateCompanyProfile,
} from "../../shared/api/company";

export function CompanyPortalPage() {
  const [profile, setProfile] = useState(null);
  const [drives, setDrives] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    designation: "",
    industry: "",
    description: "",
    website: "",
  });
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const profileData = await fetchCompanyProfile();
      setProfile(profileData);
      setForm({
        companyName: profileData?.companyName || "",
        designation: profileData?.designation || "",
        industry: profileData?.industry || "",
        description: profileData?.description || "",
        website: profileData?.website || "",
      });
      const [drivesData, applicantsData] = await Promise.all([
        fetchCompanyDrives().catch(() => ({ items: [] })),
        fetchCompanyApplicants().catch(() => ({ items: [] })),
      ]);
      setDrives(drivesData.items);
      setApplicants(applicantsData.items);
    } catch (err) {
      setError(err?.message || "Could not load company workspace");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setStatusMessage("");
    try {
      const next = await updateCompanyProfile({
        companyName: form.companyName.trim(),
        designation: form.designation.trim(),
        industry: form.industry.trim(),
        description: form.description.trim(),
        website: form.website.trim(),
      });
      setProfile(next);
      setEditing(false);
      setStatusMessage("Company profile saved.");
      await reload();
    } catch (err) {
      setStatusMessage(err?.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="stack">
        <p className="muted">Loading company workspace…</p>
      </section>
    );
  }

  const hasCompany = Boolean(profile?.companyName);

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Company workspace</p>
          <h2>{hasCompany ? profile.companyName : "Set up your company"}</h2>
          <p className="muted">
            {hasCompany
              ? "Drives and applicants below are linked to your company name."
              : "Add your company name to start receiving placement updates."}
          </p>
          {statusMessage ? <p className="eyebrow">{statusMessage}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </div>
        <div className="page-header__actions" style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className="button"
            onClick={() => {
              setStatusMessage("");
              setEditing((prev) => !prev);
            }}
          >
            {editing ? "Cancel" : hasCompany ? "Edit profile" : "Set company name"}
          </button>
          <Link className="button button-secondary" to="/company/applicants">
            View applicants
          </Link>
        </div>
      </header>

      {editing ? (
        <form className="dashboard-card resume-profile-form" onSubmit={handleSave}>
          <fieldset disabled={saving}>
            <legend>Company profile</legend>
            <label>
              Company name (required)
              <input
                value={form.companyName}
                onChange={(e) => setForm((s) => ({ ...s, companyName: e.target.value }))}
                placeholder="e.g. Northstar AI"
                required
              />
            </label>
            <div className="resume-grid-4">
              <label>
                Designation
                <input
                  value={form.designation}
                  onChange={(e) => setForm((s) => ({ ...s, designation: e.target.value }))}
                  placeholder="e.g. Talent Partner"
                />
              </label>
              <label>
                Industry
                <input
                  value={form.industry}
                  onChange={(e) => setForm((s) => ({ ...s, industry: e.target.value }))}
                  placeholder="e.g. Technology"
                />
              </label>
              <label>
                Website
                <input
                  value={form.website}
                  onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))}
                  placeholder="https://…"
                />
              </label>
            </div>
            <label>
              Description
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="What does your company do?"
              />
            </label>
          </fieldset>
          <div className="resume-profile-form__actions">
            <button type="submit" className="button" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <article className="dashboard-card">
        <h3>Profile</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="subtle">Company name</span>
            <strong>{profile?.companyName || "—"}</strong>
          </div>
          <div className="detail-item">
            <span className="subtle">Designation</span>
            <strong>{profile?.designation || "—"}</strong>
          </div>
          <div className="detail-item">
            <span className="subtle">Industry</span>
            <strong>{profile?.industry || "—"}</strong>
          </div>
          <div className="detail-item">
            <span className="subtle">Website</span>
            <strong>{profile?.website || "—"}</strong>
          </div>
        </div>
        {profile?.description ? (
          <p className="card-note">{profile.description}</p>
        ) : null}
      </article>

      <article className="dashboard-card">
        <h3>Drives associated with your company</h3>
        {!hasCompany ? (
          <p className="muted">Set your company name to see linked drives.</p>
        ) : drives.length === 0 ? (
          <p className="muted">
            No drives linked yet. The placement office can attach drives to "{profile.companyName}" when creating them.
          </p>
        ) : (
          <ul className="detail-list">
            {drives.map((d) => (
              <li className="detail-item" key={d.id}>
                <strong>{d.title}</strong>
                <span className="subtle">
                  {d.status}
                  {d.location ? ` • ${d.location}` : ""}
                  {d.openings ? ` • ${d.openings} openings` : ""}
                  {d.packageLpa ? ` • ${d.packageLpa} LPA` : ""}
                </span>
                <span className="subtle">
                  {d.candidateCount} applicant{d.candidateCount === 1 ? "" : "s"}
                  {d.createdBy === "TPO" ? " • Created by placement office" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="dashboard-card">
        <h3>Recent applicants</h3>
        {!hasCompany ? (
          <p className="muted">Set your company name to see applicants.</p>
        ) : applicants.length === 0 ? (
          <p className="muted">No applicants yet across your linked drives.</p>
        ) : (
          <ul className="detail-list">
            {applicants.slice(0, 5).map((a) => (
              <li className="detail-item" key={a.applicationId}>
                <strong>{a.name}</strong>
                <span className="subtle">
                  {a.driveTitle}
                  {a.branch ? ` • ${a.branch}` : ""}
                  {a.cgpa != null ? ` • CGPA ${a.cgpa}` : ""}
                </span>
                <span className="subtle">{a.email}</span>
              </li>
            ))}
          </ul>
        )}
        {applicants.length > 0 ? (
          <div style={{ marginTop: "0.75rem" }}>
            <Link className="button button-secondary" to="/company/applicants">
              View all applicants
            </Link>
          </div>
        ) : null}
      </article>
    </section>
  );
}
