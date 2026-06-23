import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Award, ShieldCheck, TrendingUp, Quote, Star,
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

const heroStats = [
  [company.stats.annualVolume, "Annual volume"],
  [company.stats.activeListings, "Active listings"],
  [company.stats.propertiesSold, "Properties sold"],
  [`${company.stats.agents}+`, "OR + WA brokers"],
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

const claudeHomeHero = "/matin/exteriors/exteriors-11.jpg";

export default function HomePage() {
  return (
    <>
      {/* ---------- HERO ---------- */}
      <section id="main-content">

        {/* ── MOBILE: full-bleed editorial hero, matching the Claude concept ── */}
        <div className="sm:hidden">
          <div className="relative isolate min-h-[calc(100svh-56px)] overflow-hidden bg-[#0d0d0e]">
            <div className="relative aspect-[3/2] w-full overflow-hidden">
              <Image
                src={claudeHomeHero}
                alt=""
                fill
                priority
                sizes="100vw"
                aria-hidden
                className="ken-burns object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/12 to-ink/78" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[#0d0d0e]" />
            </div>

            <div className="relative z-10 flex min-h-[calc(100svh_-_56px_-_66vw)] w-full flex-col justify-end px-5 pb-12 pt-7">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/72">
                Portland · Lake Oswego · SW Washington
              </p>
              <h1 className="hero-text-shadow mt-4 font-display text-[2.2rem] font-normal leading-[0.98] text-white text-balance">
                Find your place in the Pacific Northwest.
              </h1>
              <div className="mt-6">
                <PropertySearchBar dark />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-white/18 pt-5">
                {heroStats.map(([n, l]) => (
                  <div key={l}>
                    <div className="font-display text-[1.8rem] leading-none text-white tabular-nums">{n}</div>
                    <div className="mt-1 text-[0.72rem] text-white/65">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── DESKTOP: full-bleed overlay (unchanged) ── */}
        <div className="relative hidden sm:block min-h-[92vh] overflow-hidden bg-[#0d0d0e]">
          <div className="absolute inset-0 ken-burns">
            <Image
              src={claudeHomeHero}
              alt="Luxury Pacific Northwest home represented by Matin Real Estate"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_40%]"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(210,160,80,0.08),transparent)]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.025] mix-blend-overlay"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "150px" }}
          />

          <div className="relative z-10 flex min-h-[92vh] items-end">
            <Container className="pt-20">
              <div className="w-full pb-14 lg:pb-16 max-w-3xl">
                <Reveal>
                  <span className="hero-text-shadow eyebrow eyebrow-light">Portland · Lake Oswego · West Linn · SW Washington</span>
                </Reveal>
                <Reveal delay={0.08}>
                  <h1 className="hero-text-shadow mt-5 max-w-[760px] font-display text-[clamp(3.1rem,6vw,5rem)] font-normal leading-[0.98] text-white text-balance">
                    Find your place in the Pacific Northwest.
                  </h1>
                </Reveal>
                <Reveal delay={0.16}>
                  <p className="mt-6 max-w-[610px] text-base leading-relaxed text-white/82 text-pretty sm:text-lg">
                    The Portland area&apos;s most technologically advanced brokerage: real local guidance, cinematic
                    property marketing, and an AI concierge that helps you move faster.
                  </p>
                </Reveal>
                <Reveal delay={0.24}>
                  <div className="mt-8">
                    <PropertySearchBar dark />
                  </div>
                </Reveal>
                <Reveal delay={0.32}>
                  <div className="mt-8 flex max-w-[760px] flex-wrap gap-x-10 gap-y-4 border-t border-white/18 pt-6">
                    {heroStats.map(([n, l]) => (
                      <div key={l}>
                        <div className="font-display text-[1.85rem] leading-none text-white tabular-nums">{n}</div>
                        <div className="mt-1 text-[0.78rem] text-white/66">{l}</div>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>
            </Container>
          </div>

          {/* Scroll indicator — desktop only */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/50">
            <span className="text-[0.65rem] uppercase tracking-widest">Scroll</span>
            <div className="h-10 w-px bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
          </div>
        </div>
      </section>

      {/* ---------- FEATURED LISTINGS ---------- */}
      <Section className="pt-14 pb-14 md:pt-20 md:pb-20">
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
          <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
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
      <Section className="bg-[linear-gradient(180deg,#f6f6f5_0%,#ececeb_100%)] pt-14 md:pt-20">
        <Container>
          <SectionHeading
            eyebrow="Explore communities"
            title="Every neighborhood, known by heart"
            intro="From West Linn bluffs to Lake Oswego lakefront and the Vancouver waterfront — we live where we sell."
            align="center"
          />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6 sm:mt-12">
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
                  src={company.officeHero}
                  alt="Matin Real Estate West Linn office"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
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

      {/* ---------- AGENTS TEASER ---------- */}
      <Section className="pt-14 pb-14 md:pt-20 md:pb-16">
        <Container>
          <div className="flex flex-col items-center text-center">
            <SectionHeading
              eyebrow="Meet the team"
              title="40+ brokers who live where they sell"
              intro="Local specialists across Portland, Lake Oswego, West Linn, and SW Washington."
              align="center"
            />
            <div className="mt-8 flex flex-wrap justify-center gap-2 sm:mt-10 sm:gap-3">
              {salesAgents.slice(0, 12).map((a) => (
                <Link key={a.slug} href={`/agents/${a.slug}`} title={a.name} className="group relative">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-cloud shadow-soft transition-all duration-300 group-hover:ring-ink group-hover:shadow-lift sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]">
                    <Image src={a.photo} alt={a.name} fill sizes="(max-width: 768px) 64px, 72px" className="object-cover object-top" />
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
      <Section className="bg-paper py-14 md:py-20">
        <Container>
          <SectionHeading eyebrow="Client stories" title="People who trusted us with the biggest move of their lives" align="center" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.08}>
                <figure className="flex h-full flex-col rounded-2xl bg-cloud p-6 shadow-soft ring-1 ring-ink/[0.07] sm:p-7">
                  {/* Stars up top — more scannable */}
                  <div className="flex items-center gap-1 text-ink/55">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  {/* Quote mark — visible but decorative */}
                  <Quote className="mt-4 h-7 w-7 text-ink/[0.08]" />
                  <blockquote className="mt-2 flex-1 font-display text-[0.95rem] leading-relaxed text-ink/80 italic sm:text-[1.02rem]">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-ink/[0.07] pt-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-[0.75rem] font-semibold tracking-wide text-white">
                      {t.name.split(" ")[0][0]}{t.name.includes("&") ? t.name.split("&")[1]?.trim()?.[0] ?? "" : (t.name.split(" ")[1]?.[0] ?? "")}
                    </div>
                    <div>
                      <div className="text-[0.85rem] font-semibold text-ink">{t.name}</div>
                      <div className="text-[0.75rem] text-slate">{t.area}</div>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---------- FINAL CTA ---------- */}
      <Section className="pb-24 md:pb-28">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-center text-white shadow-glow sm:px-10 sm:py-16 md:px-16 md:py-20">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(210,160,80,0.08),transparent)]" />
            <div className="absolute inset-0 grid-tech opacity-20" />
            {/* Subtle ambient warmth */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_80%,rgba(255,255,255,0.03),transparent)]" />
            <div className="relative">
              <h2 className="display-2 font-display text-white text-balance">Ready to make your move?</h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/75 text-pretty sm:text-base">
                Whether you&apos;re buying, selling, or just exploring — let&apos;s talk. Or ask our AI concierge anything,
                right now.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <ButtonLink href="/contact" variant="white" size="lg" className="w-full sm:w-auto">Talk to a broker</ButtonLink>
                <ButtonLink href="/sell" variant="outline-light" size="lg" className="w-full sm:w-auto">Get your home value</ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
