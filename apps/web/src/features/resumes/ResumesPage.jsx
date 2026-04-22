import { FeaturePage } from "../../shared/ui/FeaturePage";

export function ResumesPage() {
  return (
    <FeaturePage
      title="Resume Management"
      description="Upload, activate, delete, and later score resumes through the storage and intelligence adapters."
      actions={["Upload Resume", "Set Active"]}
      metrics={[
        { label: "Storage", value: "Object store", note: "Abstracted for local and S3-compatible backends" },
        { label: "AI score", value: "Future", note: "Reserved for the Python intelligence layer" }
      ]}
    />
  );
}

