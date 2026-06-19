import { listings, getCommunity } from "@/lib/data";
import { AiToolPanel, type Preset } from "@/components/command/AiToolPanel";

const presets: Preset[] = listings.slice(0, 5).map((l) => {
  const community = getCommunity(l.communitySlug)?.name ?? l.city;
  return {
    label: `${l.address.split(" ").slice(0, 2).join(" ")} · ${l.city}`,
    hint: `${l.beds}bd/${l.baths}ba · ${l.sqft.toLocaleString()} sqft`,
    values: {
      address: l.address,
      city: `${l.city}, ${l.state}`,
      beds: String(l.beds),
      baths: String(l.baths),
      sqft: String(l.sqft),
      yearBuilt: String(l.yearBuilt),
      type: l.type,
      price: `$${l.price.toLocaleString()}`,
      features: [...l.features, `Located in ${community}`].slice(0, 6).join(", "),
    },
  };
});

export default function ListingWriterPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <AiToolPanel
        tool="listing-description"
        title="Listing Writer"
        pillar="Marketing"
        description="Turn raw property facts into a vivid, MLS-ready listing description — lifestyle hook first, standout features woven in, fair-housing compliant. Load a real Matin listing to start."
        submitLabel="Write description"
        outputTitle="MLS description"
        presets={presets}
        presetLabel="Load a listing"
        fields={[
          { name: "address", label: "Address", placeholder: "8457 NW Lakeshore Ave", full: true },
          { name: "city", label: "City", placeholder: "Vancouver, WA" },
          { name: "type", label: "Property type", placeholder: "Single Family" },
          { name: "beds", label: "Beds", type: "number", placeholder: "5" },
          { name: "baths", label: "Baths", type: "number", placeholder: "4" },
          { name: "sqft", label: "Square feet", type: "number", placeholder: "2624" },
          { name: "yearBuilt", label: "Year built", type: "number", placeholder: "1974" },
          { name: "price", label: "List price", placeholder: "$1,580,000" },
          { name: "features", label: "Standout features", type: "textarea", placeholder: "ADU / guest suite, mountain views, hardwoods…", full: true },
        ]}
      />
    </div>
  );
}
