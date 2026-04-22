import { FeaturePage } from "../../shared/ui/FeaturePage";

export function MyDrivesPage() {
  return (
    <FeaturePage
      title="My Drives"
      description="Recruiter workspace for tracking and managing drives created by the logged-in employer account."
      actions={["Filter Drives"]}
      metrics={[
        { label: "Active", value: "6", note: "Current recruiter-owned drives" },
        { label: "Pending", value: "2", note: "Draft or review-needed drives" }
      ]}
    />
  );
}

