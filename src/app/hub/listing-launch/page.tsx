import { Rocket, ListChecks, ClipboardList } from "lucide-react";
import { listingPipeline } from "@/lib/data";
import { ListingLaunch } from "@/components/command/listing/ListingLaunch";

export const metadata = { title: "Listing Launch Wizard" };

export default function ListingLaunchPage() {
  const active = listingPipeline.filter(
    (l) => l.stage === "Active" || l.stage === "Under Offer",
  ).length;
  const readyToLaunch = listingPipeline.filter(
    (l) => l.stage === "MLS Draft" || l.stage === "Broker Review",
  ).length;
  const inPrep = listingPipeline.filter(
    (l) => l.stage === "Intake" || l.stage === "Photos Scheduled",
  ).length;

  return (
    <div className="flex flex-col">
      {/* Compact inline header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-ink/[0.06]">
        <h1 className="font-semibold text-[1.05rem] text-ink">Listing Launch</h1>
      </div>

      {/* Compact stat strip */}
      <div className="grid grid-cols-3 gap-2 px-4 py-2.5 border-b border-ink/[0.06]">
        <div className="flex items-center gap-2 rounded-lg bg-ink/[0.03] px-3 py-2">
          <Rocket className="h-3.5 w-3.5 shrink-0 text-ink/50" />
          <div className="min-w-0">
            <p className="text-[0.68rem] text-slate/60 leading-none">Active</p>
            <p className="text-[0.95rem] font-semibold text-ink tabular-nums">{active}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-ink/[0.03] px-3 py-2">
          <ListChecks className="h-3.5 w-3.5 shrink-0 text-ink/50" />
          <div className="min-w-0">
            <p className="text-[0.68rem] text-slate/60 leading-none">Ready</p>
            <p className="text-[0.95rem] font-semibold text-ink tabular-nums">{readyToLaunch}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-ink/[0.03] px-3 py-2">
          <ClipboardList className="h-3.5 w-3.5 shrink-0 text-ink/50" />
          <div className="min-w-0">
            <p className="text-[0.68rem] text-slate/60 leading-none">In Prep</p>
            <p className="text-[0.95rem] font-semibold text-ink tabular-nums">{inPrep}</p>
          </div>
        </div>
      </div>

      {/* Primary content */}
      <div className="px-4 py-3">
        <ListingLaunch listings={listingPipeline} />
      </div>
    </div>
  );
}
