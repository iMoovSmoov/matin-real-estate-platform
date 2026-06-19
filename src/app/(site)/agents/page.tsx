import type { Metadata } from "next";
import Image from "next/image";
import { Container, Section } from "@/components/ui/section";
import { AgentDirectory } from "@/components/site/property/AgentDirectory";
import { agents, salesAgents, company } from "@/lib/data";

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
      <section className="relative flex min-h-[52vh] items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={company.officeMeeting}
            alt="The Matin Real Estate team"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/40 to-ink/10" />
        </div>
        <Container className="relative z-10 pb-16 pt-32 sm:pb-20">
          <span className="eyebrow eyebrow-light">Meet the team</span>
          <h1 className="display-2 mt-4 max-w-3xl font-display text-white text-balance">
            Brokers who live where they sell
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 text-pretty sm:text-lg">
            Every Matin broker is full-time, licensed, and backed by the most advanced platform in the metro.
            Find the right person for your move across {agents.length} professionals.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            <HeroStat value={`${salesAgents.length}+`} label="Licensed brokers" light />
            <HeroStat value={`${totalHomes.toLocaleString()}`} label="Homes sold lifetime" light />
            <HeroStat value="OR · WA" label="Dual-state coverage" light />
          </div>
        </Container>
      </section>

      <Section className="py-12 pb-24 md:py-16 md:pb-24">
        <Container>
          <AgentDirectory agents={agents} />
        </Container>
      </Section>
    </>
  );
}

function HeroStat({ value, label, light }: { value: string; label: string; light?: boolean }) {
  return (
    <div>
      <div className={`font-display text-3xl ${light ? "text-white" : "text-ink"}`}>{value}</div>
      <div className={`mt-0.5 text-[0.82rem] ${light ? "text-white/65" : "text-slate"}`}>{label}</div>
    </div>
  );
}
