import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/section";
import { AgentDirectory } from "@/components/site/property/AgentDirectory";
import { agents, salesAgents } from "@/lib/data";

export const metadata: Metadata = {
  title: "Our Brokers — Matin Real Estate",
  description:
    "Meet the 40+ full-time, licensed Oregon and Washington brokers behind Matin Real Estate. Filter by specialty, community and language.",
};

export default function AgentsPage() {
  const totalHomes = salesAgents.reduce((sum, a) => sum + a.homesSold, 0);

  return (
    <>
      {/* ---------- HERO ---------- */}
      <div className="border-b border-ink/[0.07] bg-gradient-to-b from-paper-200/70 to-paper pt-20 sm:pt-28 pb-8 sm:pb-12">
        <Container>
          <span className="eyebrow">Meet the team</span>
          <h1 className="display-2 mt-4 max-w-3xl font-display text-ink text-balance">
            Brokers who live where they sell
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate text-pretty sm:text-lg">
            Every Matin broker is full-time, licensed, and backed by the most advanced platform in the metro. Find the
            right person for your move across {agents.length} professionals.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            <HeroStat value={`${salesAgents.length}+`} label="Licensed brokers" />
            <HeroStat value={`${totalHomes.toLocaleString()}`} label="Homes sold lifetime" />
            <HeroStat value="OR · WA" label="Dual-state coverage" />
          </div>
        </Container>
      </div>

      <Section className="py-12 md:py-16">
        <Container>
          <AgentDirectory agents={agents} />
        </Container>
      </Section>
    </>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl text-ink">{value}</div>
      <div className="mt-0.5 text-[0.82rem] text-slate">{label}</div>
    </div>
  );
}
