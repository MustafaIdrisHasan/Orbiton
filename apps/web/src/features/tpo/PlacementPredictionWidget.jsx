import { useState } from "react";
import { ApiClientError } from "../../shared/api/client";
import { PREDICTION_UNAVAILABLE, predictPlacement } from "../../shared/api/predictions";

const RISK_BAND_LABEL = {
  high: "High likelihood",
  medium: "Watch list",
  low: "Risk band"
};

function PredictionResult({ result }) {
  if (!result) {
    return null;
  }
  const pct = Math.round((result.probability || 0) * 100);
  return (
    <div className="prediction-result">
      <div className="prediction-result__top">
        <strong className="prediction-result__pct">{pct}%</strong>
        <span className={`prediction-result__band prediction-result__band--${result.riskBand}`}>
          {RISK_BAND_LABEL[result.riskBand] || result.riskBand}
        </span>
      </div>
      <p className="card-note">Model {result.modelVersion}</p>
      {result.contributions ? (
        <ul className="prediction-result__contribs">
          {Object.entries(result.contributions).map(([key, value]) => (
            <li key={key}>
              <span>{key}</span>
              <span>{value > 0 ? `+${value}` : value}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function PlacementPredictionWidget() {
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [studentId, setStudentId] = useState("cand-aarav-rao");
  const [resumeScore, setResumeScore] = useState("78");
  const [cgpa, setCgpa] = useState("8.6");
  const [hasInternship, setHasInternship] = useState(true);
  const [projectCount, setProjectCount] = useState("3");
  const [backlogs, setBacklogs] = useState("0");

  async function runPrediction(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await predictPlacement({
        studentId,
        resumeScore: resumeScore === "" ? undefined : Number(resumeScore),
        cgpa: cgpa === "" ? undefined : Number(cgpa),
        hasInternship,
        projectCount: projectCount === "" ? undefined : Number(projectCount),
        backlogs: backlogs === "" ? undefined : Number(backlogs)
      });
      setResult(response);
    } catch (e) {
      if (e instanceof ApiClientError && e.code === PREDICTION_UNAVAILABLE) {
        setHidden(true);
        return;
      }
      setError(e?.message || "Prediction failed.");
    } finally {
      setBusy(false);
    }
  }

  if (hidden) {
    return null;
  }

  return (
    <section className="dashboard-section">
      <div className="section-heading">
        <div>
          <h2>Placement Probability</h2>
          <span className="subtle">
            Logistic regression baseline served by the ML service. Hides itself when the
            service is unavailable.
          </span>
        </div>
      </div>
      <article className="dashboard-card prediction-widget">
        <form className="prediction-widget__form" onSubmit={runPrediction}>
          <label>
            Student ID
            <input value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          </label>
          <label>
            Resume score
            <input
              type="number"
              min="0"
              max="100"
              value={resumeScore}
              onChange={(e) => setResumeScore(e.target.value)}
            />
          </label>
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
            Projects
            <input
              type="number"
              min="0"
              value={projectCount}
              onChange={(e) => setProjectCount(e.target.value)}
            />
          </label>
          <label>
            Backlogs
            <input
              type="number"
              min="0"
              value={backlogs}
              onChange={(e) => setBacklogs(e.target.value)}
            />
          </label>
          <label className="prediction-widget__checkbox">
            <input
              type="checkbox"
              checked={hasInternship}
              onChange={(e) => setHasInternship(e.target.checked)}
            />
            Has internship
          </label>
          <button type="submit" className="button" disabled={busy}>
            {busy ? "Predicting…" : "Run prediction"}
          </button>
        </form>
        {error ? <p className="card-note">{error}</p> : null}
        <PredictionResult result={result} />
      </article>
    </section>
  );
}
