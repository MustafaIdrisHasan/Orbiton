import { apiRequest } from "./client";

function formatTimestamp(value) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function mapRecruiterCandidateProfile(profile) {
  if (!profile) {
    return null;
  }

  return {
    id: profile.applicationId,
    driveId: profile.driveId,
    driveTitle: profile.driveTitle,
    name: profile.personalDetails?.name || "Candidate",
    rollNumber: profile.personalDetails?.rollNumber || "-",
    branch: profile.personalDetails?.branch || "-",
    year: profile.personalDetails?.year || "-",
    gender: profile.personalDetails?.gender || "-",
    email: profile.personalDetails?.email || "-",
    phone: profile.personalDetails?.phone || "Not available",
    cgpa: profile.academics?.cgpa ?? "-",
    backlogs: profile.academics?.backlogs ?? "-",
    skills: profile.skills || [],
    projects: profile.projects || [],
    resumePreview: profile.resumePreview || "Resume preview unavailable.",
    testScores: profile.testScores || [],
    notes: profile.notes || "No recruiter notes recorded yet.",
    status: profile.status,
    currentRound: profile.currentRound || "Application review",
    academics: {
      tenth: profile.academics?.tenth || "N/A",
      twelfth: profile.academics?.twelfth || "N/A"
    }
  };
}

function mapCandidateListItem(item) {
  return {
    id: item.applicationId,
    serialNo: item.serialNo,
    name: item.name,
    branch: item.branch,
    rollNumber: item.rollNumber,
    cgpa: item.cgpa,
    backlogs: item.backlogs,
    skills: item.skills || [],
    status: item.status,
    currentRound: item.currentRound || "Application review"
  };
}

function mapDriveOption(drive) {
  return {
    id: drive.id,
    title: drive.title,
    openings: drive.openings,
    applicationDeadline: formatTimestamp(drive.applicationDeadline),
    status: drive.status
  };
}

export async function fetchRecruiterDrives() {
  const data = await apiRequest("/api/v1/recruiter/drives");
  return (data.items || []).map(mapDriveOption);
}

export async function fetchRecruiterDashboard(driveId) {
  const query = driveId ? `?driveId=${encodeURIComponent(driveId)}` : "";
  const dashboard = await apiRequest(`/api/v1/recruiter/dashboard${query}`);

  return {
    recruiter: dashboard.recruiter,
    activeDrive: {
      id: dashboard.activeDrive.id,
      title: dashboard.activeDrive.title,
      openings: dashboard.activeDrive.openings,
      location: dashboard.activeDrive.location,
      company: dashboard.recruiter?.companyName || "Recruiter Company",
      applicationDeadline: formatTimestamp(dashboard.activeDrive.applicationDeadline),
      status: dashboard.activeDrive.status,
      roundDeadlines: (dashboard.activeDrive.roundDeadlines || []).map((deadline) => ({
        id: deadline.id,
        label: deadline.label,
        date: formatTimestamp(deadline.date)
      })),
      notes: "Live recruiter dashboard data is now loading from the backend."
    },
    funnel: dashboard.funnel || [],
    quickStats: dashboard.quickStats || {},
    demographics: dashboard.demographics || {}
  };
}

export async function fetchRecruiterCandidates(driveId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.branch && filters.branch !== "All") {
    params.set("branch", filters.branch);
  }
  if (filters.status && filters.status !== "All") {
    params.set("status", filters.status);
  }
  if (filters.cgpaMin) {
    params.set("cgpaMin", filters.cgpaMin);
  }
  if (filters.search) {
    params.set("search", filters.search);
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await apiRequest(`/api/v1/recruiter/drives/${driveId}/candidates${query}`);
  return {
    items: (data.items || []).map(mapCandidateListItem),
    total: data.total || 0
  };
}

export async function fetchRecruiterCandidate(candidateId) {
  const profile = await apiRequest(`/api/v1/recruiter/candidates/${candidateId}`);
  return mapRecruiterCandidateProfile(profile);
}

export async function shortlistCandidate(applicationId) {
  return apiRequest(`/api/v1/recruiter/applications/${applicationId}/shortlist`, { method: "POST" });
}

export async function rejectCandidate(applicationId) {
  return apiRequest(`/api/v1/recruiter/applications/${applicationId}/reject`, { method: "POST" });
}

export async function scheduleFinalInterview(applicationId) {
  return apiRequest(`/api/v1/recruiter/applications/${applicationId}/schedule-final-interview`, { method: "POST" });
}

export async function fetchRecruiterInterviews(driveId) {
  const query = driveId ? `?driveId=${encodeURIComponent(driveId)}` : "";
  const data = await apiRequest(`/api/v1/recruiter/interviews${query}`);
  return (data.items || []).map((item) => ({
    id: item.id,
    driveId: item.driveId,
    candidate: item.candidateName,
    round: item.round,
    slot: formatTimestamp(item.slot),
    mode: item.mode,
    panel: item.panel,
    feedbackStatus: item.feedbackStatus
  }));
}

export function createRecruiterInterview(payload) {
  return apiRequest("/api/v1/recruiter/interviews", {
    method: "POST",
    body: payload
  });
}

export async function fetchRecruiterBroadcasts(driveId) {
  const query = driveId ? `?driveId=${encodeURIComponent(driveId)}` : "";
  const data = await apiRequest(`/api/v1/recruiter/communications${query}`);
  return (data.items || []).map((item) => ({
    id: item.id,
    driveId: item.driveId,
    sentTo: item.audience,
    sentAt: formatTimestamp(item.sentAt),
    message: item.message
  }));
}

export async function sendRecruiterBroadcast(payload) {
  const data = await apiRequest("/api/v1/recruiter/communications/broadcast", {
    method: "POST",
    body: payload
  });

  return {
    id: data.item.id,
    driveId: data.item.driveId,
    sentTo: data.item.audience,
    sentAt: formatTimestamp(data.item.sentAt),
    message: data.item.message
  };
}

export async function fetchRecruiterExports() {
  const data = await apiRequest("/api/v1/recruiter/reports/exports");
  return data.items || [];
}
