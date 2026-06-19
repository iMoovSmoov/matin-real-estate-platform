import { Rocket, ListChecks, ClipboardList } from "lucide-react";
import { listingPipeline } from "@/lib/data";
import { StatTile, SectionLabel, LiveDot } from "@/components/command/ui";
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
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-6 md:py-8">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <LiveDot tone="azure" />
          <SectionLabel>Listing management</SectionLabel>
        </div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Listing Launch Wizard</h1>
        <p className="mt-1 max-w-2xl text-[0.9rem] text-slate">
          Orchestrate every listing from intake to MLS-live — checklists, marketing kit generation,
          and broker approval in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Active Listings"
          value={active}
          icon={<Rocket className="h-4 w-4" />}
          accent
          hint="Active + Under Offer"
        />
        <StatTile
          label="Ready to Launch"
          value={readyToLaunch}
          icon={<ListChecks className="h-4 w-4" />}
          hint="MLS Draft or Broker Review"
        />
        <StatTile
          label="In Prep"
          value={inPrep}
          icon={<ClipboardList className="h-4 w-4" />}
          hint="Intake or Photos Scheduled"
        />
      </div>

      <ListingLaunch listings={listingPipeline} />
    </div>
  );
}
