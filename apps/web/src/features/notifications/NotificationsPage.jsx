import { FeaturePage } from "../../shared/ui/FeaturePage";

export function NotificationsPage() {
  return (
    <FeaturePage
      title="Notifications"
      description="Global read center for drive updates, round status changes, and offer actions."
      actions={["Mark all as read"]}
      metrics={[
        { label: "Unread", value: "0", note: "Will sync with /api/v1/notifications" },
        { label: "Sources", value: "Global", note: "Student, recruiter, and admin events" }
      ]}
    />
  );
}

