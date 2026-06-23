import type { Metadata } from "next";
import Image from "next/image";
import { AgentDirectory } from "@/components/site/property/AgentDirectory";
import { salesAgents, company } from "@/lib/data";

export const metadata: Metadata = {
  title: "Our Brokers — Matin Real Estate",
  description:
    "Meet the full-time, licensed Oregon and Washington brokers behind Matin Real Estate. Filter by specialty, community and language.",
};

export default function AgentsPage() {
  return (
    <>
      {/* ---------- FULL-BLEED HERO (design #w-agents) ---------- */}
      <section className="relative isolate flex min-h-[clamp(360px,50vh,500px)] items-end overflow-hidden bg-ink-900">
        <Image
          src={company.officeMeeting}
          alt="The Matin Real Estate broker team"
          fill
          priority
          sizes="100vw"
          className="ken-burns object-cover object-center"
        />
        {/* Design overlay: linear-gradient(180deg,rgba(6,6,6,.45),.3 50%,.6) — deepened for white-nav legibility */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg,rgba(6,6,6,.58),rgba(6,6,6,.34) 50%,rgba(6,6,6,.66))" }}
        />
        <div className="container-x relative z-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 pb-10 pt-28 sm:pb-14 sm:pt-32">
          <div className="min-w-0">
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/82">
              Our team
            </div>
            <h1 className="hero-text-shadow mt-3.5 max-w-2xl font-display text-[clamp(2.4rem,5.4vw,4rem)] font-normal leading-[1.02] tracking-[-0.02em] text-white text-balance">
              Brokers who know this market cold.
            </h1>
          </div>
          <div className="flex shrink-0 gap-9 tabular-nums">
            <div>
              <div className="font-display text-[clamp(1.6rem,3vw,2rem)] leading-none text-white">
                {company.stats.agents}+
              </div>
              <div className="mt-1 text-[0.72rem] text-white/70">brokers</div>
            </div>
            <div>
              <div className="font-display text-[clamp(1.6rem,3vw,2rem)] leading-none text-white">
                {company.stats.annualVolume}
              </div>
              <div className="mt-1 text-[0.72rem] text-white/70">volume</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- DIRECTORY (design filters + cards) ---------- */}
      <div className="container-x py-12 pb-24 md:py-14">
        <AgentDirectory agents={salesAgents} />
      </div>
    </>
  );
}
