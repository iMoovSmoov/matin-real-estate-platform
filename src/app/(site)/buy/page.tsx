import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight, Search, Handshake, KeyRound, FileSignature, ShieldCheck,
  TrendingUp, Cpu, Users, Building2, BadgeCheck, CalendarClock, Wallet, ClipboardList, CheckCircle2,
  BadgeDollarSign, MapPin, Calculator, HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { ListingCard } from "@/components/site/ListingCard";
import { ProcessSteps } from "@/components/site/marketing/ProcessSteps";
import { BuyStickyCta } from "@/components/site/buy/BuyStickyCta";
import { company, featuredListings, listingPhoto } from "@/lib/data";
import { usd, num } from "@/lib/utils";

/* Faithful to the design's 10px rectangular buttons (#w-buy) — solid ink +
   ghost outline, distinct from the site's older pill CTAs. */
const BTN_INK =
  "inline-flex items-center justify-center gap-2 rounded-[10px] bg-ink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 rounded-[10px] border border-ink/[0.18] bg-transparent px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-ink/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2";

/* Hero feature trio + payment-calculator preview fields (design #w-buy). */
const heroFeatures = [
  { n: "01", title: "Off-market access", body: "See homes before they list." },
  { n: "02", title: "AI-matched", body: "Alerts tuned to your taste." },
  { n: "03", title: "Concierge tours", body: "Booked around your week." },
];

const paymentFields = [
  { label: "Home price", value: "$1,200,000" },
  { label: "Down · 20%", value: "$240,000" },
  { label: "Rate", value: "6.75%" },
  { label: "Term", value: "30 yr" },
];

const HERO_BLUR =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

export const metadata: Metadata = {
  title: "Buy a Home | Matin Real Estate",
  description:
    "Find your next home in Portland's best communities. Off-market access, pre-approval help, expert negotiation, and 40+ full-time brokers in your corner.",
};

const buyingSteps = [
  { title: "Consult", body: "Meet with a Matin broker — in person or by phone — to define your budget, must-haves, and timeline. We connect you with trusted local lenders so you shop pre-approved and ready to move." },
  { title: "Search", body: "Your broker curates listings from the largest local database in the metro, including off-market and coming-soon properties others never see, then tours with you and narrows to the right fit." },
  { title: "Close", body: "We craft a winning offer, negotiate hard on your behalf, and coordinate every step — inspections, appraisal, and closing — so your keys arrive on schedule and without surprises." },
];

/** 4-step buyer journey with icons — used in the new "How buying works" section */
const journeySteps = [
  {
    icon: BadgeDollarSign,
    step: "01",
    title: "Get pre-approved",
    body: "Know your number before you tour. We connect you with trusted local lenders for a fast, no-pressure pre-approval letter.",
    href: "/contact",
    cta: "Start here →",
  },
  {
    icon: Search,
    step: "02",
    title: "Find your home",
    body: "Browse MLS listings plus off-market and coming-soon properties that never hit Zillow — curated by your dedicated broker.",
    href: "/property-search",
    cta: "Search homes →",
  },
  {
    icon: Cpu,
    step: "03",
    title: "Make an offer",
    body: "AI-powered offer strategy built on live comps, days-on-market, and seller motivation — so you win without overpaying.",
    href: "/contact",
    cta: "Talk strategy →",
  },
  {
    icon: KeyRound,
    step: "04",
    title: "Close with confidence",
    body: "We coordinate inspections, appraisal, and escrow — handling every deadline so move-in day arrives without surprises.",
    href: "/contact",
    cta: "Meet your broker →",
  },
];

const values = [
  { icon: Building2, title: "Off-market access", body: "Coming-soon and pocket listings across our 40-broker network mean opportunities most buyers never even hear about." },
  { icon: ShieldCheck, title: "Pre-approval help", body: "We connect you with trusted local lenders so you shop with a clear budget and a competitive edge — before you ever tour a home." },
  { icon: TrendingUp, title: "Expert negotiation", body: "Live comps and deep market knowledge help us price your offer to win without overpaying, even in a multiple-offer market." },
  { icon: CheckCircle2, title: "Full transaction support", body: "We coordinate inspections, appraisal, lending, and closing — keeping every deadline on track so move-in day arrives without surprises." },
  { icon: Users, title: "40+ full-time brokers", body: "Never a part-timer. A licensed OR & WA broker who knows your neighborhood by heart is in your corner from first tour to final signature." },
  { icon: BadgeCheck, title: "Award-winning team", body: "Portland Business Journal fastest-growing, $130M+ closed, and 305+ families moved every year. Experience you can feel." },
];

const resources = [
  { icon: Wallet, title: "Getting pre-approved", body: "What lenders look for, how much you can borrow, and why a pre-approval letter wins offers.", tag: "Financing" },
  { icon: KeyRound, title: "First-time buyer guide", body: "From earnest money to escrow — every step explained in plain English, no jargon.", tag: "Guide" },
  { icon: FileSignature, title: "Making a strong offer", body: "Escalation clauses, contingencies, and the strategy that wins in a competitive market.", tag: "Strategy" },
  { icon: ClipboardList, title: "Closing costs explained", body: "A clear breakdown of what you'll actually pay at the table — and what's negotiable.", tag: "Costs" },
];

/** Buying tools — 3 cards below testimonial */
const buyingTools = [
  {
    icon: Calculator,
    title: "Mortgage Calculator",
    body: "Estimate your monthly payment, amortization, and total interest in seconds.",
    href: "/mortgage-calculator",
    cta: "Try it →",
  },
  {
    icon: HelpCircle,
    title: "Affordability Quiz",
    body: "Answer five quick questions to find out what price range actually fits your life.",
    href: "/contact",
    cta: "Take the quiz →",
  },
  {
    icon: MapPin,
    title: "Portland Area Guide",
    body: "Neighborhood-by-neighborhood breakdown of schools, commute times, and home values.",
    href: "/communities",
    cta: "Explore areas →",
  },
];

export default function BuyPage() {
  return (
    <>
      {/* ---------- HERO — design #w-buy (split, light, solid header) ---------- */}
      <Section className="pt-9 pb-12 sm:pt-12 md:pt-16">
        <Container>
          <div className="grid items-stretch gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            {/* Left — copy */}
            <div className="flex min-w-0 flex-col justify-center">
              <Reveal>
                <span className="eyebrow text-gold">Buyers</span>
              </Reveal>
              <Reveal delay={0.08}>
                <h1 className="mt-4 font-display text-[clamp(2.2rem,5vw,3.1rem)] font-normal leading-[1.02] tracking-[-0.02em] text-ink text-balance">
                  Win the home, not the bidding war.
                </h1>
              </Reveal>
              <Reveal delay={0.14}>
                <p className="mt-5 max-w-[46ch] text-[1.0625rem] leading-relaxed text-ink-600 text-pretty">
                  Off-market access, AI-matched listings the moment they hit, and a concierge who books your
                  tours. Get pre-approved and start touring this week.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/contact" className={BTN_INK}>
                    Get pre-approved
                  </Link>
                  <Link href="/property-search" className={BTN_GHOST}>
                    Browse homes
                  </Link>
                </div>
              </Reveal>
              <Reveal delay={0.26}>
                <div className="mt-9 grid grid-cols-3 gap-4 sm:gap-6">
                  {heroFeatures.map((f) => (
                    <div key={f.n} className="min-w-0">
                      <div className="font-display text-[0.95rem] text-gold tabular-nums">{f.n}</div>
                      <div className="mt-1.5 text-[0.875rem] font-semibold text-ink">{f.title}</div>
                      <div className="mt-1 text-[0.8rem] leading-snug text-slate text-pretty">{f.body}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Right — image with floating "Pre-approval in minutes" pill */}
            <Reveal delay={0.12}>
              <div className="relative h-72 min-w-0 overflow-hidden rounded-2xl shadow-lift sm:h-96 lg:h-full lg:min-h-[480px]">
                <Image
                  src="/matin/interiors/interiors-00.jpg"
                  alt="Bright, modern Portland-area home interior"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL={HERO_BLUR}
                />
                <div className="absolute inset-0 bg-[linear-gradient(200deg,rgba(6,6,6,0)_45%,rgba(6,6,6,0.4)_100%)]" />
                <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-xl bg-[rgba(246,246,245,0.92)] px-3.5 py-2.5 shadow-[0_10px_30px_rgba(6,6,6,0.25)] backdrop-blur-md">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-bright/60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
                  </span>
                  <span className="text-[0.8rem] font-semibold text-ink">Pre-approval in minutes</span>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ---------- PAYMENT CALCULATOR + MATCHED FOR YOU — design #w-buy band ---------- */}
      <Section className="pt-0 pb-14 md:pb-20">
        <Container>
          <div className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
            <div className="grid md:grid-cols-2">
              {/* Payment calculator preview */}
              <div className="border-b border-ink/[0.07] p-7 sm:p-8 md:border-b-0 md:border-r">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate">
                    Payment calculator
                  </span>
                  <span className="text-[0.7rem] text-slate/70">Example scenario</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  {paymentFields.map((f) => (
                    <div key={f.label} className="min-w-0 rounded-[10px] border border-ink/[0.14] px-3.5 py-2.5">
                      <div className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-slate/70">
                        {f.label}
                      </div>
                      <div className="mt-0.5 text-[0.95rem] font-semibold text-ink tabular-nums">{f.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-baseline justify-between border-t border-ink/[0.08] pt-4">
                  <span className="text-[0.85rem] text-slate">Est. monthly payment</span>
                  <span className="font-display text-[1.75rem] font-medium text-ink tabular-nums">
                    $6,228<span className="text-[0.85rem] text-slate/70">/mo</span>
                  </span>
                </div>
                <Link
                  href="/mortgage-calculator"
                  className="mt-5 inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-gold transition-colors hover:text-gold-bright"
                >
                  Open the full calculator <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Matched for you — real featured listings */}
              <div className="p-7 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate">
                    Matched for you
                  </span>
                  <Link
                    href="/property-search"
                    className="text-[0.78rem] font-semibold text-ink transition-colors hover:text-gold"
                  >
                    View all
                  </Link>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {featuredListings.slice(0, 3).map((l) => (
                    <Link
                      key={l.id}
                      href={`/listings/${l.id}`}
                      className="group flex items-center gap-3.5 rounded-xl p-1.5 transition-colors hover:bg-paper"
                    >
                      <div className="relative h-14 w-[72px] shrink-0 overflow-hidden rounded-[9px]">
                        <Image src={listingPhoto(l)} alt={l.address} fill sizes="72px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-[1.05rem] font-medium text-ink tabular-nums">
                          {usd(l.price)}
                        </div>
                        <div className="truncate text-[0.8rem] text-ink-600">
                          {l.address}, {l.city}
                        </div>
                        <div className="text-[0.72rem] text-slate tabular-nums">
                          {l.beds} bd · {l.baths} ba · {num(l.sqft)} sqft
                        </div>
                      </div>
                      <span className="shrink-0 rounded-lg bg-gold-soft px-2.5 py-1.5 text-[0.72rem] font-semibold text-gold-ink ring-1 ring-[#cfe3d7] transition-colors group-hover:bg-[#dcefe1]">
                        Tour
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------- HOW BUYING WORKS WITH MATIN — 4-step journey ---------- */}
      <Section className="bg-paper-200/60">
        <Container>
          <SectionHeading
            eyebrow="Your path to keys"
            title="How buying works with Matin"
            intro="A clear, broker-guided path — no guesswork, no surprises, no pressure."
            align="center"
          />
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {journeySteps.map((s, i) => (
              <Reveal key={s.step} delay={(i % 4) * 0.08}>
                <div className="group relative flex h-full flex-col rounded-2xl bg-cloud p-7 shadow-soft ring-1 ring-ink/[0.06] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                  {/* number + icon */}
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink/[0.07] font-display text-xl text-ink transition-colors duration-500 group-hover:bg-ink group-hover:text-white">
                      {s.step}
                    </span>
                    <s.icon className="h-5 w-5 text-ink/40 transition-colors duration-500 group-hover:text-white/60" />
                  </div>
                  <h3 className="mt-5 font-display text-xl text-ink">{s.title}</h3>
                  <p className="mt-2 flex-1 text-[0.92rem] leading-relaxed text-slate">{s.body}</p>
                  <a
                    href={s.href}
                    className="mt-5 inline-flex items-center gap-1 text-[0.85rem] font-semibold text-ink/70 transition-colors hover:text-ink"
                  >
                    {s.cta}
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---------- PROCESS ---------- */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="The Matin buying process"
            title="Three steps from search to keys"
            intro="A clear, broker-guided path — no guesswork, no surprises, no pressure."
            align="center"
          />
          <div className="mt-14">
            <ProcessSteps steps={buyingSteps} className="lg:grid-cols-3" />
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
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={(i % 3) * 0.08}>
                <div className="group flex h-full flex-col rounded-2xl bg-cloud p-7 shadow-soft ring-1 ring-ink/[0.06] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink/[0.07] text-ink transition-colors duration-500 group-hover:bg-ink group-hover:text-white">
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

      {/* ---------- FEATURED TESTIMONIAL — pull quote ---------- */}
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl rounded-3xl bg-ink px-8 py-14 text-center shadow-glow sm:px-14">
            <svg aria-hidden="true" className="mx-auto mb-6 h-8 w-8 text-white/20" viewBox="0 0 32 32" fill="currentColor">
              <path d="M10 8C6.134 8 3 11.134 3 15c0 3.866 3.134 7 7 7a7 7 0 0 0 7-7c0-5.523-4.477-10-10-10Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm12-12c-3.866 0-7 3.134-7 7 0 3.866 3.134 7 7 7a7 7 0 0 0 7-7c0-5.523-4.477-10-10-10Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
            </svg>
            <blockquote>
              <p className="font-display text-2xl leading-snug text-white sm:text-3xl text-balance">
                &ldquo;We were first-time buyers in one of the most competitive markets in years. Our Matin broker found us an off-market home before it was listed — and we closed ten days under asking price.&rdquo;
              </p>
            </blockquote>
            <figcaption className="mt-8">
              <p className="font-semibold text-white">Marcus & Alicia R.</p>
              <p className="mt-0.5 text-sm text-white/50">Lake Oswego, OR · Buyers, 2024</p>
            </figcaption>
          </div>
        </Container>
      </Section>

      {/* ---------- BUYING TOOLS GRID ---------- */}
      <Section className="bg-paper-200/60">
        <Container>
          <SectionHeading
            eyebrow="Buyer tools"
            title="Everything you need before you need it"
            intro="Free calculators and guides built for Portland buyers."
            align="center"
          />
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {buyingTools.map((t, i) => (
              <Reveal key={t.title} delay={i * 0.08}>
                <a
                  href={t.href}
                  className="group flex h-full flex-col rounded-2xl bg-cloud p-7 shadow-soft ring-1 ring-ink/[0.06] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink/[0.07] text-ink transition-colors duration-500 group-hover:bg-ink group-hover:text-white">
                    <t.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-xl text-ink">{t.title}</h3>
                  <p className="mt-2 flex-1 text-[0.93rem] leading-relaxed text-slate">{t.body}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-[0.85rem] font-semibold text-ink/70 transition-colors group-hover:text-ink">
                    {t.cta}
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---------- FEATURED LISTINGS ---------- */}
      <Section>
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Just listed"
              title="Homes worth touring this week"
              intro="A curated look at what's moving across the metro right now."
            />
            <ButtonLink href="/property-search" variant="outline" className="hidden shrink-0 sm:inline-flex">
              View all listings <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          <div className="mt-10 sm:mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            title="Know before you offer"
            intro="The questions every buyer asks — answered by the team that closes 305+ homes a year."
            align="center"
          />
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
            {resources.map((r, i) => (
              <Reveal key={r.title} delay={(i % 2) * 0.08}>
                <a
                  href="/blog"
                  className="group flex h-full items-start gap-5 rounded-2xl bg-cloud p-6 shadow-soft ring-1 ring-ink/[0.06] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink/[0.07] text-ink transition-colors duration-500 group-hover:bg-ink group-hover:text-white">
                    <r.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <Badge tone="neutral">{r.tag}</Badge>
                    <h3 className="mt-2.5 font-display text-lg text-ink">{r.title}</h3>
                    <p className="mt-1 text-[0.9rem] leading-relaxed text-slate">{r.body}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-[0.85rem] font-medium text-ink/60">
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

      {/* ---------- CTA + desktop sidebar widget ---------- */}
      <Section className="pb-28">
        <Container>
          {/* layout: CTA panel left, sidebar widget right on desktop */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
            {/* Main CTA panel */}
            <div className="relative flex-1 overflow-hidden rounded-3xl bg-ink px-6 py-14 text-center text-white shadow-glow sm:px-8 sm:py-16 md:px-16">
              <div className="absolute inset-0 grid-tech opacity-20" />
              <div className="relative">
                <span className="eyebrow eyebrow-light">Ready when you are</span>
                <h2 className="display-2 mt-4 font-display text-white text-balance">
                  Let&apos;s find your next front door
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-white/90 text-pretty">
                  Tell us what you&apos;re looking for and we&apos;ll match you with the right broker and the
                  right homes — many before they hit the open market.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
                  <ButtonLink href="/property-search" variant="white" size="lg">
                    <Search className="h-4 w-4" /> Start your search
                  </ButtonLink>
                  <ButtonLink href="/contact" variant="outline-light" size="lg">
                    <Handshake className="h-4 w-4" /> Talk to a buyer&apos;s agent
                  </ButtonLink>
                </div>
                <p className="mt-6 flex items-center justify-center gap-2 text-[0.85rem] text-white/80">
                  <CalendarClock className="h-4 w-4" /> {company.hours} · {company.phone}
                </p>
              </div>
            </div>

            {/* Desktop sidebar widget — hidden on mobile (sticky strip handles that) */}
            <div className="hidden lg:flex lg:w-80 lg:shrink-0 flex-col rounded-2xl border border-ink/[0.10] bg-cloud p-8 shadow-soft">
              <p className="font-display text-xl text-ink">Ready to start?</p>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-slate">
                Drop your email and a broker will reach out within one business day — no spam, no pressure.
              </p>
              <form
                action="/contact"
                method="GET"
                className="mt-6 flex flex-col gap-3"
              >
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  className="h-11 w-full rounded-full border border-ink/15 bg-paper px-4 text-[0.9rem] text-ink placeholder:text-slate/60 outline-none focus:border-ink/50 focus:ring-2 focus:ring-ink/10 transition"
                />
                <button
                  type="submit"
                  className="h-11 w-full rounded-full bg-ink text-[0.9rem] font-semibold text-white transition-colors hover:bg-ink-700 active:scale-[0.98]"
                >
                  Get connected
                </button>
              </form>
              <p className="mt-4 text-center text-[0.78rem] text-slate/60">No spam. Unsubscribe any time.</p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Mobile sticky bottom strip */}
      <BuyStickyCta />
    </>
  );
}
