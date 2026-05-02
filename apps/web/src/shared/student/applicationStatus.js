/** @typedef {"APPLIED"|"SHORTLISTED"|"INTERVIEW"|"SELECTED"|"OFFERED"|"REJECTED"} ApplicationStatus */

export const APPLICATION_STATUS_ORDER = ["APPLIED", "SHORTLISTED", "INTERVIEW", "SELECTED", "OFFERED", "REJECTED"];

/** OpenAPI-aligned labels and card/chip styling */
export const applicationStatusMeta = {
  APPLIED: { label: "Applied", cardClass: "status-app-applied", chipClass: "chip-applied" },
  SHORTLISTED: { label: "Shortlisted", cardClass: "status-app-shortlisted", chipClass: "chip-shortlisted" },
  INTERVIEW: { label: "Interview", cardClass: "status-app-interview", chipClass: "chip-interview" },
  SELECTED: { label: "Selected", cardClass: "status-app-selected", chipClass: "chip-selected" },
  OFFERED: { label: "Offered", cardClass: "status-app-offered", chipClass: "chip-offered" },
  REJECTED: { label: "Rejected", cardClass: "status-app-rejected", chipClass: "chip-rejected" }
};

/** @param {string} status */
export function metaForApplicationStatus(status) {
  return applicationStatusMeta[status] || {
    label: status || "Unknown",
    cardClass: "status-app-applied",
    chipClass: "chip-unknown"
  };
}

/** @param {string} status */
export function applicationProgressRatio(status) {
  const idx = APPLICATION_STATUS_ORDER.indexOf(status);
  if (idx < 0) {
    return 0;
  }
  return (idx + 1) / APPLICATION_STATUS_ORDER.length;
}
