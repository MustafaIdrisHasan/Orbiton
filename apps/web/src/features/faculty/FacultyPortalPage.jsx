import { FeaturePage } from "../../shared/ui/FeaturePage";

export function FacultyPortalPage() {
  return (
    <FeaturePage
      title="Faculty Portal"
      description="Faculty monitoring for assigned students, academic signals, and placement readiness support."
      actions={["View Assigned Students"]}
      metrics={[
        { label: "Coverage", value: "Assigned cohort", note: "Track performance and progression" },
        { label: "Role", value: "Support", note: "Advisory visibility without recruiter controls" }
      ]}
    />
  );
}

