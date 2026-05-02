/**
 * Resolve where a notification should send the user, respecting role-scoped routes.
 * @param {string|null|undefined} role
 * @param {string} type
 * @param {string|null|undefined} entityId
 * @param {string|null|undefined} driveId
 * @returns {{ kind: "navigate"; to: string } | { kind: "offer"; offerId: string } | { kind: "none" }}
 */
export function resolveNotificationTarget(role, type, entityId, driveId) {
  const rid = entityId || undefined;
  const did = driveId || undefined;

  if (role === "STUDENT") {
    switch (type) {
      case "DRIVE":
        if (rid || did) {
          return { kind: "navigate", to: `/drives/${rid || did}` };
        }
        return { kind: "navigate", to: "/drives" };
      case "APPLICATION":
      case "SHORTLIST":
        if (rid) {
          return { kind: "navigate", to: `/student/applications/${rid}` };
        }
        return { kind: "navigate", to: "/applications" };
      case "ROUND":
        if (did) {
          return { kind: "navigate", to: `/drives/${did}` };
        }
        return { kind: "navigate", to: "/student" };
      case "OFFER":
        if (rid) {
          return { kind: "offer", offerId: rid };
        }
        return { kind: "navigate", to: "/offers" };
      case "ANNOUNCEMENT":
      default:
        return { kind: "none" };
    }
  }

  if (role === "RECRUITER") {
    switch (type) {
      case "DRIVE":
        if (did) {
          return { kind: "navigate", to: `/drives/mine` };
        }
        return { kind: "navigate", to: "/drives/mine" };
      default:
        return { kind: "navigate", to: "/recruiter" };
    }
  }

  if (role === "TPO") {
    // Application notifications: jump to the applicant's TPO profile view
    // so the TPO can see the student's resume + details immediately.
    if (type === "APPLICATION" && rid) {
      return { kind: "navigate", to: `/tpo/applications/${rid}/profile` };
    }
    if (type === "APPLICATION") {
      return { kind: "navigate", to: "/tpo/students" };
    }
    if (type === "DRIVE" && (rid || did)) {
      return { kind: "navigate", to: `/tpo/drives/${rid || did}` };
    }
    return { kind: "navigate", to: "/tpo/announcements" };
  }

  if (role === "ADMIN") {
    return { kind: "navigate", to: "/admin/dashboard" };
  }

  switch (type) {
    case "DRIVE":
      if (did || rid) {
        return { kind: "navigate", to: "/drives" };
      }
      return { kind: "navigate", to: "/drives" };
    default:
      return { kind: "none" };
  }
}
