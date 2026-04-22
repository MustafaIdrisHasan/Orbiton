const recruiterStore = {
  recruiter: {
    id: "recruiter-1",
    userId: "demo-user",
    companyName: "Northstar AI",
    designation: "Senior Recruiter"
  },
  drives: [
    {
      id: "drive-northstar-ase",
      recruiterId: "recruiter-1",
      title: "Associate Software Engineer",
      description: "Backend-heavy campus role for full-stack and systems-oriented candidates.",
      openings: 8,
      location: "Bengaluru",
      applicationDeadline: "2026-04-24T18:00:00.000Z",
      status: "ACTIVE",
      isFeatured: true,
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
          email: "nikhil.george@orbiton.local",
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
          email: "rahul.prasad@orbiton.local",
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
      title: "Platform Developer",
      description: "Platform role emphasizing APIs, databases, testability, and delivery hygiene.",
      openings: 5,
      location: "Hyderabad",
      applicationDeadline: "2026-04-30T18:00:00.000Z",
      status: "ACTIVE",
      isFeatured: false,
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
      driveId: "drive-northstar-ase",
      audience: "All applicants",
      message: "Technical interview slots will be published by 6 PM today. Keep your resumes updated.",
      sentAt: "2026-04-17T09:30:00.000Z",
      isRead: false
    }
  ]
};

module.exports = {
  recruiterStore
};
