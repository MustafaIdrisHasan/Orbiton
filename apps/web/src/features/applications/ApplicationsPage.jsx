import { FeaturePage } from "../../shared/ui/FeaturePage";

export function ApplicationsPage() {
  return (
    <FeaturePage
      title="Applications"
      description="Track student applications, round progression, shortlist actions, and withdrawal states."
      actions={["Apply to Drive", "Export Status"]}
      metrics={[
        { label: "Timeline", value: "Ready", note: "Supports status history and recruiter decisions" },
        { label: "Workflow", value: "CRUD", note: "Apply, view, update, withdraw" }
      ]}
    />
  );
}

