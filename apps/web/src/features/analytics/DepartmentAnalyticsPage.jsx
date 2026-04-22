import { FeaturePage } from "../../shared/ui/FeaturePage";

export function DepartmentAnalyticsPage() {
  return (
    <FeaturePage
      title="Department Analytics"
      description="Faculty-facing analytics for student progress, participation, and department-level placement signals."
      actions={["Review Cohort"]}
      metrics={[
        { label: "Department", value: "CSE", note: "Sample faculty analytics scope" },
        { label: "Mentees", value: "42", note: "Students under current faculty oversight" }
      ]}
    />
  );
}

