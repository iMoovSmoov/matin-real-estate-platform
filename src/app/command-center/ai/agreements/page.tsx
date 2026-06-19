import { listings } from "@/lib/data";
import { AiToolPanel, type Preset } from "@/components/command/AiToolPanel";

const l0 = listings[0];
const l1 = listings.find((l) => l.type !== l0?.type) ?? listings[1];

const presets: Preset[] = [
  l0 && {
    label: "Listing agreement",
    hint: `${l0.address}, ${l0.city}`,
    values: {
      docType: "Listing Agreement",
      party: "Seller — Logan Lopez",
      property: `${l0.address}, ${l0.city}, ${l0.state}`,
      price: `$${l0.price.toLocaleString()}`,
      commission: "2.5% listing side",
      term: "6 months exclusive right to sell",
      special: "Pro photography + 3D tour included; staging consult provided.",
    },
  },
  l1 && {
    label: "Buyer rep",
    hint: `${l1.city} buyer`,
    values: {
      docType: "Buyer Representation Agreement",
      party: "Buyer — Priya Reyes",
      property: `${l1.city} metro, single-family up to $${(l1.price + 100000).toLocaleString()}`,
      price: `Target up to $${(l1.price + 100000).toLocaleString()}`,
      commission: "2.5% buyer-side, seller-paid where available",
      term: "90 days exclusive representation",
      special: "Includes private tours, offer strategy, and full transaction management.",
    },
  },
].filter(Boolean) as Preset[];

export default function AgreementsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <AiToolPanel
        tool="agreement"
        title="Agreements"
        pillar="Contracts"
        description="Generate clear, organized Oregon listing & buyer-representation agreement language from your terms — plain-English clauses with broker/legal-review flags. A drafting aid, not legal advice."
        submitLabel="Generate language"
        outputTitle="Agreement language"
        presets={presets}
        presetLabel="Load a scenario"
        printable
        fields={[
          { name: "docType", label: "Document type", type: "select", options: ["Listing Agreement", "Buyer Representation Agreement"], full: true },
          { name: "party", label: "Party", placeholder: "Seller — Logan Lopez" },
          { name: "property", label: "Property / area", placeholder: "8457 NW Lakeshore Ave, Vancouver, WA" },
          { name: "price", label: "Price", placeholder: "$1,580,000" },
          { name: "commission", label: "Commission", placeholder: "2.5% listing side" },
          { name: "term", label: "Term", placeholder: "6 months exclusive" },
          { name: "special", label: "Special terms", type: "textarea", placeholder: "Photography included, staging consult, contingencies…", full: true },
        ]}
      />
    </div>
  );
}
