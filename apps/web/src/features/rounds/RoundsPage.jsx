import { FeaturePage } from "../../shared/ui/FeaturePage";

export function RoundsPage() {
  return (
    <FeaturePage
      title="Rounds"
      description="Manage interview and assessment rounds, scheduling, results, and student visibility."
      actions={["Schedule Round", "Record Result"]}
      metrics={[
        { label: "Scheduling", value: "Planned", note: "Time, mode, and location or link" },
        { label: "Results", value: "Structured", note: "Score, remarks, and pass or fail" }
      ]}
    />
  );
}

