import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Award, ShieldCheck, TrendingUp, Cpu, Quote, Star, Database, Zap, GraduationCap, BrainCircuit, BadgeCheck,
} from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PropertySearchBar } from "@/components/site/PropertySearchBar";
import { ListingCard } from "@/components/site/ListingCard";
import { CommunityCard } from "@/components/site/CommunityCard";
import {
  company, featuredListings, popularCommunities, salesAgents,
} from "@/lib/data";

const stats = [
  ["35%", "Business growth this year"],
  ["100+", "Active listings"],
  ["305+", "Properties sold"],
  ["$130M+", "Annual sales volume"],
  ["$2.4M", "Annual marketing budget"],
];

const values = [
  { icon: TrendingUp, title: "Data-driven from offer to close", body: "Live comps, sharp pricing, and AI-assisted negotiation built on the largest local dataset in the metro." },
  { icon: ShieldCheck, title: "Full-service, full-time brokers", body: "40+ licensed OR & WA brokers — never part-timers. Someone is always in your corner." },
  { icon: Award, title: "A top-producing, award-winning team", body: "Portland Business Journal fastest-growing, $130M+ closed, and 305+ families moved each year." },
];

const testimonials = [
  { name: "The Harrisons", area: "West Linn, OR", quote: "Matin sold our home in a weekend, over asking, with zero stress. The marketing was on another level." },
  { name: "Priya & Sam", area: "Lake Oswego, OR", quote: "First-time buyers and they treated us like their biggest client. We never felt rushed or out-negotiated." },
  { name: "D. Okafor", area: "Camas, WA", quote: "Relocating from out of state, their team made it effortless. The tech and communication were incredible." },
];

export default function HomePage() {
  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="relative flex min-h-[72vh] items-center overflow-hidden lg:min-h-screen">
        <div className="absolute inset-0">
          <Image
            src={company.officeHero}
            alt="Matin Real Estate office in West Linn"
            fill
            priority
            sizes="100vw"
            className="ken-burns object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/10 to-ink/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/40 to-transparent" />
          {/* warm ambient glow — gives the office photo depth + vibrancy */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_50%,rgba(210,160,80,0.08),transparent)]" />
        </div>

        <Container className="relative z-10 pt-20 sm:pt-28">
          <div className="max-w-3xl">
            <Reveal>
              <span className="hero-text-shadow eyebrow-light">Portland · Lake Oswego · West Linn · SW Washington</span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="hero-text-shadow display-1 mt-5 font-display text-4xl text-white text-balance sm:text-6xl lg:text-7xl">
                Find your place in the{" "}
                <span className="italic text-azure-bright">Pacific Northwest.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 text-pretty sm:text-lg">
                The Portland area&apos;s most technologically advanced brokerage — {company.stats.annualVolume} in
                annual sales, 40+ full-time brokers, and an AI concierge that never sleeps.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-8">
                <PropertySearchBar dark />
              </div>
            </Reveal>
            <Reveal delay={0.32}>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
                <span className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-azure-bright" /> 4.9 · 700+ reviews
                </span>
                <span className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-azure-bright" /> Fastest-growing private company
                </span>
              </div>
            </Reveal>
          </div>
        </Container>

        {/* scroll-down indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/50">
          <span className="text-[0.65rem] uppercase tracking-widest">Scroll</span>
          <div className="h-10 w-px bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ---------- STAT BAND ---------- */}
      <div className="border-y border-ink/[0.07] bg-paper border-b border-ink/[0.06]">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-ink/20 to-transparent" />
        <Container>
          <dl className="grid grid-cols-2 [&>*:nth-child(5)]:col-span-2 divide-ink/[0.07] py-7 sm:grid-cols-5 sm:[&>*:nth-child(5)]:col-span-1 md:divide-x md:py-10">
            {stats.map(([n, l], i) => (
              <Reveal key={l} delay={i * 0.06} className="px-4 py-3 text-center">
                <dt className="font-display text-[2rem] text-ink sm:text-4xl md:text-5xl">{n}</dt>
                <dd className="mt-1 text-[0.75rem] leading-tight text-slate sm:text-[0.82rem]">{l}</dd>
              </Reveal>
            ))}
          </dl>
        </Container>
      </div>

      {/* thin divider between stat band and listings */}
      <div className="h-px bg-ink/[0.05]" />

      {/* ---------- FEATURED LISTINGS ---------- */}
      <Section>
        <Container>
          <div className="rule-accent mb-6" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Featured listings"
              title="Homes worth coming home to"
              intro="A curated look at what's moving across the metro right now."
            />
            <ButtonLink href="/property-search" variant="outline" className="hidden shrink-0 sm:inline-flex">
              View all listings <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {featuredListings.slice(0, 6).map((l, i) => (
              <Reveal key={l.id} delay={(i % 3) * 0.08}>
                <ListingCard listing={l} />
              </Reveal>
            ))}
          </div>
          <div className="mt-6 sm:hidden">
            <ButtonLink href="/property-search" variant="outline" className="w-full justify-center">
              View all listings <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* ---------- COMMUNITIES ---------- */}
      <Section className="bg-[linear-gradient(180deg,#f6f6f5_0%,#ececeb_100%)]">
        <Container>
          <SectionHeading
            eyebrow="Explore communities"
            title="Every neighborhood, known by heart"
            intro="From West Linn bluffs to Lake Oswego lakefront and the Vancouver waterfront — we live where we sell."
            align="center"
          />
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
            {popularCommunities.map((c, i) => (
              <Reveal key={c.slug} delay={(i % 6) * 0.05}>
                <CommunityCard community={c} />
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href="/communities" variant="ink">
              Browse all communities <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* ---------- WHY MATIN ---------- */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
            <Reveal>
              <div className="relative aspect-[5/4] overflow-hidden rounded-2xl shadow-lift sm:rounded-3xl">
                <Image
                  src={company.officeMeeting}
                  alt="Matin Real Estate team"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute bottom-4 left-4 rounded-2xl bg-cloud/95 px-5 py-4 shadow-lift backdrop-blur sm:bottom-5 sm:left-5">
                  <div className="font-display text-3xl text-ink">{company.founded}</div>
                  <div className="text-[0.8rem] text-slate">Founded in West Linn, OR</div>
                </div>
              </div>
            </Reveal>
            <div>
              <SectionHeading
                eyebrow="Why Matin"
                title="A brokerage built like a tech company"
              />
              <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-7">
                {values.map((v) => (
                  <Reveal key={v.title} className="flex gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white sm:h-12 sm:w-12">
                      <v.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-ink sm:text-xl">{v.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate sm:text-[0.95rem]">{v.body}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------- TECH / COMMAND CENTER ---------- */}
      <section className="relative overflow-hidden bg-ink py-14 text-white md:py-20 lg:py-24">
        <div className="absolute inset-0 grid-tech opacity-60" />
        <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-[rgba(210,160,80,0.15)] blur-3xl" />
        <div className="absolute -right-40 bottom-10 h-80 w-80 rounded-full bg-[rgba(80,140,210,0.08)] blur-3xl" />
        <Container className="relative">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <span className="eyebrow-light border-l-2 border-azure-bright pl-3">The future of the brokerage</span>
              <h2 className="mt-4 font-display text-3xl text-white text-balance sm:text-4xl">
                The most technologically advanced brokerage in Oregon
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
                Behind every Matin client is the <strong className="text-white">Matin Hub</strong> — a custom
                platform that unifies our CRM, listings, transactions, marketing and AI into one seamless system. Real-time
                dashboards, AI coaching, and automated workflows so our brokers spend their time on you.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/hub" variant="primary" size="lg">
                  <Cpu className="h-4 w-4" /> Tour the Matin Hub
                </ButtonLink>
                <ButtonLink href="/about" variant="outline-light" size="lg">
                  Our story
                </ButtonLink>
              </div>
            </div>
            <Reveal delay={0.1}>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  ["Structured data", "Spreadsheets → live databases", Database],
                  ["AI integration", "AI woven into the CRM", BrainCircuit],
                  ["Automation", "Speed-to-lead in under 60s", Zap],
                  ["AI coaching", "Scenario training for brokers", GraduationCap],
                ].map(([t, d, Icon]) => (
                  <div key={t as string} className="glass rounded-2xl p-4 sm:p-5">
                    <Icon className="h-4 w-4 text-azure-bright sm:h-5 sm:w-5" />
                    <div className="mt-3 font-display text-base text-white sm:text-lg">{t as string}</div>
                    <div className="mt-1 text-xs text-slate-300 sm:text-[0.84rem]">{d as string}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ---------- AGENTS TEASER ---------- */}
      <Section>
        <Container>
          <div className="flex flex-col items-center text-center">
            <SectionHeading
              eyebrow="Meet the team"
              title="40+ brokers who live where they sell"
              align="center"
            />
            <div className="mt-8 flex flex-wrap justify-center gap-2 sm:mt-10 sm:gap-3">
              {salesAgents.slice(0, 12).map((a) => (
                <Link key={a.slug} href={`/agents/${a.slug}`} className="group relative">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-cloud transition group-hover:ring-azure sm:h-16 sm:w-16 md:h-20 md:w-20">
                    <Image src={a.photo} alt={a.name} fill sizes="80px" className="object-cover object-top" />
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-9">
              <ButtonLink href="/agents" variant="ink">
                Meet every broker <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------- TESTIMONIALS ---------- */}
      <Section className="bg-paper-200/60">
        <Container>
          <SectionHeading eyebrow="Client stories" title="People who trusted us with the biggest move of their lives" align="center" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.08}>
                <figure className="flex h-full flex-col rounded-2xl bg-cloud p-5 shadow-soft ring-1 ring-ink/[0.06] sm:p-7">
                  <Quote className="h-6 w-6 text-azure/30 sm:h-8 sm:w-8" />
                  <blockquote className="mt-3 flex-1 text-[0.98rem] leading-relaxed text-ink/85">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 border-t border-ink/[0.07] pt-4">
                    <div className="flex items-center gap-0.5 text-azure">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <div className="mt-2 font-medium text-ink">{t.name}</div>
                    <div className="text-[0.82rem] text-slate">{t.area}</div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---------- FINAL CTA ---------- */}
      <Section className="pb-28">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-ink-900 to-ink-800 px-5 py-12 text-center text-white shadow-glow sm:px-8 sm:py-16 md:px-16">
            <div className="absolute inset-0 grid-tech opacity-20" />
            <div className="relative">
              <h2 className="font-display text-2xl text-white text-balance sm:text-3xl md:text-4xl">Ready to make your move?</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm text-white/90 sm:text-base">
                Whether you&apos;re buying, selling, or just exploring — let&apos;s talk. Or ask our AI concierge anything,
                right now.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row">
                <ButtonLink href="/contact" variant="white" size="lg">Talk to a broker</ButtonLink>
                <ButtonLink href="/sell" variant="outline-light" size="lg">Get your home value</ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
