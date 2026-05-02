export const ROLE_LABELS = {
  STUDENT: "Student",
  RECRUITER: "Recruiter",
  FACULTY: "Faculty",
  ADMIN: "Admin",
  TPO: "Placement Officer"
};

export const PROFILE_SECTIONS = {
  INFO: "info",
  SECURITY: "security",
  PRIVACY: "privacy",
  NOTIFICATIONS: "notifications"
};

export const profileSectionLabels = {
  [PROFILE_SECTIONS.INFO]: "Your Info",
  [PROFILE_SECTIONS.SECURITY]: "Security",
  [PROFILE_SECTIONS.PRIVACY]: "Privacy",
  [PROFILE_SECTIONS.NOTIFICATIONS]: "Notification Settings"
};

export const drawerMenuByRole = {
  STUDENT: [
    { label: "Student Home", to: "/student" },
    { label: "View Profile", to: "/profile?section=info" },
    { label: "Resume Management", to: "/resumes" },
    { label: "My Applications", to: "/applications" },
    { label: "Offers", to: "/offers" },
    { label: "Notifications", to: "/notifications" },
    { label: "Settings", to: "/profile?section=notifications" },
    { label: "Logout", action: "logout", tone: "danger" }
  ],
  RECRUITER: [
    { label: "View Profile", to: "/profile?section=info" },
    { label: "Recruiter Dashboard", to: "/dashboard" },
    { label: "Create Drives", to: "/drives/create" },
    { label: "My Drives", to: "/drives/mine" },
    { label: "Interviews", to: "/recruiter/interviews" },
    { label: "Communications", to: "/recruiter/communications" },
    { label: "Reports", to: "/recruiter/reports" },
    { label: "Notifications", to: "/notifications" },
    { label: "Settings", to: "/profile?section=notifications" },
    { label: "Logout", action: "logout", tone: "danger" }
  ],
  TPO: [
    { label: "View Profile", to: "/profile?section=info" },
    { label: "TPO Dashboard", to: "/tpo/dashboard" },
    { label: "Create drive (students see when published)", to: "/drives/create" },
    { label: "Manage drives & publish", to: "/drives/mine" },
    { label: "Drives (overview)", to: "/tpo/drives" },
    { label: "Students", to: "/tpo/students" },
    { label: "Applications", to: "/tpo/applications" },
    { label: "Offers", to: "/tpo/offers" },
    { label: "Placements", to: "/tpo/placements" },
    { label: "Analytics", to: "/tpo/analytics" },
    { label: "Reports", to: "/tpo/reports" },
    { label: "Announcements", to: "/tpo/announcements" },
    { label: "Notifications", to: "/notifications" },
    { label: "Settings", to: "/profile?section=notifications" },
    { label: "Logout", action: "logout", tone: "danger" }
  ],
  FACULTY: [
    { label: "View Profile", to: "/profile?section=info" },
    { label: "Mentees", to: "/mentees" },
    { label: "Department Analytics", to: "/analytics/department" },
    { label: "Notifications", to: "/notifications" },
    { label: "Settings", to: "/profile?section=notifications" },
    { label: "Logout", action: "logout", tone: "danger" }
  ],
  ADMIN: [
    { label: "View Profile", to: "/profile?section=info" },
    { label: "Admin Dashboard", to: "/admin/dashboard" },
    { label: "Users", to: "/admin/users" },
    { label: "Roles", to: "/admin/roles" },
    { label: "Logs", to: "/admin/logs" },
    { label: "Drives", to: "/admin/drives" },
    { label: "Reports", to: "/admin/reports" },
    { label: "Notifications", to: "/notifications" },
    { label: "Settings", to: "/profile?section=notifications" },
    { label: "Logout", action: "logout", tone: "danger" }
  ]
};

const sharedEditableFields = ["Phone Number", "Email ID", "Work Phone"];

export const profileDataByRole = {
  STUDENT: {
    summary: ["CSE", "Final Year", "Roll No ORB-2026-118", "1 active resume"],
    info: [
      { label: "First Name", value: "Ayaan", editable: false },
      { label: "Last Name", value: "Rahman", editable: false },
      { label: "Phone Number", value: "+91 98765 43210", editable: true },
      { label: "Email ID", value: "student@orbiton.local", editable: true },
      { label: "Aadhar ID", value: "XXXX-XXXX-4912", editable: false },
      { label: "Roll Number", value: "ORB-2026-118", editable: false },
      { label: "Date of Birth", value: "17 Aug 2004", editable: false }
    ],
    security: {
      primaryAction: "Change Password",
      secondaryAction: "Withdraw Consent",
      helperText:
        "Withdraw Consent supports DPDP Act 2023 compliance. This action should revoke consented personal data usage where legally applicable."
    },
    privacy: {
      label: "Make Profile Private",
      checked: false,
      description:
        "If your profile is private, recruiters and students will not be able to access your public profile, certifications, experience, CGPA, etc. Applying to a placement drive will share your information with the recruiter. Making a profile private does not hide your information from the faculty or the placement officers."
    },
    notifications: {
      defaultEmail: "student@orbiton.local",
      emailOptions: ["student@orbiton.local", "student.alt@orbiton.local", "Add another email"],
      paused: false
    }
  },
  RECRUITER: {
    summary: ["Northstar AI", "Talent Acquisition", "6 active drives"],
    info: [
      { label: "First Name", value: "Nihal", editable: false },
      { label: "Last Name", value: "Joseph", editable: false },
      { label: "Work Phone", value: "+91 99887 76655", editable: true },
      { label: "Email ID", value: "recruiter@orbiton.local", editable: true },
      { label: "Company Name", value: "Northstar AI", editable: false },
      { label: "Designation", value: "Senior Recruiter", editable: false },
      { label: "Recruiter ID", value: "REC-2238", editable: false }
    ],
    security: {
      primaryAction: "Change Password",
      secondaryAction: "Withdraw Consent",
      helperText:
        "Withdraw Consent should pause recruiter-side profile processing and flag the account for compliance review."
    },
    privacy: {
      label: "Make Profile Private",
      checked: false,
      description:
        "A private recruiter profile limits non-essential public visibility while keeping institutional workflow access intact for active placement operations."
    },
    notifications: {
      defaultEmail: "recruiter@orbiton.local",
      emailOptions: ["recruiter@orbiton.local", "ta.team@northstar.ai", "Add another email"],
      paused: false
    }
  },
  FACULTY: {
    summary: ["CSE Department", "42 mentees assigned", "8 profile reviews pending"],
    info: [
      { label: "First Name", value: "Farah", editable: false },
      { label: "Last Name", value: "Iqbal", editable: false },
      { label: "Phone Number", value: "+91 98450 12340", editable: true },
      { label: "Email ID", value: "faculty@orbiton.local", editable: true },
      { label: "Employee ID", value: "FAC-0914", editable: false },
      { label: "Department", value: "Computer Science", editable: false }
    ],
    security: {
      primaryAction: "Change Password",
      secondaryAction: "Withdraw Consent",
      helperText:
        "Consent withdrawal should be surfaced as a compliance-sensitive request and may affect certain public-facing data exposures."
    },
    privacy: {
      label: "Make Profile Private",
      checked: false,
      description:
        "A private faculty profile reduces student-facing discovery while preserving institutional visibility needed for mentoring and placement oversight."
    },
    notifications: {
      defaultEmail: "faculty@orbiton.local",
      emailOptions: ["faculty@orbiton.local", "cse.office@orbiton.local", "Add another email"],
      paused: false
    }
  },
  ADMIN: {
    summary: ["System Operations", "User governance", "Audit oversight enabled"],
    info: [
      { label: "First Name", value: "Amina", editable: false },
      { label: "Last Name", value: "Khan", editable: false },
      { label: "Phone Number", value: "+91 99330 88012", editable: true },
      { label: "Email ID", value: "admin@orbiton.local", editable: true },
      { label: "Employee ID", value: "ADM-0402", editable: false },
      { label: "Admin Role / Access Scope", value: "Platform Administration", editable: false }
    ],
    security: {
      primaryAction: "Change Password",
      secondaryAction: "Withdraw Consent",
      helperText:
        "Consent withdrawal for admin accounts requires explicit compliance handling because operational access impacts system governance."
    },
    privacy: {
      label: "Make Profile Private",
      checked: false,
      description:
        "A private admin profile hides non-essential public details without impacting system governance responsibilities."
    },
    notifications: {
      defaultEmail: "admin@orbiton.local",
      emailOptions: ["admin@orbiton.local", "ops@orbiton.local", "Add another email"],
      paused: false
    }
  },
  TPO: {
    summary: ["Placement Office", "Institute-wide oversight", "Placement rate 68%"],
    info: [
      { label: "First Name", value: "Hakeem", editable: false },
      { label: "Last Name", value: "Ahmed", editable: false },
      { label: "Phone Number", value: "+91 98111 00422", editable: true },
      { label: "Email ID", value: "tpo@orbiton.local", editable: true },
      { label: "Employee ID", value: "TPO-0101", editable: false },
      { label: "Department / Office", value: "Training & Placement Office", editable: false }
    ],
    security: {
      primaryAction: "Change Password",
      secondaryAction: "Withdraw Consent",
      helperText:
        "Withdraw Consent supports DPDP compliance and should be reviewed against institutional placement governance requirements."
    },
    privacy: {
      label: "Make Profile Private",
      checked: false,
      description:
        "A private Placement Officer profile hides public-facing details while preserving faculty and institutional access needed for placement operations."
    },
    notifications: {
      defaultEmail: "tpo@orbiton.local",
      emailOptions: ["tpo@orbiton.local", "placements@orbiton.local", "Add another email"],
      paused: false
    }
  }
};

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role || "User";
}

export function getDrawerMenu(role) {
  return drawerMenuByRole[role] || drawerMenuByRole.STUDENT;
}

export function getProfileData(role) {
  return profileDataByRole[role] || profileDataByRole.STUDENT;
}

export function isFieldEditable(field) {
  return sharedEditableFields.includes(field.label) && field.editable;
}
