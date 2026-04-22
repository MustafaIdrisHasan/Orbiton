import { FeaturePage } from "../../shared/ui/FeaturePage";

export function CreateDrivePage() {
  return (
    <FeaturePage
      title="Create Drive"
      description="Recruiter workflow entry for creating a new placement drive."
      actions={["Start Draft"]}
      metrics={[
        { label: "Mode", value: "Draft", note: "Scaffolded create-drive surface" },
        { label: "Owner", value: "Recruiter", note: "Role-specific action from account drawer" }
      ]}
    />
  );
}

