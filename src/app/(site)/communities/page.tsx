import type { Metadata } from "next";
import { Container } from "@/components/ui/section";
import { CommunitiesGrid } from "@/components/site/CommunitiesGrid";
import { communities } from "@/lib/data";

export const metadata: Metadata = {
  title: "Communities — Matin Real Estate",
  description:
    "Find your neighborhood in Portland & SW Washington — median prices, school ratings, walkability and the feel of each place.",
};

export default function CommunitiesPage() {
  return (
    <>
      {/* ---------- HERO ---------- */}
      <div className="border-b border-ink/[0.07] bg-gradient-to-b from-paper-200/70 to-paper pt-20 sm:pt-28 pb-10 sm:pb-14 overflow-x-hidden">
        <Container>
          <span className="eyebrow">Explore communities</span>
          <h1 className="display-1 mt-4 max-w-3xl font-display text-ink text-balance">
            Find your neighborhood in Portland &amp; SW Washington
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate text-pretty sm:text-lg">
            Hyperlocal market data, school ratings, and the honest feel of every community across the
            Portland metro — from West Linn bluffs to the Vancouver waterfront.
          </p>
          <div className="mt-6 flex flex-wrap gap-6 text-[0.85rem] text-slate">
            <span>
              <span className="font-semibold text-ink">{communities.length}</span> communities
            </span>
            <span>
              <span className="font-semibold text-ink">Live</span> market data
            </span>
            <span>
              <span className="font-semibold text-ink">Expert</span> local brokers
            </span>
          </div>
        </Container>
      </div>

      {/* ---------- INTERACTIVE GRID (client component) ---------- */}
      <CommunitiesGrid communities={communities} />
    </>
  );
}
