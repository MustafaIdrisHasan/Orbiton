import { FeaturePage } from "../../shared/ui/FeaturePage";

export function MenteesPage() {
  return (
    <FeaturePage
      title="Mentees"
      description="Faculty workspace for reviewing assigned students and their placement readiness."
      actions={["Open Student List"]}
      metrics={[
        { label: "Assigned", value: "42", note: "Mentees under supervision" },
        { label: "Needs Follow-up", value: "8", note: "Students requiring attention" }
      ]}
    />
  );
}

