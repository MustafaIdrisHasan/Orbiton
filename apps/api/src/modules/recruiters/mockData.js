const recruiterStore = {
  recruiter: {
    id: "recruiter-1",
    userId: "demo-user",
    companyName: "Northstar AI",
    designation: "Senior Recruiter",
    industry: "Technology",
    description: "Enterprise applied intelligence, ML platforms, and high-scale backend services for global customers.",
    website: "https://northstar.example",
    logoUrl: null,
    lastVisitAt: "2026-04-19T10:00:00.000Z"
  },
  /** Additional recruiter orgs (may have zero linked drives) for company directory */
  allRecruiters: [
    {
      id: "recruiter-1",
      userId: "demo-user",
      companyName: "Northstar AI",
      designation: "Senior Recruiter",
      industry: "Technology",
      description: "Enterprise applied intelligence, ML platforms, and high-scale backend services for global customers.",
      website: "https://northstar.example",
      logoUrl: null,
      lastVisitAt: "2026-04-19T10:00:00.000Z"
    },
    {
      id: "recruiter-2",
      userId: "demo-user-2",
      companyName: "Auric Systems",
      designation: "Talent Partner",
      industry: "FinTech",
      description: "Payments and risk analytics. Previously active on campus; currently no open drives.",
      website: "https://auric.example",
      logoUrl: null,
      lastVisitAt: "2025-12-01T12:00:00.000Z"
    }
  ],
  drives: [
    {
      id: "drive-northstar-ase",
      recruiterId: "recruiter-1",
      createdAt: "2026-01-15T10:00:00.000Z",
      title: "Associate Software Engineer",
      description: "Backend-heavy campus role for full-stack and systems-oriented candidates.",
      openings: 8,
      location: "Bengaluru",
      applicationDeadline: "2026-04-24T18:00:00.000Z",
      status: "PUBLISHED",
      isFeatured: true,
      packageLpa: 14,
      employmentType: "FULL_TIME",
      eligibleDepartments: ["CSE", "IT", "ECE"],
      minCgpa: 7.5,
      maxBacklogs: 0,
      eligibleYears: ["Final Year"],
      requiredSkills: ["Node.js", "React", "SQL", "System design"],
      roundDeadlines: [
        { id: "rd1", label: "Shortlist freeze", date: "2026-04-18T17:00:00.000Z" },
        { id: "rd2", label: "Technical interviews", date: "2026-04-21T18:00:00.000Z" },
        { id: "rd3", label: "Final decision", date: "2026-04-25T18:00:00.000Z" }
      ],
      candidates: [
        {
          id: "app-101",
          serialNo: 1,
          name: "Aisha Rahman",
          branch: "CSE",
          rollNumber: "ORB-2026-101",
          cgpa: 9.1,
          backlogs: 0,
          skills: ["Node.js", "React", "SQL"],
          gender: "Female",
          year: "Final Year",
          status: "SHORTLISTED",
          currentRound: "Technical Interview",
          email: "aisha.rahman@orbiton.local",
          resumePreview: "Backend-heavy full-stack resume with project links and internship experience.",
          projects: ["Campus hiring portal", "Realtime notice system"],
          testScores: [
            { label: "Aptitude", value: "84 / 100" },
            { label: "Coding", value: "4 / 5 problems" }
          ],
          notes: "Strong communication and a consistent full-stack project portfolio."
        },
        {
          id: "app-102",
          serialNo: 2,
          name: "Nikhil George",
          branch: "IT",
          rollNumber: "ORB-2026-118",
          cgpa: 8.5,
          backlogs: 0,
          skills: ["Express", "PostgreSQL", "REST"],
          gender: "Male",
          year: "Final Year",
          status: "APPLIED",
          currentRound: "Application Review",
          email: "student@orbiton",
          resumePreview: "API-focused resume with strong project ownership and internship summary.",
          projects: ["Drive tracker API", "Inventory dashboard"],
          testScores: [{ label: "Aptitude", value: "79 / 100" }],
          notes: "Needs closer review for coding depth, but backend alignment is promising."
        },
        {
          id: "app-103",
          serialNo: 3,
          name: "Sneha Pillai",
          branch: "CSE",
          rollNumber: "ORB-2026-122",
          cgpa: 9.3,
          backlogs: 0,
          skills: ["Python", "scikit-learn", "Data Pipelines"],
          gender: "Female",
          year: "Final Year",
          status: "INTERVIEW",
          currentRound: "Managerial Round",
          email: "sneha.pillai@orbiton.local",
          resumePreview: "ML-first resume with analytics, research mini-projects, and hackathon wins.",
          projects: ["Resume scorer", "Placement analytics predictor"],
          testScores: [
            { label: "Coding", value: "5 / 5 problems" },
            { label: "Interview score", value: "8.6 / 10" }
          ],
          notes: "Excellent fit for intelligence roadmap and data-heavy backend work."
        },
        {
          id: "app-104",
          serialNo: 4,
          name: "Diya Menon",
          branch: "CSE",
          rollNumber: "ORB-2026-145",
          cgpa: 8.9,
          backlogs: 0,
          skills: ["Java", "Spring Boot", "System Design"],
          gender: "Female",
          year: "Final Year",
          status: "SELECTED",
          currentRound: "Finalized",
          email: "diya.menon@orbiton.local",
          resumePreview: "Strong systems and backend experience with clean academic record.",
          projects: ["Placement workflow engine", "Campus social app"],
          testScores: [
            { label: "Coding", value: "4 / 5 problems" },
            { label: "Interview score", value: "9.0 / 10" }
          ],
          notes: "Offer draft ready after compensation approval."
        },
        {
          id: "app-105",
          serialNo: 5,
          name: "Rahul Prasad",
          branch: "IT",
          rollNumber: "ORB-2026-149",
          cgpa: 8.1,
          backlogs: 0,
          skills: ["Testing", "Cypress", "SQL"],
          gender: "Male",
          year: "Final Year",
          status: "OFFERED",
          currentRound: "Offer Sent",
          email: "student@orbiton",
          offerPackageLpa: 12.5,
          offerJoiningDate: "2026-07-15T00:00:00.000Z",
          resumePreview: "Testing-focused resume with automation and reporting experience.",
          projects: ["QA reporting dashboard", "Bug triage board"],
          testScores: [{ label: "Interview score", value: "8.1 / 10" }],
          notes: "Offer sent and awaiting candidate response."
        }
      ]
    },
    {
      id: "drive-northstar-platform",
      recruiterId: "recruiter-1",
      createdAt: "2026-02-01T09:00:00.000Z",
      title: "Platform Developer",
      description: "Platform role emphasizing APIs, databases, testability, and delivery hygiene.",
      openings: 5,
      location: "Hyderabad",
      applicationDeadline: "2026-04-30T18:00:00.000Z",
      status: "PUBLISHED",
      isFeatured: false,
      packageLpa: 16,
      employmentType: "FULL_TIME",
      eligibleDepartments: ["CSE", "IT"],
      minCgpa: 8,
      maxBacklogs: 1,
      eligibleYears: ["Final Year"],
      requiredSkills: ["APIs", "PostgreSQL", "Docker", "Testing"],
      roundDeadlines: [
        { id: "rd4", label: "Assessment lock", date: "2026-04-23T17:00:00.000Z" },
        { id: "rd5", label: "Panel interviews", date: "2026-04-27T18:00:00.000Z" },
        { id: "rd6", label: "Offer release", date: "2026-05-02T18:00:00.000Z" }
      ],
      candidates: [
        {
          id: "app-201",
          serialNo: 1,
          name: "Farhan Ali",
          branch: "CSE",
          rollNumber: "ORB-2026-167",
          cgpa: 8.8,
          backlogs: 0,
          skills: ["APIs", "PostgreSQL", "Docker"],
          gender: "Male",
          year: "Final Year",
          status: "APPLIED",
          currentRound: "Application Review",
          email: "farhan.ali@orbiton.local",
          resumePreview: "Backend and infra-aligned resume with strong systems depth.",
          projects: ["Workflow engine", "OpenAPI client generator"],
          testScores: [{ label: "Aptitude", value: "81 / 100" }],
          notes: "Potential shortlist candidate for platform role."
        },
        {
          id: "app-202",
          serialNo: 2,
          name: "Meera Suresh",
          branch: "EEE",
          rollNumber: "ORB-2026-170",
          cgpa: 8.0,
          backlogs: 0,
          skills: ["Python", "Automation", "Linux"],
          gender: "Female",
          year: "Final Year",
          status: "SHORTLISTED",
          currentRound: "Technical Screening",
          email: "meera.suresh@orbiton.local",
          resumePreview: "Automation-oriented resume with strong Linux fundamentals.",
          projects: ["Lab automation toolkit"],
          testScores: [{ label: "Aptitude", value: "83 / 100" }],
          notes: "Useful cross-disciplinary profile with platform support potential."
        }
      ]
    },
    {
      id: "drive-crest-analytics",
      recruiterId: "recruiter-1",
      createdAt: "2025-12-10T12:00:00.000Z",
      title: "Data Analyst Intern",
      description: "Summer internship focused on dashboards, SQL, and stakeholder reporting.",
      openings: 3,
      location: "Remote",
      applicationDeadline: "2026-04-10T18:00:00.000Z",
      status: "CLOSED",
      isFeatured: false,
      packageLpa: 4.5,
      employmentType: "INTERNSHIP",
      eligibleDepartments: ["CSE", "IT", "ECE"],
      minCgpa: 7,
      maxBacklogs: 2,
      eligibleYears: ["Pre-final", "Final Year"],
      requiredSkills: ["SQL", "Excel", "Python"],
      roundDeadlines: [
        { id: "rd7", label: "Applications closed", date: "2026-04-10T18:00:00.000Z" }
      ],
      candidates: []
    },
    {
      id: "drive-draft-ml-ops",
      recruiterId: "recruiter-1",
      createdAt: "2026-04-18T08:00:00.000Z",
      title: "MLOps Engineer (Draft)",
      description: "Planned Q3 campus push — not yet published.",
      openings: 2,
      location: "Bengaluru",
      applicationDeadline: "2026-06-01T18:00:00.000Z",
      status: "DRAFT",
      isFeatured: false,
      packageLpa: 18,
      employmentType: "FULL_TIME",
      eligibleDepartments: ["CSE", "IT"],
      minCgpa: 7.5,
      maxBacklogs: 0,
      eligibleYears: ["Final Year"],
      requiredSkills: ["Python", "K8s", "ML"],
      roundDeadlines: [],
      candidates: []
    }
  ],
  interviews: [
    {
      id: "int-1",
      driveId: "drive-northstar-ase",
      candidateId: "app-101",
      candidateName: "Aisha Rahman",
      round: "Technical Interview",
      slot: "2026-04-21T11:00:00.000Z",
      mode: "Online",
      panel: "Backend Panel A",
      feedbackStatus: "PENDING"
    },
    {
      id: "int-2",
      driveId: "drive-northstar-ase",
      candidateId: "app-103",
      candidateName: "Sneha Pillai",
      round: "Managerial Round",
      slot: "2026-04-22T14:00:00.000Z",
      mode: "Offline",
      panel: "Hiring Committee Room 2",
      feedbackStatus: "SUBMITTED"
    },
    {
      id: "int-student-1",
      driveId: "drive-northstar-ase",
      candidateId: "app-102",
      candidateName: "Nikhil George",
      round: "Technical Interview",
      slot: "2026-04-21T15:30:00.000Z",
      mode: "Online",
      panel: "https://meet.example.com/orbiton-student",
      feedbackStatus: "PENDING"
    }
  ],
  exports: [
    { id: "all-resumes", label: "All resumes (current drive)", format: "ZIP" },
    { id: "shortlisted", label: "Shortlisted candidates", format: "CSV_PDF" },
    { id: "selected", label: "Selected candidates", format: "CSV_PDF" },
    { id: "csv", label: "CSV export", format: "CSV" }
  ],
  notifications: [
    {
      id: "msg-1",
      type: "ROUND",
      title: "Technical interview update",
      message: "Technical interview slots will be published by 6 PM today. Keep your resumes updated.",
      entityId: "int-1",
      driveId: "drive-northstar-ase",
      audience: "All applicants",
      source: "RECRUITER",
      sentAt: "2026-04-17T09:30:00.000Z",
      isRead: false
    },
    {
      id: "msg-2",
      type: "APPLICATION",
      title: "Application submitted",
      message: "You applied to Northstar AI – Associate Software Engineer.",
      entityId: "drive-northstar-ase",
      driveId: "drive-northstar-ase",
      source: "STUDENT",
      sentAt: "2026-04-16T14:20:00.000Z",
      isRead: true
    },
    {
      id: "msg-3",
      type: "SHORTLIST",
      title: "Shortlisted for Round 1",
      message: "You have been shortlisted for the technical screening round.",
      entityId: "app-101",
      driveId: "drive-northstar-ase",
      source: "RECRUITER",
      sentAt: "2026-04-16T11:00:00.000Z",
      isRead: false
    },
    {
      id: "msg-4",
      type: "ROUND",
      title: "Interview scheduled",
      message: "Technical Interview scheduled on 21 April, 11:00 AM (Online).",
      entityId: "int-1",
      driveId: "drive-northstar-ase",
      source: "RECRUITER",
      sentAt: "2026-04-15T09:00:00.000Z",
      isRead: false
    },
    {
      id: "msg-5",
      type: "OFFER",
      title: "Offer received",
      message: "You received an offer from Northstar AI for Associate Software Engineer.",
      entityId: "offer-app-105",
      driveId: "drive-northstar-ase",
      source: "RECRUITER",
      sentAt: "2026-04-14T16:45:00.000Z",
      isRead: false
    },
    {
      id: "msg-6",
      type: "DRIVE",
      title: "New drive opened",
      message: "New drive: Northstar AI – Platform Developer (Hyderabad).",
      entityId: "drive-northstar-platform",
      driveId: "drive-northstar-platform",
      source: "RECRUITER",
      sentAt: "2026-04-13T08:00:00.000Z",
      isRead: true
    },
    {
      id: "msg-7",
      type: "ANNOUNCEMENT",
      title: "Placement deadline extended",
      message: "TPO: Summer internship registration deadline extended to 30 April.",
      entityId: null,
      source: "INSTITUTION",
      sentAt: "2026-04-12T10:30:00.000Z",
      isRead: false
    }
  ],
  // Company-issued offers. Shape:
  // { id, applicationId, studentEmail, studentUserId, driveId, driveTitle,
  //   companyName, companyEmail, companyContact, role, packageLpa,
  //   joiningDate, note, status, createdAt }
  companyOffers: [],

  // In-memory chat rooms. Keyed by roomId (e.g. "company:northstar-ai").
  // Each value is an array of { id, roomId, from, fromRole, fromName, message, sentAt }.
  chatMessages: {}
};

module.exports = {
  recruiterStore
};
