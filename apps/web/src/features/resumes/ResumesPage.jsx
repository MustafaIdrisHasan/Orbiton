import { useCallback, useEffect, useMemo, useState } from "react";
import { FeaturePage } from "../../shared/ui/FeaturePage";
import { ApiClientError } from "../../shared/api/client";
import { fetchMyResumes } from "../../shared/api/myResumes";
import {
  RESUME_FEATURE_DISABLED,
  analyzeResume,
  fetchResumeScore,
  fetchStudentProfileFull,
  putResumeProfile,
  uploadResumePdf
} from "../../shared/api/resumes";
import { MyResumesList } from "./MyResumesList";

const SUBSCORE_LABELS = {
  skills: "Skills",
  education: "Education",
  projects: "Projects",
  experience: "Experience",
  completeness: "Completeness"
};

function emptyProject() {
  return { title: "", description: "", tech: "" };
}

function emptyExperience() {
  return { role: "", durationMonths: "", internship: true };
}

function projectsFromForm(rows) {
  return rows
    .filter((row) => row.title.trim() || row.description.trim())
    .map((row) => ({
      title: row.title.trim(),
      description: row.description.trim(),
      tech: row.tech
        .split(/[,\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    }));
}

function experienceFromForm(rows) {
  return rows
    .filter((row) => row.role.trim() || row.durationMonths !== "")
    .map((row) => ({
      role: row.role.trim(),
      durationMonths: Number(row.durationMonths) || 0,
      internship: Boolean(row.internship)
    }));
}

function projectsToForm(projects = []) {
  if (!projects.length) {
    return [emptyProject()];
  }
  return projects.map((p) => ({
    title: p.title || "",
    description: p.description || "",
    tech: Array.isArray(p.tech) ? p.tech.join(", ") : p.tech || ""
  }));
}

function experienceToForm(experience = []) {
  if (!experience.length) {
    return [emptyExperience()];
  }
  return experience.map((e) => ({
    role: e.role || "",
    durationMonths: e.durationMonths != null ? String(e.durationMonths) : "",
    internship: e.internship !== false
  }));
}

function SubscoreBar({ label, score, weight }) {
  const pct = Math.round(score * 100);
  return (
    <div className="resume-subscore">
      <div className="resume-subscore__row">
        <span className="resume-subscore__label">{label}</span>
        <span className="muted">
          {pct}% &middot; weight {Math.round(weight * 100)}%
        </span>
      </div>
      <div className="resume-subscore__track">
        <div className="resume-subscore__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ScoreView({ score }) {
  if (!score) {
    return null;
  }
  const subscores = score.subscores || {};
  return (
    <article className="dashboard-card resume-score-card">
      <header className="resume-score-card__header">
        <div>
          <p className="eyebrow">Resume score</p>
          <strong className="resume-score-card__total">{score.finalScore}</strong>
          <span className="muted"> / 100</span>
        </div>
        <div className="resume-score-card__meta">
          <span className="muted">Model {score.modelVersion}</span>
          <span className="muted">
            Computed {new Date(score.computedAt).toLocaleString()}
          </span>
        </div>
      </header>

      <div className="resume-subscores">
        {Object.entries(subscores).map(([key, value]) => (
          <SubscoreBar
            key={key}
            label={SUBSCORE_LABELS[key] || key}
            score={value.score}
            weight={value.weight}
          />
        ))}
      </div>

      {score.tips?.length > 0 ? (
        <div className="resume-score-card__tips">
          <h4>Suggestions</h4>
          <ul>
            {score.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function ResumeProfileForm({ disabled, onSave, onAnalyze, initial }) {
  const [skillsText, setSkillsText] = useState(
    Array.isArray(initial?.skills) ? initial.skills.join(", ") : ""
  );
  const [cgpa, setCgpa] = useState(initial?.education?.cgpa ?? "");
  const [branch, setBranch] = useState(initial?.education?.branch || "");
  const [degree, setDegree] = useState(initial?.education?.degree || "");
  const [year, setYear] = useState(initial?.education?.year || "");
  const [projects, setProjects] = useState(projectsToForm(initial?.projects));
  const [experience, setExperience] = useState(experienceToForm(initial?.experience));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!initial) {
      return;
    }
    setSkillsText(Array.isArray(initial.skills) ? initial.skills.join(", ") : "");
    setCgpa(initial.education?.cgpa ?? "");
    setBranch(initial.education?.branch || "");
    setDegree(initial.education?.degree || "");
    setYear(initial.education?.year || "");
    setProjects(projectsToForm(initial.projects));
    setExperience(experienceToForm(initial.experience));
  }, [initial]);

  function buildPayload() {
    return {
      skills: skillsText
        .split(/[,\n]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      education: {
        cgpa: cgpa === "" ? null : Number(cgpa),
        branch: branch.trim().toUpperCase() || null,
        degree: degree.trim() || null,
        year: year.trim() || null
      },
      projects: projectsFromForm(projects),
      experience: experienceFromForm(experience)
    };
  }

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSave(buildPayload());
    } finally {
      setBusy(false);
    }
  }

  async function handleAnalyze() {
    setBusy(true);
    try {
      await onAnalyze(buildPayload());
    } finally {
      setBusy(false);
    }
  }

  function updateProject(idx, field, value) {
    setProjects((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  }

  function updateExperience(idx, field, value) {
    setExperience((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  }

  return (
    <form className="resume-profile-form" onSubmit={handleSave}>
      <fieldset disabled={disabled || busy}>
        <legend>Skills</legend>
        <label>
          Skills (comma separated)
          <textarea
            rows={2}
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="e.g. React, Node.js, SQL, System design"
          />
        </label>
      </fieldset>

      <fieldset disabled={disabled || busy}>
        <legend>Education</legend>
        <div className="resume-grid-4">
          <label>
            CGPA
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={cgpa}
              onChange={(e) => setCgpa(e.target.value)}
            />
          </label>
          <label>
            Branch
            <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="CSE" />
          </label>
          <label>
            Degree
            <input value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="B.Tech" />
          </label>
          <label>
            Year
            <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Final Year" />
          </label>
        </div>
      </fieldset>

      <fieldset disabled={disabled || busy}>
        <legend>Projects</legend>
        {projects.map((row, idx) => (
          <div key={idx} className="resume-row">
            <label>
              Title
              <input
                value={row.title}
                onChange={(e) => updateProject(idx, "title", e.target.value)}
              />
            </label>
            <label>
              Description
              <input
                value={row.description}
                onChange={(e) => updateProject(idx, "description", e.target.value)}
              />
            </label>
            <label>
              Tech (comma)
              <input
                value={row.tech}
                onChange={(e) => updateProject(idx, "tech", e.target.value)}
                placeholder="React, Node.js"
              />
            </label>
            <button
              type="button"
              className="button button-secondary"
              onClick={() =>
                setProjects((prev) => (prev.length === 1 ? [emptyProject()] : prev.filter((_, i) => i !== idx)))
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="button button-secondary"
          onClick={() => setProjects((prev) => [...prev, emptyProject()])}
        >
          Add project
        </button>
      </fieldset>

      <fieldset disabled={disabled || busy}>
        <legend>Experience</legend>
        {experience.map((row, idx) => (
          <div key={idx} className="resume-row">
            <label>
              Role
              <input value={row.role} onChange={(e) => updateExperience(idx, "role", e.target.value)} />
            </label>
            <label>
              Months
              <input
                type="number"
                min="0"
                value={row.durationMonths}
                onChange={(e) => updateExperience(idx, "durationMonths", e.target.value)}
              />
            </label>
            <label className="resume-row__checkbox">
              <input
                type="checkbox"
                checked={Boolean(row.internship)}
                onChange={(e) => updateExperience(idx, "internship", e.target.checked)}
              />
              Internship
            </label>
            <button
              type="button"
              className="button button-secondary"
              onClick={() =>
                setExperience((prev) =>
                  prev.length === 1 ? [emptyExperience()] : prev.filter((_, i) => i !== idx)
                )
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="button button-secondary"
          onClick={() => setExperience((prev) => [...prev, emptyExperience()])}
        >
          Add experience
        </button>
      </fieldset>

      <div className="resume-profile-form__actions">
        <button type="submit" className="button" disabled={disabled || busy}>
          {busy ? "Saving…" : "Save profile"}
        </button>
        <button
          type="button"
          className="button button-secondary"
          disabled={disabled || busy}
          onClick={handleAnalyze}
        >
          {busy ? "Analyzing…" : "Save & analyze"}
        </button>
      </div>
    </form>
  );
}

export function ResumesPage() {
  const [featureEnabled, setFeatureEnabled] = useState(/** @type {boolean|null} */ (null));
  const [profile, setProfile] = useState(null);
  const [myResumes, setMyResumes] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [score, setScore] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const isFeatureDisabled = featureEnabled === false;

  const analysisResumeId = useMemo(() => {
    const active = myResumes.find((r) => r.isActive);
    if (active?.id) {
      return active.id;
    }
    if (myResumes[0]?.id) {
      return myResumes[0].id;
    }
    if (profile?.latestResumeId) {
      return profile.latestResumeId;
    }
    return "me-resume";
  }, [myResumes, profile]);

  const refreshProfile = useCallback(async () => {
    setError("");
    setListError("");
    setListLoading(true);
    try {
      const [data, list] = await Promise.all([
        fetchStudentProfileFull(),
        fetchMyResumes().catch((err) => {
          if (err?.status && err.status !== 401 && err.status !== 403) {
            setListError(err?.message || "Could not load resume list");
          }
          return [];
        })
      ]);
      if (data === null) {
        setFeatureEnabled(false);
        return;
      }
      setFeatureEnabled(true);
      setProfile(data);
      setMyResumes(Array.isArray(list) ? list : []);
      if (data?.latestResumeId) {
        const latestScore = await fetchResumeScore(data.latestResumeId);
        if (latestScore) {
          setScore(latestScore);
        }
      }
    } catch (e) {
      if (e instanceof ApiClientError && e.code === RESUME_FEATURE_DISABLED) {
        setFeatureEnabled(false);
        return;
      }
      setError(e?.message || "Could not load profile");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  async function handleSave(payload) {
    setToast("");
    try {
      await putResumeProfile(payload);
      setToast("Profile saved.");
      await refreshProfile();
    } catch (e) {
      if (e instanceof ApiClientError && e.code === RESUME_FEATURE_DISABLED) {
        setFeatureEnabled(false);
        return;
      }
      setError(e?.message || "Save failed.");
    }
  }

  async function handleAnalyze(payload) {
    setToast("");
    try {
      await putResumeProfile(payload);
      const result = await analyzeResume(analysisResumeId, { profile: payload });
      if (result) {
        setScore(result);
        setToast(`Score: ${result.finalScore}/100`);
      }
      await refreshProfile();
    } catch (e) {
      if (e instanceof ApiClientError && e.code === RESUME_FEATURE_DISABLED) {
        setFeatureEnabled(false);
        return;
      }
      setError(e?.message || "Analyze failed.");
    }
  }

  async function handleUpload(event) {
    const file = event.target?.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setError("");
    setToast("");
    try {
      const result = await uploadResumePdf(file);
      if (result?.score) {
        setScore({
          resumeId: result.uploadId,
          modelVersion: result.score.modelVersion,
          computedAt: result.score.computedAt,
          weights: result.score.weights,
          subscores: result.score.subscores,
          finalScore: result.score.finalScore,
          tips: result.score.tips
        });
        setToast(`Uploaded ${result.upload?.filename || "resume"} · score ${result.score.finalScore}/100`);
      }
      await refreshProfile();
    } catch (e) {
      if (e instanceof ApiClientError && e.code === RESUME_FEATURE_DISABLED) {
        setFeatureEnabled(false);
        return;
      }
      setError(e?.message || "Upload failed.");
    }
  }

  const initialProfileForForm = useMemo(() => {
    if (!profile) {
      return null;
    }
    return {
      skills: profile.skills,
      education: profile.education,
      projects: profile.projects,
      experience: profile.experience
    };
  }, [profile]);

  if (featureEnabled === null) {
    return (
      <section className="stack">
        <p className="muted">Loading resume tools…</p>
      </section>
    );
  }

  if (isFeatureDisabled) {
    return (
      <FeaturePage
        title="Resume Management"
        description="Resume scoring is currently disabled in this environment. Set ENABLE_RESUME_SCORING=true on the API to enable the weighted scoring tools."
        actions={[]}
        metrics={[
          {
            label: "Storage",
            value: "Object store",
            note: "Abstracted for local and S3-compatible backends"
          },
          {
            label: "AI score",
            value: "Disabled",
            note: "Flip ENABLE_RESUME_SCORING to enable scoring in the API"
          }
        ]}
      />
    );
  }

  return (
    <section className="stack resume-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Orbiton Workspace</p>
          <h2>Resume Analysis</h2>
          <p className="muted">
            Update your structured profile, save it, and run a weighted score with explainable
            sub-scores.
          </p>
          {toast ? <p className="eyebrow">{toast}</p> : null}
          {error ? <p className="card-note">{error}</p> : null}
        </div>
        <label className="resume-upload">
          <span className="button button-secondary">Upload PDF</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
        </label>
      </header>

      <MyResumesList
        items={myResumes}
        loading={listLoading}
        error={listError}
        onRefresh={refreshProfile}
      />

      <div className="resume-page__grid">
        <ResumeProfileForm
          disabled={false}
          onSave={handleSave}
          onAnalyze={handleAnalyze}
          initial={initialProfileForForm}
        />
        <ScoreView score={score} />
      </div>
    </section>
  );
}
