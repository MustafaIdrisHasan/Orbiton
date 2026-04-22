const adminDashboardData = {
  overview: {
    totalUsers: 1284,
    activeUsers: 1162,
    totalStudents: 920,
    totalRecruiters: 42,
    activeDrives: 12,
    totalApplications: 1684,
    systemHealth: "Normal"
  },
  alerts: [
    {
      id: "adm-alert-1",
      title: "Suspicious login attempts",
      value: "14 flagged",
      note: "Repeated failed logins detected from two IP clusters in the last 12 hours.",
      cta: "Review logs",
      to: "/admin/logs"
    },
    {
      id: "adm-alert-2",
      title: "Failed authentication spikes",
      value: "3 spikes",
      note: "Authentication errors crossed the warning threshold during peak login windows.",
      cta: "Inspect activity",
      to: "/admin/logs"
    },
    {
      id: "adm-alert-3",
      title: "Inactive users",
      value: "87 accounts",
      note: "Accounts have not logged in for more than 30 days and may need review.",
      cta: "Open users",
      to: "/admin/users"
    },
    {
      id: "adm-alert-4",
      title: "Drives in invalid states",
      value: "2 drives",
      note: "Workflow mismatch between approvals and published deadlines was detected.",
      cta: "View drives",
      to: "/admin/drives"
    }
  ],
  users: [
    {
      id: "usr-1",
      name: "Aisha Rahman",
      email: "aisha.rahman@orbiton.local",
      role: "STUDENT",
      status: "Active",
      lastLogin: "17 Apr 2026, 08:14 AM",
      details: {
        phone: "+91 98822 30001",
        department: "CSE",
        roleInfo: "Student account with placement-ready profile",
        accountStatus: "Eligible and active",
        activitySummary: "Applied to 4 drives, resume updated yesterday."
      }
    },
    {
      id: "usr-2",
      name: "Nihal Joseph",
      email: "recruiter@orbiton.local",
      role: "RECRUITER",
      status: "Active",
      lastLogin: "17 Apr 2026, 09:05 AM",
      details: {
        phone: "+91 99887 76655",
        department: "Northstar AI",
        roleInfo: "Recruiter with 6 active drives",
        accountStatus: "Verified and active",
        activitySummary: "Shortlisted candidates and scheduled interviews this week."
      }
    },
    {
      id: "usr-3",
      name: "Hakeem Ahmed",
      email: "tpo@orbiton.local",
      role: "TPO",
      status: "Active",
      lastLogin: "17 Apr 2026, 07:40 AM",
      details: {
        phone: "+91 98111 00422",
        department: "Training & Placement Office",
        roleInfo: "Institution-wide placement oversight",
        accountStatus: "High-privilege operational account",
        activitySummary: "Published announcements and reviewed drive health."
      }
    },
    {
      id: "usr-4",
      name: "Farah Iqbal",
      email: "faculty@orbiton.local",
      role: "FACULTY",
      status: "Disabled",
      lastLogin: "11 Apr 2026, 05:20 PM",
      details: {
        phone: "+91 98450 12340",
        department: "Computer Science",
        roleInfo: "Faculty mentor for assigned students",
        accountStatus: "Temporarily disabled pending review",
        activitySummary: "Last reviewed student academic data six days ago."
      }
    },
    {
      id: "usr-5",
      name: "Amina Khan",
      email: "admin@orbiton.local",
      role: "ADMIN",
      status: "Active",
      lastLogin: "17 Apr 2026, 06:55 AM",
      details: {
        phone: "+91 99330 88012",
        department: "System Operations",
        roleInfo: "Platform superuser with RBAC access",
        accountStatus: "Administrative account",
        activitySummary: "Reviewed logs, changed roles, and exported audit data."
      }
    }
  ],
  roles: [
    { id: "role-student", name: "STUDENT", permissions: ["View drives", "Apply", "Manage resume", "View offers"] },
    { id: "role-recruiter", name: "RECRUITER", permissions: ["Manage drives", "Review applicants", "Schedule interviews", "Issue offers"] },
    { id: "role-tpo", name: "TPO", permissions: ["Oversee drives", "Broadcast announcements", "View analytics", "Export placement reports"] },
    { id: "role-faculty", name: "FACULTY", permissions: ["Monitor mentees", "Review academic readiness", "View department analytics"] },
    { id: "role-admin", name: "ADMIN", permissions: ["Manage users", "Modify roles", "Review logs", "Override drive states", "Export all data"] }
  ],
  logs: [
    { id: "log-1", timestamp: "17 Apr 2026, 09:12 AM", user: "admin@orbiton.local", action: "ROLE_UPDATE", entity: "user", status: "Success" },
    { id: "log-2", timestamp: "17 Apr 2026, 08:41 AM", user: "recruiter@orbiton.local", action: "LOGIN", entity: "session", status: "Success" },
    { id: "log-3", timestamp: "17 Apr 2026, 08:36 AM", user: "unknown@orbiton.local", action: "LOGIN", entity: "session", status: "Failure" },
    { id: "log-4", timestamp: "16 Apr 2026, 06:04 PM", user: "tpo@orbiton.local", action: "EXPORT_REPORT", entity: "placement_report", status: "Success" },
    { id: "log-5", timestamp: "16 Apr 2026, 03:25 PM", user: "admin@orbiton.local", action: "DISABLE_USER", entity: "user", status: "Success" }
  ],
  drives: [
    { id: "adm-drive-1", company: "Northstar AI", role: "Associate Software Engineer", status: "Pending Approval", createdBy: "Nihal Joseph" },
    { id: "adm-drive-2", company: "Fyndr Labs", role: "Platform Engineer", status: "Active", createdBy: "Ritika Sen" },
    { id: "adm-drive-3", company: "Auric Systems", role: "Data Analyst", status: "Invalid State", createdBy: "Farah Khan" }
  ],
  systemControls: [
    {
      id: "control-1",
      title: "System-wide notifications",
      description: "Trigger platform notices for all active roles when critical events occur."
    },
    {
      id: "control-2",
      title: "Feature locks",
      description: "Temporarily lock high-risk actions such as drive publication or role changes."
    },
    {
      id: "control-3",
      title: "Maintenance mode",
      description: "Future-ready operational toggle for scheduled maintenance windows."
    }
  ],
  reports: [
    { id: "admin-rep-1", title: "Export user data", format: "CSV", note: "All user accounts, roles, statuses, and last login timestamps." },
    { id: "admin-rep-2", title: "Export placement data", format: "CSV / PDF", note: "Drive, application, offer, and placement-level summary exports." },
    { id: "admin-rep-3", title: "Export activity logs", format: "CSV / PDF", note: "Audit trail export for system security and operational review." }
  ]
};

module.exports = {
  adminDashboardData
};
