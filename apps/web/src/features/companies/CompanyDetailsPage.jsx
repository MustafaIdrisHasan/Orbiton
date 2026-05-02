import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { fetchCompanyById } from "../../shared/api/companies";
import { applyToDriveRequest } from "../../shared/api/student";
import { companyInitials, normalizeCompanyDetail } from "../../shared/companies/display";

function formatDeadline(iso) {
  if (!iso) {
    return "—";
  }
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return "—";
  }
}

function DrivesTable({ title, drives, role, onApply, applyBusyId, sectionId }) {
  if (!drives.length) {
    return (
      <div className="companies-detail__table-wrap" id={sectionId || undefined}>
        <h3 className="companies-detail__drives-title">{title}</h3>
        <p className="subtle">No drives in this section.</p>
      </div>
    );
  }

  return (
    <div className="companies-detail__table-wrap" id={sectionId || undefined}>
      <h3 className="companies-detail__drives-title">{title}</h3>
      <div className="companies-drives-table-wrap">
        <table className="companies-drives-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Package</th>
              <th>Status</th>
              <th>Deadline</th>
              <th>Location</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {drives.map((d) => {
              const isActiveSection = title === "Active drives";
              const canApply = role === "STUDENT" && isActiveSection;
              const busy = applyBusyId === d.id;
              return (
                <tr key={d.id}>
                  <td data-label="Role">{d.title}</td>
                  <td data-label="Package">{d.packageLpa != null ? `${d.packageLpa} LPA` : "—"}</td>
                  <td data-label="Status">{d.status || "—"}</td>
                  <td data-label="Deadline">{formatDeadline(d.applicationDeadline)}</td>
                  <td data-label="Location">{d.location || "—"}</td>
                  <td className="companies-drives-table__actions">
                    <Link className="button button-sm" to={`/drives/${d.id}`}>
                      View drive
                    </Link>
                    {canApply ? (
                      <button type="button" className="button button-secondary button-sm" disabled={busy} onClick={() => onApply(d.id)}>
                        {busy ? "Applying…" : "Apply"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CompanyDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const role = user?.roles?.[0];
  const [raw, setRaw] = useState(/** @type {object|null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string|null} */ (null));
  const [applyBusyId, setApplyBusyId] = useState(/** @type {string|null} */ (null));
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    if (!id) {
      return;
    }
    setLoading(true);
    setError(null);
    setToast("");
    try {
      const data = await fetchCompanyById(id);
      setRaw(data);
    } catch (e) {
      setError(e?.message || "Company not found");
      setRaw(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const company = raw ? normalizeCompanyDetail(raw) : null;

  async function handleApply(driveId) {
    setApplyBusyId(driveId);
    setToast("");
    try {
      await applyToDriveRequest(driveId);
      setToast("Application submitted.");
    } catch (e) {
      setToast(e?.message || "Apply failed.");
    } finally {
      setApplyBusyId(null);
    }
  }

  if (loading) {
    return (
      <section className="dashboard-stack companies-detail">
        <p className="subtle">Loading company…</p>
      </section>
    );
  }

  if (error || !company) {
    return (
      <section className="dashboard-stack companies-detail">
        <p className="card-note">{error || "Not found."}</p>
        <Link className="button" to="/companies">
          Back to companies
        </Link>
      </section>
    );
  }

  return (
    <section className="dashboard-stack companies-detail">
      {toast ? <p className="eyebrow companies-detail__toast">{toast}</p> : null}
      <header className="companies-detail__header">
        <div className="companies-detail__mark" aria-hidden>
          {company.logoUrl ? <img src={company.logoUrl} alt="" className="companies-card__logo" /> : <span className="companies-card__initials">{companyInitials(company.name)}</span>}
        </div>
        <div>
          <p className="eyebrow">{company.industry || "Company"}</p>
          <h1 className="hero-title companies-detail__title">{company.name}</h1>
          {company.website ? (
            <a className="companies-detail__web" href={company.website} target="_blank" rel="noreferrer">
              {company.website}
            </a>
          ) : null}
        </div>
        <div className="companies-detail__header-meta">
          <span className="subtle">
            {company.designation ? `Primary contact: ${company.designation}` : null}
          </span>
        </div>
      </header>

      <div className="companies-detail__grid">
        <section className="dashboard-card companies-detail__panel">
          <h2>Overview</h2>
          <p className="companies-detail__body">{company.description || "No description provided."}</p>
        </section>
        <section className="dashboard-card companies-detail__panel">
          <h2>Hiring insights</h2>
          <ul className="companies-insights">
            <li>
              <span className="metric-label">Departments</span>
              {company.departmentsHired.length ? company.departmentsHired.join(", ") : "—"}
            </li>
            <li>
              <span className="metric-label">Average package</span>
              {company.avgPackage != null ? `${company.avgPackage} LPA` : "—"}
            </li>
            <li>
              <span className="metric-label">Selection ratio</span>
              {company.selectionRatio != null ? String(company.selectionRatio) : "Not available"}
            </li>
            <li>
              <span className="metric-label">Roles offered</span>
              {company.rolesOffered.length ? company.rolesOffered.join(", ") : "—"}
            </li>
            <li>
              <span className="metric-label">Last activity</span>
              {company.lastActivityAt ? formatDeadline(company.lastActivityAt) : "—"}
            </li>
          </ul>
        </section>
      </div>

      <section className="companies-detail__drives">
        <div className="section-heading">
          <h2>Drives</h2>
          <span className="subtle">Active vs past, with links to the global drive page</span>
        </div>
        <DrivesTable
          title="Active drives"
          sectionId="drives"
          drives={company.activeDrives}
          role={role}
          onApply={handleApply}
          applyBusyId={applyBusyId}
        />
        <DrivesTable title="Past drives" drives={company.pastDrives} role={role} onApply={handleApply} applyBusyId={applyBusyId} />
      </section>

      <p className="companies-detail__back">
        <Link className="button button-secondary" to="/companies">
          Back to directory
        </Link>
      </p>
    </section>
  );
}
