import { listings, getCommunity } from "@/lib/data";
import { AiToolPanel, type Preset } from "@/components/command/AiToolPanel";

const presets: Preset[] = listings
  .filter((l) => l.status !== "Sold")
  .slice(0, 4)
  .map((l) => {
    const community = getCommunity(l.communitySlug)?.name ?? l.city;
    return {
      label: `${l.address.split(" ").slice(0, 2).join(" ")} · ${l.city}`,
      hint: `Subject in ${community}`,
      values: {
        address: l.address,
        city: `${l.city}, ${l.state}`,
        beds: String(l.beds),
        baths: String(l.baths),
        sqft: String(l.sqft),
        yearBuilt: String(l.yearBuilt),
        notes: `${l.type}; ${l.features.slice(0, 3).join(", ")}; ${l.daysOnMarket} days on market.`,
        target: `$${l.price.toLocaleString()}`,
      },
    };
  });

export default function CmaPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <AiToolPanel
        tool="cma"
        title="CMA Generator"
        pillar="Pillar 3 · AI Integration"
        description="Generate a decisive comparative market analysis — a suggested list-price range with reasoning, comparable-sale talking points, current market posture, and a one-line recommendation."
        submitLabel="Generate CMA"
        outputTitle="Comparative market analysis"
        presets={presets}
        presetLabel="Load a subject property"
        printable
        fields={[
          { name: "address", label: "Subject address", placeholder: "3302 Tannler Dr", full: true },
          { name: "city", label: "City", placeholder: "West Linn, OR" },
          { name: "beds", label: "Beds", type: "number", placeholder: "5" },
          { name: "baths", label: "Baths", type: "number", placeholder: "3.5" },
          { name: "sqft", label: "Square feet", type: "number", placeholder: "3582" },
          { name: "yearBuilt", label: "Year built", type: "number", placeholder: "1980" },
          { name: "notes", label: "Condition / notes", type: "textarea", placeholder: "Recently renovated kitchen, river frontage…", full: true },
          { name: "target", label: "Seller's target price", placeholder: "$1,370,000", full: true },
        ]}
      />
    </div>
  );
}
