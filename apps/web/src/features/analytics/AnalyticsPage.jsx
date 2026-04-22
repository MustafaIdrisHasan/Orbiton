import { FeaturePage } from "../../shared/ui/FeaturePage";

export function AnalyticsPage() {
  return (
    <FeaturePage
      title="Analytics"
      description="Operational analytics workspace for monitoring placement activity, outcomes, and queue health."
      actions={["Export Snapshot"]}
      metrics={[
        { label: "Overview", value: "Scaffolded", note: "Role-aware analytics surface" },
        { label: "Next Step", value: "Backend Bindings", note: "Ready for reporting APIs" }
      ]}
    />
  );
}

