import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createDrive } from "../../shared/api/drives";
import { ApiClientError } from "../../shared/api/client";

function splitList(text) {
  return String(text || "")
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function CreateDrivePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [openings, setOpenings] = useState("5");
  const [location, setLocation] = useState("Campus / Hybrid");
  const [deadline, setDeadline] = useState("");
  const [skillsText, setSkillsText] = useState("React, Node.js, SQL");
  const [deptText, setDeptText] = useState("CSE, ECE, IT");
  const [minCgpa, setMinCgpa] = useState("7");
  const [maxBacklogs, setMaxBacklogs] = useState("0");
  const [packageLpa, setPackageLpa] = useState("");
  const [publishForStudents, setPublishForStudents] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const t = title.trim();
    if (!t) {
      setError("Title is required.");
      return;
    }
    let applicationDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    if (deadline) {
      const d = new Date(deadline);
      if (!Number.isNaN(d.getTime())) {
        applicationDeadline = d.toISOString();
      }
    }
    const requiredSkills = splitList(skillsText);
    const eligibleDepartments = splitList(deptText).map((d) => d.toUpperCase());
    const payload = {
      title: t,
      description: description.trim(),
      openings: Number(openings) || 0,
      location: location.trim() || "TBD",
      applicationDeadline,
      status: publishForStudents ? "PUBLISHED" : "DRAFT",
      isFeatured: false,
      employmentType: "FULL_TIME",
      eligibleDepartments,
      minCgpa: minCgpa === "" ? null : Number(minCgpa),
      maxBacklogs: maxBacklogs === "" ? 0 : Number(maxBacklogs),
      eligibleYears: [],
      requiredSkills,
      packageLpa: packageLpa === "" ? null : Number(packageLpa),
      roundDeadlines: []
    };
    setBusy(true);
    try {
      await createDrive(payload);
      navigate("/drives/mine", { replace: true, state: { toast: publishForStudents ? "Drive created and published for students." : "Drive saved as draft — publish from My Drives." } });
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Could not create drive";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Placement</p>
          <h2>Create placement drive</h2>
          <p className="muted">
            Drives are stored on the shared API. Students only see drives marked{" "}
            <strong>Published</strong> on <Link to="/drives">Drive discovery</Link>.
          </p>
          {error ? <p className="card-note">{error}</p> : null}
        </div>
        <Link className="button button-secondary" to="/drives/mine">
          My drives
        </Link>
      </header>

      <form className="dashboard-card resume-profile-form" onSubmit={handleSubmit}>
        <fieldset disabled={busy}>
          <legend>Basics</legend>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Associate Software Engineer" required />
          </label>
          <label>
            Description
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Role summary, stack, expectations" />
          </label>
          <div className="resume-grid-4">
            <label>
              Openings
              <input type="number" min={0} value={openings} onChange={(e) => setOpenings(e.target.value)} />
            </label>
            <label>
              Location
              <input value={location} onChange={(e) => setLocation(e.target.value)} />
            </label>
            <label>
              Min CGPA
              <input type="number" step="0.01" min={0} max={10} value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} />
            </label>
            <label>
              Max backlogs
              <input type="number" min={0} value={maxBacklogs} onChange={(e) => setMaxBacklogs(e.target.value)} />
            </label>
          </div>
          <label>
            Application deadline
            <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            <span className="muted" style={{ display: "block", marginTop: "0.35rem", fontSize: "0.85rem" }}>
              Leave empty to default to two weeks from now.
            </span>
          </label>
          <label>
            Package (LPA, optional)
            <input type="number" step="0.1" min={0} value={packageLpa} onChange={(e) => setPackageLpa(e.target.value)} placeholder="e.g. 12" />
          </label>
        </fieldset>

        <fieldset disabled={busy}>
          <legend>Eligibility</legend>
          <label>
            Required skills (comma separated)
            <input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
          </label>
          <label>
            Eligible departments (comma separated)
            <input value={deptText} onChange={(e) => setDeptText(e.target.value)} placeholder="CSE, ECE" />
          </label>
        </fieldset>

        <fieldset disabled={busy}>
          <legend>Visibility</legend>
          <label className="resume-row__checkbox">
            <input
              type="checkbox"
              checked={publishForStudents}
              onChange={(e) => setPublishForStudents(e.target.checked)}
            />
            Publish immediately — show on student Drive discovery
          </label>
          <p className="muted" style={{ marginTop: "0.5rem" }}>
            If unchecked, the drive stays <strong>Draft</strong> until you open <strong>My drives</strong> and change
            status to Published.
          </p>
        </fieldset>

        <div className="resume-profile-form__actions">
          <button type="submit" className="button" disabled={busy}>
            {busy ? "Saving…" : publishForStudents ? "Create & publish" : "Save as draft"}
          </button>
          <Link className="button button-secondary" to="/drives/mine">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
