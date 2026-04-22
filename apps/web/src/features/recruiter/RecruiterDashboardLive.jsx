import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { recruiterDashboardData, recruiterStatusMeta } from "./recruiterData";
import {
  fetchRecruiterBroadcasts,
  fetchRecruiterCandidate,
  fetchRecruiterCandidates,
  fetchRecruiterDashboard,
  fetchRecruiterDrives,
  fetchRecruiterExports,
  rejectCandidate,
  scheduleFinalInterview,
  sendRecruiterBroadcast,
  shortlistCandidate
} from "../../shared/api/recruiter";

const funnelStages = ["APPLIED", "SHORTLISTED", "INTERVIEW", "SELECTED", "OFFERED"];

function buildFunnelCounts(candidates) {
  return funnelStages.map((status) => ({
    status,
    count: candidates.filter((candidate) => candidate.status === status).length
  }));
}

function buildDepartmentCounts(candidates) {
  return Object.entries(
    candidates.reduce((acc, candidate) => {
      acc[candidate.branch] = (acc[candidate.branch] || 0) + 1;
      return acc;
    }, {})
  );
}

function buildGenderCounts(candidates) {
  return candidates.reduce(
    (acc, candidate) => {
      if (candidate.gender === "Female") {
        acc.female += 1;
      } else if (candidate.gender === "Male") {
        acc.male += 1;
      } else {
        acc.other += 1;
      }

      return acc;
    },
    { male: 0, female: 0, other: 0 }
  );
}

function CandidateDrawer({ candidate, onClose, onAction }) {
  if (!candidate) {
    return null;
  }

  return (
    <>
      <button aria-label="Close candidate drawer" className="drawer-backdrop" type="button" onClick={onClose} />
      <aside className="candidate-drawer">
        <header className="drawer-header">
          <div>
            <p className="eyebrow">Candidate Profile</p>
            <h2>{candidate.name}</h2>
            <p className="muted">
              {candidate.rollNumber} • {candidate.branch} • {candidate.year}
            </p>
            <Link className="subtle" to={`/recruiter/candidates/${candidate.id}`}>
              Open full candidate page
            </Link>
          </div>
          <button className="drawer-close" type="button" onClick={onClose}>
            Close
          </button>
        </header>

        <section className="candidate-drawer-section">
          <h3>Personal Details</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="subtle">Gender</span>
              <strong>{candidate.gender}</strong>
            </div>
            <div className="detail-item">
              <span className="subtle">Phone</span>
              <strong>{candidate.phone}</strong>
            </div>
            <div className="detail-item">
              <span className="subtle">Email</span>
              <strong>{candidate.email}</strong>
            </div>
            <div className="detail-item">
              <span className="subtle">Current Status</span>
              <strong>{recruiterStatusMeta[candidate.status].label}</strong>
            </div>
          </div>
        </section>

        <section className="candidate-drawer-section">
          <h3>Academic Performance</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="subtle">CGPA</span>
              <strong>{candidate.cgpa}</strong>
            </div>
            <div className="detail-item">
              <span className="subtle">Backlogs</span>
              <strong>{candidate.backlogs}</strong>
            </div>
            <div className="detail-item">
              <span className="subtle">10th</span>
              <strong>{candidate.academics.tenth}</strong>
            </div>
            <div className="detail-item">
              <span className="subtle">12th</span>
              <strong>{candidate.academics.twelfth}</strong>
            </div>
          </div>
        </section>

        <section className="candidate-drawer-section">
          <h3>Skills And Projects</h3>
          <div className="pill-row">
            {candidate.skills.map((skill) => (
              <span className="soft-pill" key={skill}>
                {skill}
              </span>
            ))}
          </div>
          <div className="detail-list">
            {candidate.projects.map((project) => (
              <div className="detail-item" key={project}>
                <strong>{project}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="candidate-drawer-section">
          <h3>Resume Preview</h3>
          <div className="detail-item">
            <p className="card-note">{candidate.resumePreview}</p>
          </div>
        </section>

        <section className="candidate-drawer-section">
          <h3>Test Scores</h3>
          <div className="detail-grid">
            {candidate.testScores.map((score) => (
              <div className="detail-item" key={score.label}>
                <span className="subtle">{score.label}</span>
                <strong>{score.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="candidate-drawer-section">
          <h3>Recruiter Notes</h3>
          <div className="detail-item">
            <p className="card-note">{candidate.notes}</p>
          </div>
        </section>

        <div className="drawer-actions">
          <button className="button" type="button" onClick={() => onAction(candidate.id, "SHORTLISTED")}>
            Shortlist
          </button>
          <button className="button button-secondary" type="button" onClick={() => onAction(candidate.id, "INTERVIEW")}>
            Schedule Interview
          </button>
          <button className="button button-danger" type="button" onClick={() => onAction(candidate.id, "REJECTED")}>
            Reject
          </button>
        </div>
      </aside>
    </>
  );
}

function FloatingCommunicationPanel({
  open,
  activeDrive,
  audience,
  message,
  broadcasts,
  onClose,
  onAudienceChange,
  onMessageChange,
  onSend
}) {
  if (!open || !activeDrive) {
    return null;
  }

  return (
    <aside className="communication-panel">
      <div className="drawer-header">
        <div>
          <p className="eyebrow">Communication Panel</p>
          <h2>{activeDrive.title}</h2>
        </div>
        <button className="drawer-close" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <label className="settings-field">
        Send To
        <select value={audience} onChange={(event) => onAudienceChange(event.target.value)}>
          <option>All applicants</option>
          <option>Shortlisted candidates</option>
          <option>Interview candidates</option>
          <option>Selected candidates</option>
        </select>
      </label>

      <label className="settings-field">
        Broadcast Message
        <textarea
          className="profile-input recruiter-textarea"
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="Write a drive update, schedule note, or document reminder..."
        />
      </label>

      <button className="button" type="button" onClick={onSend}>
        Send Broadcast
      </button>

      <section className="dashboard-section slim-section">
        <div className="section-heading">
          <h3>Recent Messages</h3>
        </div>
        <div className="detail-list">
          {broadcasts.map((broadcast) => (
            <div className="detail-item" key={broadcast.id}>
              <strong>{broadcast.sentTo}</strong>
              <span className="subtle">{broadcast.sentAt}</span>
              <p className="card-note">{broadcast.message}</p>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

export function RecruiterDashboardLive() {
  const fallbackDrive = recruiterDashboardData.drives[0];
  const [driveOptions, setDriveOptions] = useState(
    recruiterDashboardData.drives.map((drive) => ({
      id: drive.id,
      title: drive.title,
      openings: drive.openings,
      applicationDeadline: drive.applicationDeadline
    }))
  );
  const [selectedDriveId, setSelectedDriveId] = useState(fallbackDrive.id);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [branchFilter, setBranchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [cgpaMin, setCgpaMin] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("serial-asc");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [communicationOpen, setCommunicationOpen] = useState(false);
  const [messageAudience, setMessageAudience] = useState("All applicants");
  const [messageDraft, setMessageDraft] = useState("");
  const [exportOptions, setExportOptions] = useState(recruiterDashboardData.exports);
  const [broadcasts, setBroadcasts] = useState(recruiterDashboardData.broadcasts);
  const [dashboard, setDashboard] = useState({
    activeDrive: fallbackDrive,
    funnel: buildFunnelCounts(fallbackDrive.candidates),
    quickStats: {
      totalApplications: fallbackDrive.candidates.length,
      shortlistedCandidates: fallbackDrive.candidates.filter((candidate) => candidate.status === "SHORTLISTED").length,
      selectedCandidates: fallbackDrive.candidates.filter((candidate) => candidate.status === "SELECTED").length
    },
    demographics: {
      genderRatio: buildGenderCounts(fallbackDrive.candidates),
      departmentCounts: buildDepartmentCounts(fallbackDrive.candidates).map(([department, count]) => ({ department, count }))
    }
  });
  const [candidates, setCandidates] = useState(fallbackDrive.candidates);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const activeDrive = dashboard?.activeDrive || fallbackDrive;
  const funnelCounts = dashboard?.funnel?.length ? dashboard.funnel : buildFunnelCounts(candidates);
  const genderCounts = dashboard?.demographics?.genderRatio || buildGenderCounts(candidates);
  const departmentCounts =
    dashboard?.demographics?.departmentCounts?.length
      ? dashboard.demographics.departmentCounts.map((item) => [item.department, item.count])
      : buildDepartmentCounts(candidates);

  const filteredCandidates = useMemo(() => {
    const candidateSet = [...candidates]
      .filter((candidate) => branchFilter === "All" || candidate.branch === branchFilter)
      .filter((candidate) => statusFilter === "All" || candidate.status === statusFilter)
      .filter((candidate) => !cgpaMin || candidate.cgpa >= Number(cgpaMin))
      .filter((candidate) => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) {
          return true;
        }

        return (
          candidate.name.toLowerCase().includes(query) ||
          candidate.rollNumber.toLowerCase().includes(query) ||
          String(candidate.serialNo).includes(query)
        );
      });

    candidateSet.sort((left, right) => {
      switch (sortOrder) {
        case "name-asc":
          return left.name.localeCompare(right.name);
        case "name-desc":
          return right.name.localeCompare(left.name);
        case "serial-desc":
          return right.serialNo - left.serialNo;
        default:
          return left.serialNo - right.serialNo;
      }
    });

    return candidateSet;
  }, [branchFilter, candidates, cgpaMin, searchTerm, sortOrder, statusFilter]);

  useEffect(() => {
    let ignore = false;

    async function loadSelectors() {
      try {
        const [drives, exportsList] = await Promise.all([fetchRecruiterDrives(), fetchRecruiterExports()]);
        if (ignore) {
          return;
        }

        if (drives.length) {
          setDriveOptions(drives);
          if (!drives.some((drive) => drive.id === selectedDriveId)) {
            setSelectedDriveId(drives[0].id);
          }
        }

        if (exportsList.length) {
          setExportOptions(exportsList);
        }
      } catch (_error) {
        // Fallback data keeps the UI usable during backend unavailability.
      }
    }

    loadSelectors();

    return () => {
      ignore = true;
    };
  }, [selectedDriveId]);

  useEffect(() => {
    let ignore = false;

    async function loadDriveData() {
      setIsLoading(true);
      setLoadError("");

      try {
        const [liveDashboard, liveCandidates, liveBroadcasts] = await Promise.all([
          fetchRecruiterDashboard(selectedDriveId),
          fetchRecruiterCandidates(selectedDriveId),
          fetchRecruiterBroadcasts(selectedDriveId)
        ]);

        if (ignore) {
          return;
        }

        setDashboard(liveDashboard);
        setCandidates(liveCandidates.items);
        setBroadcasts((current) => {
          const fallbackForDrive = current.filter((item) => item.driveId !== selectedDriveId);
          return [...liveBroadcasts, ...fallbackForDrive];
        });
      } catch (error) {
        if (!ignore) {
          setLoadError(error.message || "Unable to load recruiter data.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadDriveData();

    return () => {
      ignore = true;
    };
  }, [selectedDriveId]);

  useEffect(() => {
    let ignore = false;

    async function loadCandidate() {
      if (!selectedCandidateId) {
        setSelectedCandidate(null);
        return;
      }

      try {
        const candidate = await fetchRecruiterCandidate(selectedCandidateId);
        if (!ignore) {
          setSelectedCandidate(candidate);
        }
      } catch (_error) {
        if (!ignore) {
          setSelectedCandidate(null);
        }
      }
    }

    loadCandidate();

    return () => {
      ignore = true;
    };
  }, [selectedCandidateId]);

  async function refreshDriveData() {
    const [liveDashboard, liveCandidates, liveBroadcasts] = await Promise.all([
      fetchRecruiterDashboard(selectedDriveId),
      fetchRecruiterCandidates(selectedDriveId),
      fetchRecruiterBroadcasts(selectedDriveId)
    ]);

    setDashboard(liveDashboard);
    setCandidates(liveCandidates.items);
    setBroadcasts((current) => {
      const fallbackForDrive = current.filter((item) => item.driveId !== selectedDriveId);
      return [...liveBroadcasts, ...fallbackForDrive];
    });
  }

  async function updateCandidateStatus(candidateId, nextStatus) {
    if (nextStatus === "SHORTLISTED") {
      await shortlistCandidate(candidateId);
    } else if (nextStatus === "INTERVIEW") {
      await scheduleFinalInterview(candidateId);
    } else if (nextStatus === "REJECTED") {
      await rejectCandidate(candidateId);
    }

    await refreshDriveData();

    if (selectedCandidateId === candidateId) {
      const candidate = await fetchRecruiterCandidate(candidateId);
      setSelectedCandidate(candidate);
    }
  }

  async function handleSendBroadcast() {
    const trimmedMessage = messageDraft.trim();
    if (!trimmedMessage) {
      return;
    }

    const broadcast = await sendRecruiterBroadcast({
      driveId: activeDrive.id,
      audience: messageAudience,
      message: trimmedMessage
    });

    setBroadcasts((current) => [broadcast, ...current.filter((item) => item.id !== broadcast.id)]);
    setMessageDraft("");
  }

  if (!activeDrive) {
    return (
      <section className="empty-state">
        <p className="eyebrow">Recruiter Dashboard</p>
        <h2>No drives available</h2>
        <p className="muted">Once recruiter drives are assigned, this dashboard will load live pipeline data.</p>
      </section>
    );
  }

  return (
    <section className="dashboard-stack recruiter-dashboard">
      <section className="hero-banner recruiter-hero">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Recruiter Dashboard</p>
            <h1 className="hero-title">
              {activeDrive.title} ({activeDrive.openings})
            </h1>
            <p className="muted">
              {activeDrive.company} • {activeDrive.location}
            </p>
          </div>
          <div className="recruiter-hero-actions">
            <label className="settings-field recruiter-drive-select">
              Active Drive
              <select value={selectedDriveId} onChange={(event) => setSelectedDriveId(event.target.value)}>
                {driveOptions.map((drive) => (
                  <option key={drive.id} value={drive.id}>
                    {drive.title}
                  </option>
                ))}
              </select>
            </label>
            <Link className="button" to="/drives/mine">
              Edit Drive
            </Link>
          </div>
        </div>

        <div className="recruiter-hero-grid">
          <section className="dashboard-card funnel-card">
            <div className="section-heading">
              <div>
                <h2>Recruitment Funnel</h2>
                <p className="subtle">Final deadline: {activeDrive.applicationDeadline}</p>
              </div>
            </div>

            <div className="funnel-grid">
              {funnelCounts.map((stage) => (
                <article className="funnel-stage" key={stage.status}>
                  <span className="metric-label">{recruiterStatusMeta[stage.status].label}</span>
                  <strong>{stage.count}</strong>
                </article>
              ))}
            </div>

            <div className="status-metrics recruiter-summary-metrics">
              <article className="dashboard-card">
                <span className="metric-label">Applications Received</span>
                <strong>{dashboard.quickStats?.totalApplications ?? candidates.length}</strong>
              </article>
              <article className="dashboard-card">
                <span className="metric-label">Shortlisted Candidates</span>
                <strong>{dashboard.quickStats?.shortlistedCandidates ?? 0}</strong>
              </article>
              <article className="dashboard-card recruiter-highlight-card">
                <span className="metric-label">Selected Candidates</span>
                <strong>{dashboard.quickStats?.selectedCandidates ?? 0}</strong>
              </article>
            </div>
          </section>

          <section className="recruiter-side-stack">
            <article className="dashboard-card">
              <div className="section-heading">
                <h3>Round Deadlines</h3>
              </div>
              <div className="detail-list">
                {(activeDrive.roundDeadlines || []).map((deadline) => (
                  <div className="detail-item" key={deadline.id}>
                    <strong>{deadline.label}</strong>
                    <span className="subtle">{deadline.date}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="dashboard-card">
              <div className="section-heading">
                <h3>Male/Female Ratio</h3>
              </div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="subtle">Male</span>
                  <strong>{genderCounts.male}</strong>
                </div>
                <div className="detail-item">
                  <span className="subtle">Female</span>
                  <strong>{genderCounts.female}</strong>
                </div>
              </div>
            </article>

            <article className="dashboard-card">
              <div className="section-heading">
                <h3>Applicants By Department</h3>
              </div>
              <div className="detail-list">
                {departmentCounts.map(([department, count]) => (
                  <div className="detail-item" key={department}>
                    <strong>{department}</strong>
                    <span className="subtle">{count} applicants</span>
                  </div>
                ))}
              </div>
              <p className="card-note recruiter-note">{activeDrive.notes || "Live recruiter dashboard data is active."}</p>
            </article>
          </section>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Candidate List</h2>
            <span className="subtle">Search, filter, and advance candidates within the selected drive.</span>
          </div>
          <div className="actions">
            <Link className="button button-secondary" to="/recruiter/interviews">
              Interview Management
            </Link>
            <div className="menu-shell">
              <button className="button button-secondary" type="button" onClick={() => setExportMenuOpen((current) => !current)}>
                Exports / Reports
              </button>
              {exportMenuOpen ? (
                <div className="menu-dropdown">
                  {exportOptions.map((item) => (
                    <button className="menu-item" key={item.id} type="button">
                      <span>{item.label}</span>
                      <small>{item.format}</small>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="filters-bar recruiter-filter-bar">
          <label>
            Search
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Name, roll number, or S.No."
            />
          </label>
          <label>
            Branch
            <select value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}>
              <option>All</option>
              <option>CSE</option>
              <option>ECE</option>
              <option>EEE</option>
              <option>IT</option>
            </select>
          </label>
          <label>
            CGPA Min
            <input type="number" min="0" max="10" step="0.1" value={cgpaMin} onChange={(event) => setCgpaMin(event.target.value)} />
          </label>
          <label>
            Application Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All</option>
              {Object.keys(recruiterStatusMeta).map((status) => (
                <option key={status} value={status}>
                  {recruiterStatusMeta[status].label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Order
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              <option value="serial-asc">S.No. ascending</option>
              <option value="serial-desc">S.No. descending</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
          </label>
        </div>

        {loadError ? <p className="form-error">{loadError}</p> : null}
        {isLoading ? <p className="subtle">Loading live recruiter data...</p> : null}

        <div className="candidate-table-shell">
          <table className="candidate-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Name</th>
                <th>Branch</th>
                <th>Roll Number</th>
                <th>CGPA</th>
                <th>No. of Backlogs</th>
                <th>Skills</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td>{candidate.serialNo}</td>
                  <td>
                    <button className="candidate-link" type="button" onClick={() => setSelectedCandidateId(candidate.id)}>
                      {candidate.name}
                    </button>
                  </td>
                  <td>{candidate.branch}</td>
                  <td>{candidate.rollNumber}</td>
                  <td>{candidate.cgpa}</td>
                  <td>{candidate.backlogs}</td>
                  <td>
                    <div className="pill-row compact-pills">
                      {candidate.skills.map((skill) => (
                        <span className="soft-pill" key={skill}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`status-chip ${recruiterStatusMeta[candidate.status].tone}`}>
                      {recruiterStatusMeta[candidate.status].label}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="table-icon-button" title="Shortlist" type="button" onClick={() => updateCandidateStatus(candidate.id, "SHORTLISTED")}>
                        SL
                      </button>
                      <button className="table-icon-button" title="Schedule final interview" type="button" onClick={() => updateCandidateStatus(candidate.id, "INTERVIEW")}>
                        FI
                      </button>
                      <button className="table-icon-button danger" title="Reject" type="button" onClick={() => updateCandidateStatus(candidate.id, "REJECTED")}>
                        RJ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <button className="floating-inbox-button" type="button" onClick={() => setCommunicationOpen(true)}>
        Drive Inbox
      </button>

      <CandidateDrawer
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidateId(null)}
        onAction={async (candidateId, nextStatus) => {
          await updateCandidateStatus(candidateId, nextStatus);
          setSelectedCandidateId(candidateId);
        }}
      />

      <FloatingCommunicationPanel
        open={communicationOpen}
        activeDrive={activeDrive}
        audience={messageAudience}
        message={messageDraft}
        broadcasts={broadcasts.filter((broadcast) => broadcast.driveId === activeDrive.id)}
        onClose={() => setCommunicationOpen(false)}
        onAudienceChange={setMessageAudience}
        onMessageChange={setMessageDraft}
        onSend={handleSendBroadcast}
      />
    </section>
  );
}
