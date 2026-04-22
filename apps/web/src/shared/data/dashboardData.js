export const studentDashboardData = {
  summary: {
    applicationsSubmitted: 12,
    offersReceived: 2
  },
  featuredPlacements: [
    {
      id: "f1",
      company: "Fyndr Labs",
      title: "Associate Software Engineer",
      package: "11.5 LPA",
      location: "Bengaluru",
      skills: ["Node.js", "React", "SQL"],
      personalizedReason: "Strong fit based on your full-stack profile"
    },
    {
      id: "f2",
      company: "Auric Systems",
      title: "Platform Developer",
      package: "14 LPA",
      location: "Hyderabad",
      skills: ["APIs", "PostgreSQL", "Testing"],
      personalizedReason: "Matches your backend and data skills"
    },
    {
      id: "f3",
      company: "Northstar AI",
      title: "Applied ML Engineer",
      package: "16 LPA",
      location: "Remote",
      skills: ["Python", "scikit-learn", "Analytics"],
      personalizedReason: "Recommended from your AI interest track"
    }
  ],
  applications: [
    { id: "a1", company: "Fyndr Labs", role: "Associate Software Engineer", status: "IN_PROGRESS" },
    { id: "a2", company: "Vertex Mobility", role: "Graduate Engineer Trainee", status: "ACTION_NEEDED" },
    { id: "a3", company: "Blue Prism Tech", role: "Systems Analyst", status: "REJECTED" },
    { id: "a4", company: "Northstar AI", role: "Applied ML Engineer", status: "OFFER_RECEIVED" }
  ],
  rounds: [
    {
      id: "r1",
      roundName: "Technical Interview",
      dateTime: "18 Apr 2026, 10:30 AM",
      mode: "Online",
      locationOrLink: "meet.google.com/orbiton-tech"
    },
    {
      id: "r2",
      roundName: "Aptitude Assessment",
      dateTime: "19 Apr 2026, 2:00 PM",
      mode: "Offline",
      locationOrLink: "Placement Hall A"
    }
  ],
  drives: [
    { id: "d1", company: "Fyndr Labs", role: "Associate Software Engineer", department: "CSE", status: "Open", package: 11.5, date: "2026-04-18" },
    { id: "d2", company: "Northstar AI", role: "Applied ML Engineer", department: "CSE", status: "Open", package: 16, date: "2026-04-20" },
    { id: "d3", company: "Crest Analytics", role: "Data Analyst", department: "IT", status: "Closed", package: 8, date: "2026-04-13" },
    { id: "d4", company: "Vertex Mobility", role: "Graduate Engineer Trainee", department: "EEE", status: "Open", package: 7.25, date: "2026-04-22" }
  ]
};

export const employerShowcase = [
  {
    id: "c1",
    name: "Northstar AI",
    tagline: "Applied intelligence for enterprise decision systems",
    activeOpenings: 3
  },
  {
    id: "c2",
    name: "Fyndr Labs",
    tagline: "Building modern commerce infrastructure",
    activeOpenings: 2
  },
  {
    id: "c3",
    name: "Vertex Mobility",
    tagline: "Smart mobility platforms for growing cities",
    activeOpenings: 4
  }
];

export const roleDashboardContent = {
  STUDENT: {
    title: "Student dashboard"
  },
  RECRUITER: {
    title: "Recruiter dashboard",
    metrics: [
      { label: "Active drives", value: "6", note: "3 closing this week" },
      { label: "Applicants", value: "184", note: "26 shortlisted" },
      { label: "Offers issued", value: "11", note: "5 awaiting response" }
    ],
    sections: [
      { title: "Upcoming rounds", items: ["Campus technical panel on 18 Apr", "HR discussions queued for 19 Apr"] },
      { title: "Review queue", items: ["14 profiles need shortlist decisions", "3 candidate records need updated round results"] },
      { title: "Pipeline health", items: ["Highest conversion in Software roles", "Analytics role needs broader shortlist"] }
    ]
  },
  FACULTY: {
    title: "Faculty dashboard",
    metrics: [
      { label: "Assigned students", value: "42", note: "8 need profile completion" },
      { label: "Upcoming rounds", value: "9", note: "4 students in final stages" },
      { label: "Attention needed", value: "6", note: "Academic or resume follow-up" }
    ],
    sections: [
      { title: "Students requiring attention", items: ["Resume missing for 3 students", "2 students have new backlog status"] },
      { title: "Recent updates", items: ["Marks uploaded for Semester 6", "Certifications added by 7 students"] },
      { title: "Placement activity", items: ["12 students moved to technical rounds", "2 new offers issued"] }
    ]
  },
  ADMIN: {
    title: "Admin dashboard",
    metrics: [
      { label: "Users", value: "1,284", note: "Across all active roles" },
      { label: "Role changes", value: "19", note: "Past 7 days" },
      { label: "Audit entries", value: "328", note: "Operational review ready" }
    ],
    sections: [
      { title: "Recent user actions", items: ["12 accounts activated", "4 recruiter profiles updated"] },
      { title: "Audit snapshot", items: ["Drive approvals logged", "Offer status changes captured"] },
      { title: "Placement overview", items: ["42 accepted placements", "17 offers pending student response"] }
    ]
  },
  TPO: {
    title: "TPO dashboard",
    metrics: [
      { label: "Placement rate", value: "68%", note: "Current graduating batch" },
      { label: "Active drives", value: "18", note: "Across 9 companies" },
      { label: "Pending confirmations", value: "7", note: "Offer to placement conversion queue" }
    ],
    sections: [
      { title: "Institute-wide rounds", items: ["5 rounds scheduled within 48 hours", "2 results pending validation"] },
      { title: "Participation trends", items: ["CSE strongest participation", "EEE applications growing this week"] },
      { title: "Offer queue", items: ["7 offers need placement confirmation", "3 accepted offers awaiting records"] }
    ]
  }
};

export const statusStyles = {
  IN_PROGRESS: {
    label: "In Progress",
    className: "status-progress"
  },
  ACTION_NEEDED: {
    label: "Action Needed",
    className: "status-action"
  },
  REJECTED: {
    label: "Rejected",
    className: "status-rejected"
  },
  OFFER_RECEIVED: {
    label: "Offer Received",
    className: "status-success"
  }
};
