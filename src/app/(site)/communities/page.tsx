import type { Metadata } from "next";
import Image from "next/image";
import { CommunitiesGrid } from "@/components/site/CommunitiesGrid";
import { communities, company } from "@/lib/data";

export const metadata: Metadata = {
  title: "Communities — Matin Real Estate",
  description:
    "Find your neighborhood in Portland & SW Washington — median prices, school ratings, days on market and the feel of each place.",
};

export default function CommunitiesPage() {
  return (
    <>
      {/* ---------- FULL-BLEED HERO (design #w-communities) ---------- */}
      <section className="relative isolate flex min-h-[clamp(360px,52vh,520px)] items-end overflow-hidden bg-ink-900">
        <Image
          src="/matin/scenics/scenics-01.jpg"
          alt="Portland & SW Washington neighborhoods"
          fill
          priority
          sizes="100vw"
          className="ken-burns object-cover"
        />
        {/* Design overlay: linear-gradient(180deg,rgba(6,6,6,.45),.25 50%,.55) — deepened a touch for white-nav legibility */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg,rgba(6,6,6,.58),rgba(6,6,6,.30) 50%,rgba(6,6,6,.64))" }}
        />
        <div className="container-x relative z-10 pb-10 pt-28 sm:pb-14 sm:pt-32">
          <div className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/82">
            Where we work
          </div>
          <h1 className="hero-text-shadow mt-3.5 max-w-3xl font-display text-[clamp(2.4rem,5.4vw,4rem)] font-normal leading-[1.02] tracking-[-0.02em] text-white text-balance">
            Explore the neighborhoods
          </h1>
          <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-white/82 sm:text-base">
            Hyperlocal market data, school ratings and the honest feel of every place —
            from West Linn bluffs to the Vancouver waterfront across{" "}
            <span className="tabular-nums">{company.stats.citiesServed}</span> cities served.
          </p>
        </div>
      </section>

      {/* ---------- INTERACTIVE GRID (design cards + filters) ---------- */}
      <CommunitiesGrid communities={communities} />
    </>
  );
}
