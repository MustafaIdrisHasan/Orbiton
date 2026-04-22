export const recruiterDashboardData = {
  drives: [
    {
      id: "drive-northstar-ase",
      title: "Associate Software Engineer",
      company: "Northstar AI",
      openings: 8,
      location: "Bengaluru",
      applicationDeadline: "24 Apr 2026",
      roundDeadlines: [
        { id: "rd1", label: "Shortlist freeze", date: "18 Apr 2026" },
        { id: "rd2", label: "Technical interviews", date: "21 Apr 2026" },
        { id: "rd3", label: "Final decision", date: "25 Apr 2026" }
      ],
      notes: "Focus on backend and problem-solving profiles with strong academic consistency.",
      candidates: [
        {
          id: "cand-101",
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
          phone: "+91 98822 30001",
          projects: ["Campus hiring portal", "Realtime notice system"],
          resumePreview: "Backend-heavy full-stack resume with project links and internship experience.",
          academics: {
            tenth: "94.2%",
            twelfth: "92.6%",
            cgpaTrend: "8.7 -> 9.1"
          },
          testScores: [
            { label: "Aptitude", value: "84 / 100" },
            { label: "Coding", value: "4 / 5 problems" }
          ],
          notes: "Strong communication and a consistent full-stack project portfolio."
        },
        {
          id: "cand-102",
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
          phone: "+91 98822 30002",
          projects: ["Drive tracker API", "Inventory dashboard"],
          resumePreview: "API-focused resume with strong project ownership and internship summary.",
          academics: {
            tenth: "91.0%",
            twelfth: "88.4%",
            cgpaTrend: "8.1 -> 8.5"
          },
          testScores: [{ label: "Aptitude", value: "79 / 100" }],
          notes: "Needs closer review for coding depth, but backend alignment is promising."
        },
        {
          id: "cand-103",
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
          phone: "+91 98822 30003",
          projects: ["Resume scorer", "Placement analytics predictor"],
          resumePreview: "ML-first resume with analytics, research mini-projects, and hackathon wins.",
          academics: {
            tenth: "95.4%",
            twelfth: "93.7%",
            cgpaTrend: "9.0 -> 9.3"
          },
          testScores: [
            { label: "Coding", value: "5 / 5 problems" },
            { label: "Interview score", value: "8.6 / 10" }
          ],
          notes: "Excellent fit for intelligence roadmap and data-heavy backend work."
        },
        {
          id: "cand-104",
          serialNo: 4,
          name: "Arun Thomas",
          branch: "ECE",
          rollNumber: "ORB-2026-133",
          cgpa: 7.9,
          backlogs: 1,
          skills: ["C", "IoT", "Embedded Systems"],
          gender: "Male",
          year: "Final Year",
          status: "REJECTED",
          currentRound: "Application Review",
          email: "arun.thomas@orbiton.local",
          phone: "+91 98822 30004",
          projects: ["Smart attendance device"],
          resumePreview: "Embedded and hardware-led resume with limited software depth.",
          academics: {
            tenth: "89.1%",
            twelfth: "85.0%",
            cgpaTrend: "7.6 -> 7.9"
          },
          testScores: [{ label: "Aptitude", value: "61 / 100" }],
          notes: "Rejected due to role mismatch and backlog threshold."
        },
        {
          id: "cand-105",
          serialNo: 5,
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
          phone: "+91 98822 30005",
          projects: ["Placement workflow engine", "Campus social app"],
          resumePreview: "Strong systems and backend experience with clean academic record.",
          academics: {
            tenth: "93.0%",
            twelfth: "90.1%",
            cgpaTrend: "8.4 -> 8.9"
          },
          testScores: [
            { label: "Coding", value: "4 / 5 problems" },
            { label: "Interview score", value: "9.0 / 10" }
          ],
          notes: "Offer draft ready after compensation approval."
        },
        {
          id: "cand-106",
          serialNo: 6,
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
          phone: "+91 98822 30006",
          projects: ["QA reporting dashboard", "Bug triage board"],
          resumePreview: "Testing-focused resume with automation and reporting experience.",
          academics: {
            tenth: "90.4%",
            twelfth: "87.8%",
            cgpaTrend: "7.8 -> 8.1"
          },
          testScores: [{ label: "Interview score", value: "8.1 / 10" }],
          notes: "Offer sent and awaiting candidate response."
        }
      ]
    },
    {
      id: "drive-northstar-platform",
      title: "Platform Developer",
      company: "Northstar AI",
      openings: 5,
      location: "Hyderabad",
      applicationDeadline: "30 Apr 2026",
      roundDeadlines: [
        { id: "rd4", label: "Assessment lock", date: "23 Apr 2026" },
        { id: "rd5", label: "Panel interviews", date: "27 Apr 2026" },
        { id: "rd6", label: "Offer release", date: "02 May 2026" }
      ],
      notes: "Prioritize database, API design, and testability for this platform-focused role.",
      candidates: [
        {
          id: "cand-201",
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
          phone: "+91 98822 40001",
          projects: ["Workflow engine", "OpenAPI client generator"],
          resumePreview: "Backend and infra-aligned resume with strong systems depth.",
          academics: {
            tenth: "92.2%",
            twelfth: "89.0%",
            cgpaTrend: "8.3 -> 8.8"
          },
          testScores: [{ label: "Aptitude", value: "81 / 100" }],
          notes: "Potential shortlist candidate for platform role."
        },
        {
          id: "cand-202",
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
          phone: "+91 98822 40002",
          projects: ["Lab automation toolkit"],
          resumePreview: "Automation-oriented resume with strong Linux fundamentals.",
          academics: {
            tenth: "90.0%",
            twelfth: "88.2%",
            cgpaTrend: "7.6 -> 8.0"
          },
          testScores: [{ label: "Aptitude", value: "83 / 100" }],
          notes: "Useful cross-disciplinary profile with platform support potential."
        },
        {
          id: "cand-203",
          serialNo: 3,
          name: "Jovin Mathew",
          branch: "IT",
          rollNumber: "ORB-2026-174",
          cgpa: 8.4,
          backlogs: 0,
          skills: ["Node.js", "Redis", "CI"],
          gender: "Male",
          year: "Final Year",
          status: "INTERVIEW",
          currentRound: "Technical Panel",
          email: "jovin.mathew@orbiton.local",
          phone: "+91 98822 40003",
          projects: ["Pipeline monitor", "Campus event backend"],
          resumePreview: "Solid backend candidate with delivery-focused project work.",
          academics: {
            tenth: "91.5%",
            twelfth: "88.8%",
            cgpaTrend: "8.0 -> 8.4"
          },
          testScores: [{ label: "Coding", value: "4 / 5 problems" }],
          notes: "Final panel should probe architecture clarity."
        }
      ]
    }
  ],
  interviews: [
    {
      id: "int-1",
      candidate: "Aisha Rahman",
      driveTitle: "Associate Software Engineer",
      round: "Technical Interview",
      slot: "21 Apr 2026, 11:00 AM",
      mode: "Online",
      panel: "Backend Panel A",
      feedbackStatus: "Pending"
    },
    {
      id: "int-2",
      candidate: "Sneha Pillai",
      driveTitle: "Associate Software Engineer",
      round: "Managerial Round",
      slot: "22 Apr 2026, 2:00 PM",
      mode: "Offline",
      panel: "Hiring Committee Room 2",
      feedbackStatus: "Submitted"
    },
    {
      id: "int-3",
      candidate: "Jovin Mathew",
      driveTitle: "Platform Developer",
      round: "Technical Panel",
      slot: "27 Apr 2026, 10:00 AM",
      mode: "Online",
      panel: "Platform Review Board",
      feedbackStatus: "Pending"
    }
  ],
  broadcasts: [
    {
      id: "msg-1",
      driveId: "drive-northstar-ase",
      sentTo: "All applicants",
      sentAt: "17 Apr 2026, 09:30 AM",
      message: "Technical interview slots will be published by 6 PM today. Keep your resumes updated."
    },
    {
      id: "msg-2",
      driveId: "drive-northstar-ase",
      sentTo: "Shortlisted candidates",
      sentAt: "16 Apr 2026, 04:10 PM",
      message: "Shortlist released. Please confirm availability for the technical round."
    }
  ],
  exports: [
    { id: "all-resumes", label: "All resumes (current drive)", format: "ZIP bundle" },
    { id: "shortlisted", label: "Shortlisted candidates", format: "CSV + PDF summary" },
    { id: "selected", label: "Selected candidates", format: "CSV + PDF summary" },
    { id: "csv", label: "CSV export", format: "CSV" }
  ]
};

export const recruiterStatusMeta = {
  APPLIED: { label: "Applied", tone: "status-neutral" },
  SHORTLISTED: { label: "Shortlisted", tone: "status-progress" },
  INTERVIEW: { label: "Interview", tone: "status-action" },
  SELECTED: { label: "Selected", tone: "status-success" },
  OFFERED: { label: "Offered", tone: "status-success" },
  REJECTED: { label: "Rejected", tone: "status-rejected" }
};
