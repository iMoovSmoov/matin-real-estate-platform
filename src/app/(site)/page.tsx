import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowRight, Award, ShieldCheck, TrendingUp, Quote, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Section, Container } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PropertySearchBar } from "@/components/site/PropertySearchBar";
import { ListingCard } from "@/components/site/ListingCard";
import { CommunityCard } from "@/components/site/CommunityCard";
import { AskMatinButton } from "@/components/site/AskMatinButton";
import {
  company, featuredListings, popularCommunities, salesAgents, listings,
} from "@/lib/data";

export const metadata: Metadata = {
  title: { absolute: "Matin Real Estate — Find your place in the Pacific Northwest" },
  description:
    "Portland & SW Washington's most advanced brokerage. Search homes, explore communities, and work with 60+ full-time OR & WA brokers backed by AI-assisted pricing and negotiation.",
};

// Real company figures — these JSON values already read $130M+ / 305+ / 60 / 40,
// exactly the design's stat strip. No fabrication; straight from company.stats.
const heroStats: [string, string][] = [
  [String(company.stats.annualVolume), "Annual volume"],
  [String(company.stats.propertiesSold), "Homes sold"],
  [`${company.stats.agents}+`, "Brokers"],
  [String(company.stats.citiesServed), "Cities served"],
];

const values = [
  { icon: TrendingUp, title: "Data-driven from offer to close", body: "Live comps, sharp pricing, and AI-assisted negotiation built on the largest local dataset in the metro." },
  { icon: ShieldCheck, title: "Full-service, full-time brokers", body: `${company.stats.agents}+ licensed OR & WA brokers — never part-timers. Someone is always in your corner.` },
  { icon: Award, title: "A top-producing, award-winning team", body: "Portland Business Journal fastest-growing, $130M+ closed, and 305+ families moved each year." },
];

const testimonials = [
  { name: "The Harrisons", area: "West Linn, OR", quote: "Matin sold our home in a weekend, over asking, with zero stress. The marketing was on another level." },
  { name: "Priya & Sam", area: "Lake Oswego, OR", quote: "First-time buyers and they treated us like their biggest client. We never felt rushed or out-negotiated." },
  { name: "D. Okafor", area: "Camas, WA", quote: "Relocating from out of state, their team made it effortless. The tech and communication were incredible." },
];

// Full-bleed hero photo. A real exterior reads stronger as the showpiece than
// the office interior (company.officeHero, reused below in "Why Matin").
const homeHero = "/matin/exteriors/exteriors-11.jpg";

/**
 * Design-faithful section header: green (Estate Green) eyebrow + Fraunces title
 * at the design's ~32px section scale, optional intro. Mirrors the `#w-home`
 * "Featured listings / Now on the market" header block.
 */
function SectionHead({
  eyebrow,
  title,
  intro,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <span className="eyebrow text-gold">{eyebrow}</span>
      <h2 className="display-3 mt-3 font-display font-normal leading-[1.05] tracking-[-0.015em] text-ink text-balance">
        {title}
      </h2>
      {intro && (
        <p className="mt-4 text-base leading-relaxed text-slate text-pretty sm:text-lg">{intro}</p>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ====================================================================
          HERO  —  #w-home : 560px full-bleed Ken-Burns photo, linear scrim,
          eyebrow + Fraunces 4.4rem headline, translucent search, stats strip.
          The transparent overlay nav is rendered by SiteHeader (foundation).
      ==================================================================== */}
      <section id="main-content">

        {/* ── MOBILE (≤640px): editorial full-bleed hero ── */}
        <div className="sm:hidden">
          <div className="relative isolate min-h-[calc(100svh-56px)] overflow-hidden bg-ink-900">
            <div className="relative aspect-[3/2] w-full overflow-hidden">
              <Image
                src={homeHero}
                alt=""
                fill
                priority
                sizes="100vw"
                aria-hidden
                className="ken-burns object-cover object-center"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,.62)_0%,rgba(6,6,6,.18)_32%,rgba(6,6,6,.30)_70%,rgba(6,6,6,.78)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-ink-900" />
            </div>

            <div className="relative z-10 flex min-h-[calc(100svh_-_56px_-_66vw)] w-full flex-col justify-end px-5 pb-12 pt-7">
              <span className="hero-text-shadow eyebrow text-white/82">Portland &amp; SW Washington</span>
              <h1 className="hero-text-shadow mt-4 font-display text-[2.2rem] font-normal leading-[0.98] tracking-[-0.02em] text-white text-balance">
                Find your place in the Pacific Northwest.
              </h1>
              <div className="mt-6">
                <PropertySearchBar dark />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-white/18 pt-5">
                {heroStats.map(([n, l]) => (
                  <div key={l} className="min-w-0">
                    <div className="font-display text-[1.8rem] leading-none text-white tabular-nums">{n}</div>
                    <div className="mt-1 text-[0.72rem] text-white/70">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── DESKTOP (≥640px): full-bleed overlay, content bottom-aligned ── */}
        <div className="relative hidden min-h-[560px] overflow-hidden bg-ink-900 sm:block">
          <div className="absolute inset-0 ken-burns">
            <Image
              src={homeHero}
              alt="Pacific Northwest home represented by Matin Real Estate"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_40%]"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,.62)_0%,rgba(6,6,6,.18)_32%,rgba(6,6,6,.30)_70%,rgba(6,6,6,.78)_100%)]" />

          <div className="relative z-10 flex min-h-[560px] items-end">
            <div className="container-x w-full pt-24 pb-9">
              <div className="max-w-[760px]">
                <Reveal>
                  <span className="hero-text-shadow eyebrow text-white/82">Portland &amp; SW Washington</span>
                </Reveal>
                <Reveal delay={0.08}>
                  <h1 className="hero-text-shadow mt-4 font-display text-[clamp(3.1rem,5.6vw,4.4rem)] font-normal leading-[1] tracking-[-0.02em] text-white text-balance">
                    Find your place in the Pacific Northwest.
                  </h1>
                </Reveal>
                <Reveal delay={0.22}>
                  <div className="mt-7">
                    <PropertySearchBar dark />
                  </div>
                </Reveal>
                <Reveal delay={0.3}>
                  <div className="mt-7 flex flex-wrap gap-x-12 gap-y-4 border-t border-white/18 pt-6">
                    {heroStats.map(([n, l]) => (
                      <div key={l} className="min-w-0">
                        <div className="font-display text-[1.85rem] leading-none text-white tabular-nums">{n}</div>
                        <div className="mt-1 text-[0.75rem] text-white/70">{l}</div>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          FEATURED LISTINGS  —  #w-home : paper band, green eyebrow,
          "Now on the market", "View all N homes →", 3-col real ListingCards.
      ==================================================================== */}
      <Section className="bg-paper">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHead eyebrow="Featured listings" title="Now on the market" />
            <Link
              href="/property-search"
              className="group hidden shrink-0 items-center gap-1.5 self-end border-b border-ink pb-0.5 text-[0.82rem] font-semibold text-ink transition-colors hover:text-gold sm:inline-flex"
            >
              View all {listings.length} homes
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-[18px] sm:mt-10 sm:grid-cols-2 sm:gap-[22px] lg:grid-cols-3">
            {featuredListings.slice(0, 6).map((l, i) => (
              <Reveal key={l.id} delay={(i % 3) * 0.08} className="min-w-0">
                <ListingCard listing={l} />
              </Reveal>
            ))}
          </div>

          <div className="mt-7 sm:hidden">
            <ButtonLink href="/property-search" variant="outline" className="w-full justify-center">
              View all {listings.length} homes <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* ====================================================================
          COMMUNITIES  —  real popularCommunities via CommunityCard.
      ==================================================================== */}
      <Section className="bg-[linear-gradient(180deg,#f6f6f5_0%,#ececeb_100%)] pt-14 md:pt-20">
        <Container>
          <SectionHead
            eyebrow="Explore communities"
            title="Every neighborhood, known by heart"
            intro="From West Linn bluffs to Lake Oswego lakefront and the Vancouver waterfront — we live where we sell."
            align="center"
          />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {popularCommunities.map((c, i) => (
              <Reveal key={c.slug} delay={(i % 6) * 0.05} className="min-w-0">
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

      {/* ====================================================================
          WHY MATIN  —  real officeHero + founded year + value props.
      ==================================================================== */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
            <Reveal>
              <div className="relative aspect-[5/4] overflow-hidden rounded-2xl shadow-[0_1px_2px_rgba(20,20,22,.05),0_18px_44px_rgba(20,20,22,.12)] sm:rounded-3xl">
                <Image
                  src={company.officeHero}
                  alt="Matin Real Estate West Linn office"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                />
                <div className="absolute bottom-4 left-4 rounded-2xl bg-paper/95 px-5 py-4 shadow-[0_14px_36px_rgba(20,20,22,.18)] backdrop-blur sm:bottom-5 sm:left-5">
                  <div className="font-display text-3xl text-ink tabular-nums">{company.founded}</div>
                  <div className="text-[0.8rem] text-slate">Founded in West Linn, OR</div>
                </div>
              </div>
            </Reveal>
            <div className="min-w-0">
              <SectionHead eyebrow="Why Matin" title="A brokerage built like a tech company" />
              <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-7">
                {values.map((v) => (
                  <Reveal key={v.title} className="flex gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white sm:h-12 sm:w-12">
                      <v.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0">
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

      {/* ====================================================================
          MEET THE TEAM  —  real salesAgents avatar wall → /agents.
      ==================================================================== */}
      <Section className="pt-14 pb-14 md:pt-20 md:pb-16">
        <Container>
          <div className="flex flex-col items-center text-center">
            <SectionHead
              eyebrow="Meet the team"
              title={`${company.stats.agents}+ brokers who live where they sell`}
              intro="Local specialists across Portland, Lake Oswego, West Linn, and SW Washington."
              align="center"
            />
            <div className="mt-8 flex flex-wrap justify-center gap-2 sm:mt-10 sm:gap-3">
              {salesAgents.slice(0, 12).map((a) => (
                <Link key={a.slug} href={`/agents/${a.slug}`} title={a.name} className="group relative">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-paper shadow-soft transition-all duration-300 group-hover:ring-gold group-hover:shadow-lift sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]">
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

      {/* ====================================================================
          CLIENT STORIES
      ==================================================================== */}
      <Section className="bg-paper py-14 md:py-20">
        <Container>
          <SectionHead
            eyebrow="Client stories"
            title="People who trusted us with the biggest move of their lives"
            align="center"
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.08} className="min-w-0">
                <figure className="flex h-full flex-col rounded-[14px] border border-ink/[0.08] bg-white p-6 shadow-[0_1px_2px_rgba(20,20,22,.05),0_14px_36px_rgba(20,20,22,.08)] sm:p-7">
                  <div className="flex items-center gap-1 text-gold">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <Quote className="mt-4 h-7 w-7 text-ink/[0.08]" />
                  <blockquote className="mt-2 flex-1 font-display text-[0.95rem] italic leading-relaxed text-ink/80 sm:text-[1.02rem]">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-ink/[0.07] pt-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-[0.75rem] font-semibold tracking-wide text-white">
                      {t.name.split(" ")[0][0]}{t.name.includes("&") ? t.name.split("&")[1]?.trim()?.[0] ?? "" : (t.name.split(" ")[1]?.[0] ?? "")}
                    </div>
                    <div className="min-w-0">
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

      {/* ====================================================================
          FINAL CTA  —  dark ink panel + real "Ask Matin" concierge wiring.
      ==================================================================== */}
      <Section className="pb-24 md:pb-28">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(165deg,#13231b,#0a1410)] px-6 py-14 text-center text-white shadow-[0_18px_44px_rgba(0,0,0,.4)] sm:px-10 sm:py-16 md:px-16 md:py-20">
            <div className="ai-bloom -top-10 left-1/2 -translate-x-1/2" aria-hidden />
            <div className="absolute inset-0 grid-tech opacity-20" aria-hidden />
            <div className="relative">
              <h2 className="display-2 font-display font-normal text-white text-balance">Ready to make your move?</h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/75 text-pretty sm:text-base">
                Whether you&apos;re buying, selling, or just exploring — let&apos;s talk. Or ask our AI concierge anything,
                right now.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4">
                <AskMatinButton label="Ask Matin anything" className="px-6 py-3" />
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <ButtonLink href="/contact" variant="white" size="md" className="w-full sm:w-auto">Talk to a broker</ButtonLink>
                  <ButtonLink href="/sell" variant="outline-light" size="md" className="w-full sm:w-auto">Get your home value</ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
