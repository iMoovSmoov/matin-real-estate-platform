import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight, Search, Handshake, KeyRound, FileSignature, ShieldCheck,
  TrendingUp, Cpu, Users, Sparkles, BadgeCheck, CalendarClock, Wallet, ClipboardList,
} from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { PropertySearchBar } from "@/components/site/PropertySearchBar";
import { ListingCard } from "@/components/site/ListingCard";
import { ProcessSteps } from "@/components/site/marketing/ProcessSteps";
import { company, featuredListings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Buy a Home | Matin Real Estate",
  description:
    "Buy your next home with the Portland area's most advanced brokerage. Live comps, AI-assisted negotiation, and 40+ full-time brokers in your corner.",
};

const buyingSteps = [
  { title: "Get pre-approved", body: "We connect you with trusted local lenders so you shop with a clear budget and a competitive edge before you ever tour a home." },
  { title: "Tour with confidence", body: "Your broker curates listings from the largest local database in the metro — and flags off-market opportunities others never see." },
  { title: "Make a winning offer", body: "Live comps and AI-assisted strategy help us price your offer to win without overpaying, even in a multiple-offer market." },
  { title: "Close & get the keys", body: "We coordinate inspections, appraisal, and closing — keeping every deadline on track so move-in day arrives without surprises." },
];

const values = [
  { icon: TrendingUp, title: "The largest local dataset", body: "We run on the largest locally owned real-estate website in the Portland area — so you see more homes, sooner, with sharper comps behind every decision." },
  { icon: Cpu, title: "AI-assisted negotiation", body: "Our Command Center pairs live market data with AI strategy, so your offer is priced to win without leaving money on the table." },
  { icon: Users, title: "40+ full-time brokers", body: "Never a part-timer. A licensed OR & WA broker who knows your neighborhood by heart is in your corner from first tour to final signature." },
  { icon: ShieldCheck, title: "Fiduciary, full-service", body: "We represent you — start to close. Inspections, appraisal, lending, and closing are all coordinated and kept on schedule." },
  { icon: BadgeCheck, title: "Award-winning team", body: "Portland Business Journal fastest-growing, $130M+ closed, and 305+ families moved every year. Experience you can feel." },
  { icon: Sparkles, title: "Off-market access", body: "Coming-soon and pocket listings across our 40-broker network mean opportunities most buyers never even hear about." },
];

const resources = [
  { icon: Wallet, title: "Getting pre-approved", body: "What lenders look for, how much you can borrow, and why a pre-approval letter wins offers.", tag: "Financing" },
  { icon: KeyRound, title: "First-time buyer guide", body: "From earnest money to escrow — every step explained in plain English, no jargon.", tag: "Guide" },
  { icon: FileSignature, title: "Making a strong offer", body: "Escalation clauses, contingencies, and the strategy that wins in a competitive market.", tag: "Strategy" },
  { icon: ClipboardList, title: "Closing costs explained", body: "A clear breakdown of what you'll actually pay at the table — and what's negotiable.", tag: "Costs" },
];

export default function BuyPage() {
  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="relative flex min-h-[78vh] items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/matin/interiors/interiors-00.jpg"
            alt="Bright, modern home interior"
            fill
            priority
            sizes="100vw"
            className="ken-burns object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/55 to-ink/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/80 to-transparent" />
        </div>
        <Container className="relative z-10 pt-28">
          <div className="max-w-3xl">
            <Reveal>
              <span className="eyebrow-light">Buy with Matin</span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="display-1 mt-5 font-display text-white text-balance">
                The right home, found the{" "}
                <span className="italic text-azure-bright">smart way.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 text-pretty">
                More listings, sharper comps, and AI-assisted negotiation — so you win the home you love
                without overpaying. Start your search below.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-8">
                <PropertySearchBar dark />
              </div>
            </Reveal>
            <Reveal delay={0.32}>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80">
                <span className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-azure-bright" /> 305+ families moved each year
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-azure-bright" /> 40+ full-time OR &amp; WA brokers
                </span>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ---------- PROCESS ---------- */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="The Matin buying process"
            title="Four steps from search to keys"
            intro="A clear, broker-guided path — no guesswork, no surprises, no pressure."
            align="center"
          />
          <div className="mt-14">
            <ProcessSteps steps={buyingSteps} />
          </div>
        </Container>
      </Section>

      {/* ---------- WHY BUY WITH MATIN ---------- */}
      <Section className="bg-paper-200/60">
        <Container>
          <SectionHeading
            eyebrow="Why buy with Matin"
            title="An unfair advantage, in your corner"
            intro="A brokerage built like a tech company — so your search is faster, your offers are smarter, and your close is smoother."
            align="center"
          />
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={(i % 3) * 0.08}>
                <div className="group flex h-full flex-col rounded-2xl bg-cloud p-7 shadow-soft ring-1 ring-ink/[0.06] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-azure/10 text-azure transition-colors duration-500 group-hover:bg-azure group-hover:text-white">
                    <v.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-xl text-ink">{v.title}</h3>
                  <p className="mt-2 flex-1 text-[0.93rem] leading-relaxed text-slate">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---------- FEATURED LISTINGS ---------- */}
      <Section>
        <Container>
          <div className="flex items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Just listed"
              title="Homes worth touring this week"
              intro="A curated look at what's moving across the metro right now."
            />
            <ButtonLink href="/property-search" variant="outline" className="hidden shrink-0 sm:inline-flex">
              View all listings <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredListings.slice(0, 3).map((l, i) => (
              <Reveal key={l.id} delay={i * 0.08}>
                <ListingCard listing={l} />
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center sm:hidden">
            <ButtonLink href="/property-search" variant="outline">
              View all listings <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* ---------- BUYER RESOURCES ---------- */}
      <Section className="bg-paper-200/60">
        <Container>
          <SectionHeading
            eyebrow="Buyer resources"
            title="Everything you need, before you need it"
            intro="The questions every buyer asks — answered by the team that closes 305+ homes a year."
            align="center"
          />
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {resources.map((r, i) => (
              <Reveal key={r.title} delay={(i % 2) * 0.08}>
                <a
                  href="/blog"
                  className="group flex h-full items-start gap-5 rounded-2xl bg-cloud p-6 shadow-soft ring-1 ring-ink/[0.06] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-azure/10 text-azure transition-colors duration-500 group-hover:bg-azure group-hover:text-white">
                    <r.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <Badge tone="azure">{r.tag}</Badge>
                    <h3 className="mt-2.5 font-display text-lg text-ink">{r.title}</h3>
                    <p className="mt-1 text-[0.9rem] leading-relaxed text-slate">{r.body}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-[0.85rem] font-medium text-azure-deep">
                      Read the guide
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---------- CTA ---------- */}
      <Section className="pb-28">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-azure-deep via-azure to-azure-bright px-8 py-16 text-center text-white shadow-glow md:px-16">
            <div className="absolute inset-0 grid-tech opacity-20" />
            <div className="relative">
              <span className="eyebrow-light">Ready when you are</span>
              <h2 className="display-2 mt-4 font-display text-white text-balance">
                Let&apos;s find your next front door
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
                Tell us what you&apos;re looking for and we&apos;ll match you with the right broker and the
                right homes — many before they hit the open market.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/contact" variant="white" size="lg">
                  <Handshake className="h-4 w-4" /> Talk to a buyer&apos;s agent
                </ButtonLink>
                <ButtonLink href="/property-search" variant="outline-light" size="lg">
                  <Search className="h-4 w-4" /> Search homes
                </ButtonLink>
              </div>
              <p className="mt-6 flex items-center justify-center gap-2 text-[0.85rem] text-white/80">
                <CalendarClock className="h-4 w-4" /> {company.hours} · {company.phone}
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
