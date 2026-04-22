import { FeaturePage } from "../../shared/ui/FeaturePage";

export function OffersPage() {
  return (
    <FeaturePage
      title="Offers"
      description="Issue, track, and respond to offers, then promote accepted outcomes into placement records."
      actions={["Issue Offer", "Confirm Placement"]}
      metrics={[
        { label: "Offer state", value: "ISSUED", note: "Accept, reject, and follow-up" },
        { label: "Placement sync", value: "Planned", note: "Accepted offers create placement records" }
      ]}
    />
  );
}

