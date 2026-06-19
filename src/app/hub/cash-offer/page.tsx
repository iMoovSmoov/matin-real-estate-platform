import { DollarSign, Send, ArrowRightLeft } from "lucide-react";
import { sellerLeads, metrics } from "@/lib/data";
import { StatTile, SectionLabel, LiveDot } from "@/components/command/ui";
import { CashOfferPipeline } from "@/components/command/cash-offer/CashOfferPipeline";

export const metadata = { title: "Cash Offer Pipeline" };

const DEAD_OR_TERMINAL: string[] = ["Dead", "Accepted", "Converted to Listing"];

export default function CashOfferPage() {
  const activeRequests = sellerLeads.filter(
    (l) => !DEAD_OR_TERMINAL.includes(l.stage),
  ).length;

  const offersSent = sellerLeads.filter((l) => l.stage === "Offer Sent").length;

  const converted = sellerLeads.filter(
    (l) => l.stage === "Converted to Listing",
  ).length;

  // Suppress unused-var warning for metrics if not referenced below
  void metrics;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-6 md:px-6 md:py-8">
      {/* Page header */}
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <LiveDot tone="azure" />
          <SectionLabel>Cash Is King Home Buyers — active seller pipeline</SectionLabel>
        </div>
        <h1 className="font-display text-3xl text-ink">Cash Offer Pipeline</h1>
        <p className="mt-1 max-w-2xl text-[0.9rem] text-slate">
          Track every seller request from initial inquiry through cash offer acceptance and
          listing conversion.
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Active Requests"
          value={activeRequests}
          icon={<DollarSign className="h-4 w-4" />}
          accent
          hint="Leads not yet dead, accepted, or converted"
        />
        <StatTile
          label="Offers Sent"
          value={offersSent}
          icon={<Send className="h-4 w-4" />}
          hint="Awaiting seller response"
        />
        <StatTile
          label="Converted to Listing"
          value={converted}
          icon={<ArrowRightLeft className="h-4 w-4" />}
          delta={
            converted > 0
              ? { value: `${converted} deal${converted !== 1 ? "s" : ""}`, dir: "up" }
              : { value: "none yet", dir: "flat" }
          }
        />
      </div>

      {/* Kanban board */}
      <CashOfferPipeline />
    </div>
  );
}
