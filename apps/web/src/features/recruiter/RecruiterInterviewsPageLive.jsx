import { useEffect, useMemo, useState } from "react";
import { createRecruiterInterview, fetchRecruiterDrives, fetchRecruiterInterviews } from "../../shared/api/recruiter";

const recommendationOptions = ["Advance", "Hold", "Reject"];

export function RecruiterInterviewsPageLive() {
  const [drives, setDrives] = useState([]);
  const [driveId, setDriveId] = useState("");
  const [interviews, setInterviews] = useState([]);
  const [candidateName, setCandidateName] = useState("");
  const [slot, setSlot] = useState("");
  const [round, setRound] = useState("Final Interview");
  const [mode, setMode] = useState("In-person");
  const [panel, setPanel] = useState("Placement Panel");
  const [selectedInterviewId, setSelectedInterviewId] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadDrives() {
      const items = await fetchRecruiterDrives();
      if (ignore) {
        return;
      }

      setDrives(items);
      if (items[0]) {
        setDriveId(items[0].id);
      }
    }

    loadDrives();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInterviews() {
      if (!driveId) {
        return;
      }

      const items = await fetchRecruiterInterviews(driveId);
      if (!ignore) {
        setInterviews(items);
        if (!selectedInterviewId && items[0]) {
          setSelectedInterviewId(items[0].id);
        }
      }
    }

    loadInterviews();

    return () => {
      ignore = true;
    };
  }, [driveId]);

  const calendarSlots = useMemo(
    () =>
      interviews.reduce((acc, interview) => {
        const day = interview.slot.split(",")[0] || "Schedule";
        acc[day] = acc[day] || [];
        acc[day].push(`${interview.candidate} - ${interview.slot}`);
        return acc;
      }, {}),
    [interviews]
  );

  async function handleScheduleInterview() {
    if (!driveId || !candidateName.trim() || !slot) {
      return;
    }

    await createRecruiterInterview({
      driveId,
      candidateId: `candidate-${Date.now()}`,
      candidateName: candidateName.trim(),
      round,
      slot: new Date(slot).toISOString(),
      mode,
      panel
    });

    const items = await fetchRecruiterInterviews(driveId);
    setInterviews(items);
    setCandidateName("");
    setSlot("");
  }

  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Recruiter Operations</p>
          <h2>Interview Management</h2>
          <p className="muted">Live interview schedules now load from the recruiter API, including newly created slots.</p>
        </div>
      </header>

      <div className="detail-grid">
        <label className="settings-field">
          Drive
          <select value={driveId} onChange={(event) => setDriveId(event.target.value)}>
            {drives.map((drive) => (
              <option key={drive.id} value={drive.id}>
                {drive.title}
              </option>
            ))}
          </select>
        </label>
        <label className="settings-field">
          Candidate Name
          <input className="profile-input" type="text" value={candidateName} onChange={(event) => setCandidateName(event.target.value)} />
        </label>
        <label className="settings-field">
          Slot
          <input className="profile-input" type="datetime-local" value={slot} onChange={(event) => setSlot(event.target.value)} />
        </label>
        <label className="settings-field">
          Mode
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
            <option>In-person</option>
            <option>Virtual</option>
          </select>
        </label>
      </div>

      <div className="actions">
        <button className="button" type="button" onClick={handleScheduleInterview}>
          Schedule Interview
        </button>
      </div>

      <div className="overview-grid">
        {interviews.map((interview) => (
          <article className="dashboard-card" key={interview.id}>
            <span className="metric-label">{interview.round}</span>
            <h3>{interview.candidate}</h3>
            <div className="detail-list">
              <div className="detail-item">
                <strong>{interview.slot}</strong>
                <span className="subtle">{interview.mode}</span>
              </div>
              <div className="detail-item">
                <strong>{interview.panel}</strong>
                <span className="subtle">Feedback: {interview.feedbackStatus}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Calendar View</h3>
        </div>
        <div className="overview-grid">
          {Object.entries(calendarSlots).map(([day, items]) => (
            <article className="dashboard-card" key={day}>
              <span className="metric-label">{day}</span>
              <div className="detail-list">
                {items.map((item) => (
                  <div className="detail-item" key={item}>
                    <strong>{item}</strong>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Feedback Submission</h3>
        </div>
        <div className="detail-grid">
          <label className="settings-field">
            Candidate
            <select value={selectedInterviewId} onChange={(event) => setSelectedInterviewId(event.target.value)}>
              {interviews.map((interview) => (
                <option key={interview.id} value={interview.id}>
                  {interview.candidate}
                </option>
              ))}
            </select>
          </label>
          <label className="settings-field">
            Recommendation
            <select>
              {recommendationOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="settings-field">
          Panel Feedback
          <textarea className="profile-input recruiter-textarea" placeholder="Feedback persistence is the next recruiter mutation to connect." />
        </label>
        <button className="button section-action" type="button">
          Save Feedback
        </button>
      </section>
    </section>
  );
}
