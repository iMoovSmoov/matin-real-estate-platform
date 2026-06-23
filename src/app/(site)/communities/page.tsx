import type { Metadata } from "next";
import { CommunitiesGrid } from "@/components/site/CommunitiesGrid";
import { EditorialHero } from "@/components/site/EditorialHero";
import { communities } from "@/lib/data";

export const metadata: Metadata = {
  title: "Communities — Matin Real Estate",
  description:
    "Find your neighborhood in Portland & SW Washington — median prices, school ratings, walkability and the feel of each place.",
};

export default function CommunitiesPage() {
  return (
    <>
      <EditorialHero
        eyebrow="Explore communities"
        title="Find your neighborhood in Portland & SW Washington."
        intro="Hyperlocal market data, school ratings, broker guidance, and the honest feel of each place from West Linn bluffs to the Vancouver waterfront."
        image="/matin/scenics/scenics-01.jpg"
        imageAlt="Portland and Southwest Washington neighborhoods"
        stats={[
          { value: `${communities.length}`, label: "communities" },
          { value: "OR + WA", label: "dual-state coverage" },
          { value: "Live", label: "market context" },
        ]}
      />

      {/* ---------- INTERACTIVE GRID (client component) ---------- */}
      <CommunitiesGrid communities={communities} />
    </>
  );
}
