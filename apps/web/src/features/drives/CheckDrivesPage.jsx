import { FeaturePage } from "../../shared/ui/FeaturePage";

export function CheckDrivesPage() {
  return (
    <FeaturePage
      title="Check Drives"
      description="Placement Officer review workspace for monitoring and checking placement drive activity."
      actions={["Review Pipeline"]}
      metrics={[
        { label: "Live Drives", value: "18", note: "Institute-wide active drives" },
        { label: "Attention", value: "4", note: "Drives requiring follow-up" }
      ]}
    />
  );
}

