import { listingPipeline } from "@/lib/data";
import { ListingLaunchWorkspace } from "@/components/command/listing/ListingLaunchWorkspace";

export const metadata = { title: "Listing Launch" };

export default function ListingLaunchPage() {
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-5 md:px-6">
      <ListingLaunchWorkspace listings={listingPipeline} />
    </div>
  );
}
