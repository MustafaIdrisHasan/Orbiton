import { FeaturePage } from "../../shared/ui/FeaturePage";

export function StudentPortalPage() {
  return (
    <FeaturePage
      title="Student Portal"
      description="Student dashboard covering profile strength, resumes, drive discovery, applications, rounds, and offers."
      actions={["Complete Profile", "Browse Drives"]}
      metrics={[
        { label: "Profile", value: "Academic + Skills", note: "Marks, skills, certifications, and resume state" },
        { label: "Journey", value: "End-to-end", note: "Drive to application to offer" }
      ]}
    />
  );
}

