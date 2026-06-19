import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { CommunityCard } from "@/components/site/CommunityCard";
import { communities } from "@/lib/data";

export const metadata: Metadata = {
  title: "Communities — Matin Real Estate",
  description:
    "Explore the neighborhoods we know by heart across Oregon and SW Washington — from West Linn bluffs to the Vancouver waterfront.",
};

const STATE_LABEL: Record<string, string> = { OR: "Oregon", WA: "Washington" };

export default function CommunitiesPage() {
  const oregon = communities.filter((c) => c.state === "OR");
  const washington = communities.filter((c) => c.state === "WA");
  const groups = [
    { state: "OR", list: oregon },
    { state: "WA", list: washington },
  ].filter((g) => g.list.length > 0);

  return (
    <>
      {/* ---------- HERO ---------- */}
      <div className="border-b border-ink/[0.07] bg-gradient-to-b from-paper-200/70 to-paper pt-20 sm:pt-28 pb-8 sm:pb-12">
        <Container>
          <span className="eyebrow">Explore communities</span>
          <h1 className="display-2 mt-4 max-w-3xl font-display text-ink text-balance">
            Every neighborhood, known by heart
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate text-pretty sm:text-lg">
            We live where we sell. Get the real story on {communities.length} communities across the Portland metro and
            SW Washington — median prices, schools, walkability and the feel of each place.
          </p>
        </Container>
      </div>

      {groups.map(({ state, list }) => (
        <Section key={state} className="py-14 md:py-16">
          <Container>
            <div className="flex items-center gap-4">
              <h2 className="font-display text-3xl text-ink">{STATE_LABEL[state] ?? state}</h2>
              <span className="rule-accent" />
              <span className="text-[0.85rem] text-slate">{list.length} communities</span>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c, i) => (
                <Reveal key={c.slug} delay={(i % 4) * 0.06}>
                  <CommunityCard community={c} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      ))}
    </>
  );
}
