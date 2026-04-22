const tpoDashboardData = {
  overview: {
    totalStudentsEligible: 920,
    totalApplications: 1684,
    studentsPlaced: 142,
    placementPercentage: "15.4%",
    activeDrives: 12
  },
  funnel: [
    { stage: "ELIGIBLE", count: 920, conversion: "100%" },
    { stage: "APPLIED", count: 684, conversion: "74.3%" },
    { stage: "SHORTLISTED", count: 312, conversion: "45.6%" },
    { stage: "SELECTED", count: 164, conversion: "52.6%" },
    { stage: "PLACED", count: 142, conversion: "86.6%" }
  ],
  alerts: [
    {
      id: "alert-approval",
      title: "Drives pending approval",
      value: "4 drives",
      note: "",
      cta: "Review drives",
      to: "/tpo/drives"
    },
    {
      id: "alert-resumes",
      title: "Students missing resumes",
      value: "73 students",
      cta: "Open students",
      to: "/tpo/students"
    },
    {
      id: "alert-departments",
      title: "Low participation departments",
      value: "EEE, Civil",
      note: "Application participation is below the target threshold this week.",
      cta: "View analytics",
      to: "/tpo/analytics"
    },
    {
      id: "alert-deadlines",
      title: "Upcoming deadlines",
      value: "5 clustered",
      note: "Application and shortlist deadlines overlap across three companies.",
      cta: "Check reports",
      to: "/tpo/reports"
    }
  ],
  activeDrives: [
    {
      id: "drv-1",
      company: "Northstar AI",
      role: "Associate Software Engineer",
      status: "Pending Approval",
      applicantsCount: 186,
      deadline: "24 Apr 2026",
      recruiter: "Nihal Joseph"
    },
    {
      id: "drv-2",
      company: "Fyndr Labs",
      role: "Platform Engineer",
      status: "Active",
      applicantsCount: 148,
      deadline: "27 Apr 2026",
      recruiter: "Ritika Sen"
    },
    {
      id: "drv-3",
      company: "Vertex Mobility",
      role: "Graduate Engineer Trainee",
      status: "Shortlisting",
      applicantsCount: 122,
      deadline: "20 Apr 2026",
      recruiter: "Alvin Mathew"
    },
    {
      id: "drv-4",
      company: "Auric Systems",
      role: "Data Analyst",
      status: "Interviewing",
      applicantsCount: 95,
      deadline: "30 Apr 2026",
      recruiter: "Farah Khan"
    }
  ],
  departmentStats: [
    { department: "CSE", applicants: 286, selected: 82, placementPercentage: "28.7%" },
    { department: "IT", applicants: 214, selected: 37, placementPercentage: "17.3%" },
    { department: "ECE", applicants: 118, selected: 16, placementPercentage: "13.6%" },
    { department: "EEE", applicants: 66, selected: 9, placementPercentage: "13.6%" }
  ],
  cgpaBands: [
    { label: "9.0 - 10.0", count: 96 },
    { label: "8.0 - 8.9", count: 248 },
    { label: "7.0 - 7.9", count: 301 },
    { label: "6.0 - 6.9", count: 179 },
    { label: "< 6.0", count: 96 }
  ],
  readiness: [
    { label: "Students with resume", percentage: 92 },
    { label: "Students with skills", percentage: 88 },
    { label: "Students with applications", percentage: 74 }
  ],
  applicationFlowAnalytics: {
    applicationsPerDrive: [
      { label: "Northstar AI", value: 186 },
      { label: "Fyndr Labs", value: 148 },
      { label: "Vertex Mobility", value: 122 },
      { label: "Auric Systems", value: 95 }
    ],
    dropOff: [
      { stage: "Eligible -> Applied", value: "25.7%" },
      { stage: "Applied -> Shortlisted", value: "54.4%" },
      { stage: "Shortlisted -> Selected", value: "47.4%" },
      { stage: "Selected -> Placed", value: "13.4%" }
    ],
    stageTimes: [
      { stage: "Application Review", value: "2.4 days avg" },
      { stage: "Shortlisting", value: "3.1 days avg" },
      { stage: "Interview Cycle", value: "5.2 days avg" },
      { stage: "Offer Confirmation", value: "2.0 days avg" }
    ]
  },
  offers: {
    totalOffersIssued: 178,
    acceptedOffers: 149,
    finalPlacements: 142,
    rows: [
      { id: "off-1", student: "Aisha Rahman", company: "Northstar AI", package: "11.5 LPA", status: "Accepted" },
      { id: "off-2", student: "Rahul Prasad", company: "Fyndr Labs", package: "9.8 LPA", status: "Offer Sent" },
      { id: "off-3", student: "Diya Menon", company: "Auric Systems", package: "12.2 LPA", status: "Placed" },
      { id: "off-4", student: "Farhan Ali", company: "Vertex Mobility", package: "7.4 LPA", status: "Accepted" }
    ]
  },
  studentManagement: {
    recentActive: [
      { id: "stu-1", name: "Aisha Rahman", detail: "Updated resume and interview preferences" },
      { id: "stu-2", name: "Nikhil George", detail: "Applied to 2 drives today" },
      { id: "stu-3", name: "Sneha Pillai", detail: "Uploaded new skill certifications" }
    ],
    attentionNeeded: [
      { id: "att-1", name: "Arun Thomas", reason: "No applications yet" },
      { id: "att-2", name: "Meera Suresh", reason: "Low CGPA threshold risk" },
      { id: "att-3", name: "Jovin Mathew", reason: "High backlog count flagged" }
    ]
  },
  reports: [
    { id: "rep-1", title: "Placement report", format: "CSV / PDF", note: "Institute-wide placement summary and offer conversion." },
    { id: "rep-2", title: "Department-wise report", format: "CSV / PDF", note: "Applicants, selections, and placement ratios by department." },
    { id: "rep-3", title: "Drive-wise report", format: "CSV / PDF", note: "Drive health, drop-off, status overrides, and recruiter activity." }
  ],
  announcements: {
    recent: [
      { id: "ann-1", audience: "All students", time: "17 Apr 2026, 08:30 AM", message: "Resume verification camp opens tomorrow in Placement Hall A." },
      { id: "ann-2", audience: "ECE Department", time: "16 Apr 2026, 04:00 PM", message: "Low participation warning and department mentor meeting scheduled." },
      { id: "ann-3", audience: "Northstar AI applicants", time: "15 Apr 2026, 06:15 PM", message: "Shortlist publication will be delayed by 12 hours." }
    ]
  }
};

const tpoStudents = [
  {
    id: "stu-1",
    name: "Aisha Rahman",
    department: "CSE",
    cgpa: 9.1,
    resume: "Uploaded",
    applications: 4,
    backlogs: 0,
    status: "Placed"
  },
  {
    id: "stu-2",
    name: "Nikhil George",
    department: "IT",
    cgpa: 8.5,
    resume: "Uploaded",
    applications: 2,
    backlogs: 0,
    status: "Active"
  },
  {
    id: "stu-3",
    name: "Arun Thomas",
    department: "ECE",
    cgpa: 7.9,
    resume: "Missing",
    applications: 0,
    backlogs: 1,
    status: "Attention"
  },
  {
    id: "stu-4",
    name: "Meera Suresh",
    department: "EEE",
    cgpa: 8.0,
    resume: "Uploaded",
    applications: 1,
    backlogs: 0,
    status: "Active"
  }
];

module.exports = {
  tpoDashboardData,
  tpoStudents
};
