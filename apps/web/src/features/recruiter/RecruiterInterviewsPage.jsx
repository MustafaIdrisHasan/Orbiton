import { recruiterDashboardData } from "./recruiterData";

const calendarSlots = [
  { day: "Mon", date: "21 Apr", items: ["Aisha - 11:00 AM", "Sneha - 2:00 PM"] },
  { day: "Tue", date: "22 Apr", items: ["Feedback review - 10:30 AM"] },
  { day: "Wed", date: "23 Apr", items: ["Panel sync - 1:00 PM"] },
  { day: "Thu", date: "24 Apr", items: ["Buffer slots open"] }
];

export function RecruiterInterviewsPage() {
  return (
    <section className="stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Recruiter Operations</p>
          <h2>Interview Management</h2>
          <p className="muted">Track scheduled interviews, view the weekly calendar, and capture panel feedback.</p>
        </div>
      </header>

      <div className="overview-grid">
        {recruiterDashboardData.interviews.map((interview) => (
          <article className="dashboard-card" key={interview.id}>
            <span className="metric-label">{interview.round}</span>
            <h3>{interview.candidate}</h3>
            <p className="card-note">{interview.driveTitle}</p>
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
          {calendarSlots.map((slot) => (
            <article className="dashboard-card" key={slot.date}>
              <span className="metric-label">
                {slot.day} • {slot.date}
              </span>
              <div className="detail-list">
                {slot.items.map((item) => (
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
            <select>
              {recruiterDashboardData.interviews.map((interview) => (
                <option key={interview.id}>{interview.candidate}</option>
              ))}
            </select>
          </label>
          <label className="settings-field">
            Recommendation
            <select>
              <option>Advance</option>
              <option>Hold</option>
              <option>Reject</option>
            </select>
          </label>
        </div>
        <label className="settings-field">
          Panel Feedback
          <textarea className="profile-input recruiter-textarea" placeholder="Capture interviewer notes, strengths, risks, and the final recommendation." />
        </label>
        <button className="button section-action" type="button">
          Save Feedback
        </button>
      </section>
    </section>
  );
}
