import { FileText, Clock, CheckCircle } from "lucide-react";
import { buyerAgreements } from "@/lib/data";
import { StatTile, SectionLabel, LiveDot } from "@/components/command/ui";
import { BuyerAgreements } from "@/components/command/buyer/BuyerAgreements";

export const metadata = { title: "Buyer Agreements" };

export default function BuyerAgreementsPage() {
  const missingAgreement = buyerAgreements.filter(
    (b) => b.agreementStatus === "Not Signed",
  ).length;

  const awaitingSignature = buyerAgreements.filter(
    (b) => b.agreementStatus === "Sent",
  ).length;

  // Signed this month — use lastContactDaysAgo <= 30 as a proxy for recency
  // (deterministic, no Date())
  const signedThisMonth = buyerAgreements.filter(
    (b) => b.agreementStatus === "Signed" && b.lastContactDaysAgo <= 30,
  ).length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-6 md:py-8">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <LiveDot tone="azure" />
          <SectionLabel>Buyer Agreement Workspace</SectionLabel>
        </div>
        <h1 className="font-display text-3xl text-ink">Buyer Agreements</h1>
        <p className="mt-1 max-w-2xl text-[0.9rem] text-slate">
          Track every buyer&apos;s representation agreement from intake through signature. Generate
          packets, send via DocuSign, and keep every agent compliant.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Missing Agreement"
          value={missingAgreement}
          icon={<FileText className="h-4 w-4" />}
          delta={
            missingAgreement > 0
              ? { value: "needs action", dir: "down" }
              : { value: "all covered", dir: "up" }
          }
          accent
        />
        <StatTile
          label="Awaiting Signature"
          value={awaitingSignature}
          icon={<Clock className="h-4 w-4" />}
          hint="Sent — pending buyer signature"
        />
        <StatTile
          label="Signed This Month"
          value={signedThisMonth}
          icon={<CheckCircle className="h-4 w-4" />}
          delta={{ value: "last 30 days", dir: "flat" }}
        />
      </div>

      <BuyerAgreements />
    </div>
  );
}
