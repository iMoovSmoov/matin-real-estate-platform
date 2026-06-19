import type { Metadata } from "next";
import { Container } from "@/components/ui/section";
import { SearchExperience } from "@/components/site/property/SearchExperience";
import { listings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Property Search — Matin Real Estate",
  description:
    "Search active homes across Portland, Lake Oswego, West Linn and SW Washington. Filter by price, beds, type and status.",
};

export default async function PropertySearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q = "", type = "" } = await searchParams;

  return (
    <>
      {/* ---------- PAGE HEADER ---------- */}
      <div className="border-b border-ink/[0.07] bg-gradient-to-b from-paper-200/70 to-paper pt-20 sm:pt-28 pb-8 sm:pb-12">
        <Container>
          <span className="eyebrow">Property search</span>
          <h1 className="display-2 mt-4 max-w-3xl font-display text-ink text-balance">
            Every home on the market, in one place
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate text-pretty">
            Browse {listings.length} active and upcoming listings across the Portland metro and SW Washington —
            filtered the way you think about a home.
          </p>
        </Container>
      </div>

      {/* Full-bleed search — no container wrapper so the 2-col layout reaches the viewport edges */}
      <SearchExperience listings={listings} initialQuery={q} initialType={type} />
    </>
  );
}
