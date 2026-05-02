import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { fetchDriveDetail } from "../../shared/api/drives";
import { applyToDriveRequest, fetchStudentProfileMe } from "../../shared/api/student";
import { eligibilityTier, normalizeDetailDrive } from "../../shared/drives/discovery";

function formatWhen(iso) {
  if (!iso) {
    return "—";
  }
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch {
    return String(iso);
  }
}

export function DriveDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.roles?.[0];

  const [drive, setDrive] = useState(/** @type {ReturnType<normalizeDetailDrive>|null} */ (null));
  const [profile, setProfile] = useState(/** @type {object|null} */ (null));
  const [error, setError] = useState(/** @type {string|null} */ (null));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const raw = await fetchDriveDetail(id);
        if (!cancelled) {
          setDrive(normalizeDetailDrive(raw));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Drive not found");
          setDrive(null);
        }
      }
    }

    if (id) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (role !== "STUDENT") {
        setProfile(null);
        return;
      }
      try {
        const me = await fetchStudentProfileMe();
        if (!cancelled) {
          setProfile(me || null);
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [role]);

  async function handleApply() {
    if (!id) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await applyToDriveRequest(id);
      setMessage("You have applied to this drive.");
    } catch (e) {
      setMessage(e?.message || "Unable to apply right now.");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <section className="dashboard-stack">
        <p className="card-note">{error}</p>
        <Link className="button button-secondary" to="/drives">
          Back to drives
        </Link>
      </section>
    );
  }

  if (!drive) {
    return (
      <section className="dashboard-stack">
        <p className="subtle">Loading drive…</p>
      </section>
    );
  }

  const tier = eligibilityTier(profile, drive);
  const showApply = role === "STUDENT" && drive.displayStatus !== "Closed" && tier !== "ineligible";

  return (
    <section className="dashboard-stack drive-details-page">
      <nav className="subtle drive-details-breadcrumb">
        <Link to="/drives">Drive discovery</Link>
        <span> / </span>
        <span>{drive.roleTitle}</span>
      </nav>

      <article className="dashboard-card">
        <p className="eyebrow">{drive.companyName}</p>
        <h1 className="hero-title" style={{ fontSize: "2rem" }}>
          {drive.roleTitle}
        </h1>
        <p className="muted">
          {drive.location} · {drive.displayStatus} · Deadline {formatWhen(drive.deadlineAt)}
        </p>
        {drive.packageLpa != null ? <p>Package: {drive.packageLpa} LPA</p> : null}
        <p>Employment: {drive.employmentType === "INTERNSHIP" ? "Internship" : "Full-time"}</p>
        {message ? <p className="eyebrow">{message}</p> : null}
        <div className="drive-details-actions">
          {showApply ? (
            <button type="button" className="button" disabled={busy} onClick={handleApply}>
              {busy ? "Submitting…" : "Apply"}
            </button>
          ) : null}
          <button type="button" className="button button-secondary" onClick={() => navigate("/drives")}>
            Back to discovery
          </button>
        </div>
      </article>

      <article className="dashboard-card">
        <h2>Job description</h2>
        <p className="card-note">{drive.description || "No description provided."}</p>
      </article>

      <article className="dashboard-card">
        <h2>Eligibility criteria</h2>
        <ul className="drive-details-list">
          <li>Departments: {drive.eligibleDepartments?.length ? drive.eligibleDepartments.join(", ") : "Open"}</li>
          <li>Minimum CGPA: {drive.minCgpa ?? "—"}</li>
          <li>Maximum backlogs: {drive.maxBacklogs ?? "—"}</li>
          <li>Years: {drive.eligibleYears?.length ? drive.eligibleYears.join(", ") : "—"}</li>
        </ul>
      </article>

      <article className="dashboard-card">
        <h2>Required skills</h2>
        <p className="card-note">{(drive.requiredSkills || []).join(", ") || "—"}</p>
      </article>

      <article className="dashboard-card">
        <h2>Selection process</h2>
        <ul className="drive-details-list">
          {(drive.roundDeadlines || []).map((r) => (
            <li key={r.id || r.label}>
              <strong>{r.label}</strong> — {formatWhen(r.date)}
            </li>
          ))}
        </ul>
      </article>

      <article className="dashboard-card">
        <h2>Timeline</h2>
        <p>
          Application deadline: <strong>{formatWhen(drive.deadlineAt)}</strong>
        </p>
        <p className="muted">Round milestones are listed above.</p>
      </article>

      <article className="dashboard-card">
        <h2>Recruiter</h2>
        {drive.recruiter ? (
          <>
            <p>
              <strong>{drive.recruiter.companyName}</strong>
            </p>
            <p className="muted">{drive.recruiter.designation}</p>
          </>
        ) : (
          <p className="muted">{drive.companyName}</p>
        )}
      </article>
    </section>
  );
}
