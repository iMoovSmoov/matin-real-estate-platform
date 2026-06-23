import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Camera, Globe2, LineChart, Megaphone, Users2, Quote, Star, ArrowRight,
  DollarSign, CalendarCheck, Hammer, ShieldCheck, ClipboardCheck, Handshake, TrendingUp,
} from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ProcessSteps } from "@/components/site/marketing/ProcessSteps";
import { InstantValue } from "@/components/site/marketing/InstantValue";
import { company, featuredListings } from "@/lib/data";
import { num } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sell Your Home | Matin Real Estate",
  description:
    "Two ways to sell with Matin — list on the open market for top dollar, or take a competitive cash offer and close on your timeline. Matin AI prices both paths from live comps so you can compare, side by side.",
};

/* Design's 10px rectangular hero buttons (#w-sell, over the dark hero). */
const BTN_WHITE =
  "inline-flex items-center justify-center gap-2 rounded-[10px] bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-paper-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";
const BTN_OUTLINE_LIGHT =
  "inline-flex items-center justify-center gap-2 rounded-[10px] border border-white/40 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/80 hover:bg-white/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const HERO_BLUR =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

/* Subject property for the AI estimate band — a REAL featured Matin listing.
   The range is derived from its list price (not a fabricated figure). */
const subject = featuredListings.find((l) => l.id === "MRE-1001") ?? featuredListings[0];
const roundTo = (n: number, step: number) => Math.round(n / step) * step;
const fmtM = (n: number) => `$${(n / 1_000_000).toFixed(2)}M`;
const estimateLow = fmtM(roundTo(subject.price * 0.955, 10_000));
const estimateHigh = fmtM(roundTo(subject.price * 1.065, 10_000));

const advantages = [
  { icon: Camera, title: "Cinematic pro media", body: "Magazine-grade photography, drone, and video on every listing. Buyers shop with their eyes — your home leads with its best face forward." },
  { icon: Globe2, title: "The largest local audience", body: "Your home headlines the largest locally owned real-estate website in the Portland area, plus syndication to every major portal." },
  { icon: LineChart, title: "Pricing that wins", body: "Live comps and AI-assisted analysis set a number that invites offers in the first 10 days instead of chasing the market down." },
  { icon: Megaphone, title: "A $2.4M marketing engine", body: "We reinvest $2.4M a year into reaching buyers — paid, social, email, and a 60-broker referral network working for you." },
  { icon: Users2, title: "A database of ready buyers", body: "We often sell from our own buyer pool before a sign ever hits the lawn — quietly, and often over asking." },
  { icon: ShieldCheck, title: "Full-service, every step", body: "Staging guidance, negotiation, inspections, and closing — coordinated by a full-time broker who answers the phone." },
];

const sellingSteps = [
  { title: "Get your value", body: "Start with our instant AI pricing opinion, then a broker hand-builds a full CMA from real, recent neighborhood comps." },
  { title: "Prep & list", body: "We coordinate staging, pro photography, and a launch plan engineered to maximize first-week demand." },
  { title: "Market & show", body: "Your home goes everywhere buyers look — our website, every portal, paid campaigns, and our buyer database." },
  { title: "Negotiate & close", body: "We field offers, negotiate hard on your behalf, and keep inspections, appraisal, and closing on schedule." },
];

const testimonials = [
  { name: "The Harrisons", area: "West Linn, OR", quote: "Matin sold our home in a weekend, over asking, with zero stress. The marketing was on another level — the photos alone sold it." },
  { name: "Marcus & Lena", area: "Lake Oswego, OR", quote: "Their pricing strategy was spot-on. Five offers in the first week and we closed $42k above where another agent told us to list." },
  { name: "R. Delgado", area: "Vancouver, WA", quote: "We needed to sell fast and as-is. The Matin Cash Offer was competitive and we picked our own close date. Effortless." },
];

const cashFeatures = [
  { icon: DollarSign, title: "A competitive cash offer", body: "A real, written offer on your home in 24 hours — no financing contingencies, no fall-through risk, no waiting on a buyer's loan." },
  { icon: Hammer, title: "Sell completely as-is", body: "Skip repairs, staging, and showings. We buy in any condition — you don't lift a hammer or a paintbrush." },
  { icon: CalendarCheck, title: "Pick your own close date", body: "Need to move in 14 days or 60? Close on the timeline that fits your life, not the market's." },
];

export default function SellPage() {
  return (
    <>
      {/* ---------- HERO — design #w-sell (full-bleed dark; overlay header) ---------- */}
      <section className="relative isolate flex min-h-[78vh] items-end overflow-hidden bg-[#0d0d0e]">
        <div className="absolute inset-0">
          <Image
            src="/matin/interiors/interiors-04.jpg"
            alt="Beautifully staged living space ready for market"
            fill
            priority
            sizes="100vw"
            className="ken-burns object-cover"
            placeholder="blur"
            blurDataURL={HERO_BLUR}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,0.5)_0%,rgba(6,6,6,0.2)_50%,rgba(6,6,6,0.6)_100%)]" />
        </div>
        <div className="relative z-10 w-full px-6 pb-12 pt-28 sm:px-8 sm:pb-16 sm:pt-32 lg:px-[72px]">
          <div className="max-w-[760px]">
            <Reveal>
              <span className="eyebrow hero-text-shadow text-white/80">Sellers</span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="hero-text-shadow mt-4 max-w-[18ch] font-display text-[clamp(2.1rem,5.2vw,3rem)] font-normal leading-[1.02] tracking-[-0.02em] text-white text-balance">
                Two ways to sell. One brokerage that prices both.
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-white/85 text-pretty">
                List on the open market for top dollar, or take a competitive cash offer and close on your
                timeline. Matin AI prices both paths from live comps so you can compare, side by side.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#instant-value" className={BTN_WHITE}>
                  <TrendingUp className="h-4 w-4" /> Get my home value
                </a>
                <Link href="/cash-offer" className={BTN_OUTLINE_LIGHT}>
                  Get a cash offer
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- TWO WAYS TO SELL + AI ESTIMATE — design #w-sell band ---------- */}
      <Section className="pt-12 pb-14 md:pt-16 md:pb-20">
        <Container>
          <div className="grid gap-4 sm:gap-[18px] md:grid-cols-2">
            {/* List on market */}
            <Reveal>
              <div className="flex h-full min-w-0 flex-col rounded-[14px] border border-ink/[0.1] bg-white p-6 shadow-soft sm:p-7">
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate">
                  List on market
                </span>
                <h2 className="mt-2 font-display text-[1.5rem] leading-tight text-ink">Maximize your price</h2>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-slate text-pretty">
                  Full marketing launch — pro photography, 3D tour, targeted ads, and broker open houses.
                  Best when time allows.
                </p>
                <div className="mt-auto flex gap-7 border-t border-ink/[0.08] pt-4 tabular-nums">
                  <div>
                    <div className="font-display text-[1.35rem] text-ink">{company.stats.annualVolume}</div>
                    <div className="text-[0.7rem] text-slate">annual volume</div>
                  </div>
                  <div>
                    <div className="font-display text-[1.35rem] text-ink">{company.stats.propertiesSold}</div>
                    <div className="text-[0.7rem] text-slate">homes sold a year</div>
                  </div>
                </div>
                <a
                  href="#instant-value"
                  className="mt-5 inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-ink transition-colors hover:text-gold"
                >
                  Get my home value <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </Reveal>

            {/* Matin Cash Offer */}
            <Reveal delay={0.08}>
              <div
                className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-[14px] border border-[#cfe3d7] p-6 shadow-soft sm:p-7"
                style={{ background: "linear-gradient(180deg,#fbfffc,#f3faf5)" }}
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-0.5"
                  style={{ background: "linear-gradient(90deg,#2f8a60,transparent 62%)" }}
                />
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-gold font-display text-[11px] text-white">
                    M
                  </span>
                  <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold-ink">
                    Matin Cash Offer
                  </span>
                </div>
                <h2 className="mt-2 font-display text-[1.5rem] leading-tight text-ink">Sell on your timeline</h2>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-[#3f6b54] text-pretty">
                  A competitive cash offer in 24 hours. Skip showings and prep, close in as few as 14 days.
                </p>
                <div className="mt-auto flex gap-7 border-t border-[#cfe3d7] pt-4 tabular-nums">
                  <div>
                    <div className="font-display text-[1.35rem] text-gold">24 hrs</div>
                    <div className="text-[0.7rem] text-[#6b8a78]">to offer</div>
                  </div>
                  <div>
                    <div className="font-display text-[1.35rem] text-gold">$0</div>
                    <div className="text-[0.7rem] text-[#6b8a78]">prep cost</div>
                  </div>
                </div>
                <Link
                  href="/cash-offer"
                  className="mt-5 inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-gold-ink transition-colors hover:text-gold"
                >
                  See your cash offer <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Reveal>
          </div>

          {/* AI estimate band — dark surface, range derived from a real listing */}
          <Reveal delay={0.12}>
            <div
              className="relative mt-4 overflow-hidden rounded-[14px] border border-[#1d3b30] p-6 sm:mt-[18px] sm:p-7"
              style={{
                background: "linear-gradient(155deg,#13231b,#0a1410)",
                boxShadow: "0 14px 36px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(31,107,74,0.16)",
              }}
            >
              <span aria-hidden className="ai-bloom" style={{ right: "-50px", top: "-80px" }} />
              <div className="relative flex flex-wrap items-center justify-between gap-5">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-gold font-display text-[11px] text-white">
                      M
                    </span>
                    <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#7fce9f]">
                      What your home could bring
                    </span>
                  </div>
                  <div className="font-display text-[clamp(1.9rem,4vw,2.15rem)] leading-none text-white tabular-nums">
                    {estimateLow}&nbsp;&ndash;&nbsp;{estimateHigh}
                  </div>
                  <div className="mt-2 text-[0.78rem] text-white/60 tabular-nums">
                    {subject.address} · {subject.beds} bd · {subject.baths} ba · {num(subject.sqft)} sqft ·{" "}
                    {subject.city}, {subject.state}
                  </div>
                </div>
                <Link
                  href="/cash-offer"
                  className="btn-accent inline-flex shrink-0 items-center gap-2 rounded-[10px] px-5 py-3 text-sm font-semibold"
                >
                  Get both offers
                </Link>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ---------- INSTANT VALUE (LIVE AI) ---------- */}
      <Section id="instant-value" className="scroll-mt-24 bg-paper-200/60">
        <Container>
          <SectionHeading
            eyebrow="Instant home value · live AI"
            title="What's your home worth today?"
            intro="Our AI market analyst drafts a real pricing opinion in seconds — then a broker builds your full, comp-by-comp CMA. No phone call required to start."
            align="center"
          />
          <div className="mt-14">
            <InstantValue />
          </div>
        </Container>
      </Section>

      {/* ---------- HOW WE SELL FOR MORE ---------- */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="How we sell for more"
            title="Marketing that moves the market"
            intro="The difference between listed and sold is exposure, presentation, and price. We engineer all three."
            align="center"
          />
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {advantages.map((a, i) => (
              <Reveal key={a.title} delay={(i % 3) * 0.08}>
                <div className="group flex h-full min-w-0 flex-col rounded-2xl bg-white p-7 shadow-soft ring-1 ring-ink/[0.06] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink/[0.06] text-ink transition-colors duration-500 group-hover:bg-ink group-hover:text-white">
                    <a.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-xl text-ink">{a.title}</h3>
                  <p className="mt-2 flex-1 text-[0.93rem] leading-relaxed text-slate">{a.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---------- MATIN CASH OFFER ---------- */}
      <section id="cash-offer" className="relative scroll-mt-24 overflow-hidden bg-ink py-16 text-white sm:py-20 md:py-28">
        <div className="absolute inset-0 grid-tech opacity-50" />
        <div className="absolute -right-40 top-10 h-96 w-96 rounded-full bg-gold/[0.12] blur-3xl" />
        <Container className="relative">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-gold font-display text-[11px] text-white">
                  M
                </span>
                <span className="eyebrow text-white/80">Matin Cash Offer</span>
              </div>
              <h2 className="display-2 mt-4 font-display text-white text-balance">
                Need to sell fast? Get a competitive cash offer.
              </h2>
              <p className="mt-5 max-w-lg text-base sm:text-lg leading-relaxed text-slate-300 text-pretty">
                Not every move fits the open market. With <strong className="text-white">Matin Cash Offer</strong>,
                you can take a competitive cash offer, sell completely as-is, and pick the closing date that
                works for you — priced by the same team you already trust.
              </p>
              <div className="mt-8 space-y-5">
                {cashFeatures.map((f) => (
                  <Reveal key={f.title} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-bright">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg text-white">{f.title}</h3>
                      <p className="mt-1 text-[0.93rem] leading-relaxed text-slate-300">{f.body}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/cash-offer" className="btn-accent inline-flex items-center justify-center gap-2 rounded-[10px] px-6 py-3 text-sm font-semibold">
                  <DollarSign className="h-4 w-4" /> Get my cash offer
                </Link>
                <ButtonLink href="#instant-value" variant="outline-light" size="lg">
                  Compare to a market sale
                </ButtonLink>
              </div>
            </div>

            <Reveal delay={0.1}>
              <div className="relative min-w-0">
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-lift">
                  <Image
                    src="/matin/brand/guaranteed-cash-offer-today.jpg"
                    alt="Matin Cash Offer — a competitive cash offer in 24 hours"
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL={HERO_BLUR}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 rounded-2xl bg-white px-5 py-4 text-ink shadow-lift sm:-bottom-5 sm:-left-5 sm:px-6 sm:py-5">
                  <div className="flex items-center gap-2 text-gold">
                    <ClipboardCheck className="h-5 w-5" />
                    <span className="text-[0.78rem] font-semibold uppercase tracking-wide">No obligation</span>
                  </div>
                  <div className="mt-1.5 font-display text-2xl">Offer in 24 hours</div>
                  <div className="text-[0.82rem] text-slate">Sell as-is · close on your date</div>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ---------- SELL PROCESS ---------- */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="The Matin selling process"
            title="From valuation to sold"
            intro="A proven, broker-led path that's moved 305+ homes a year — engineered to maximize demand from day one."
            align="center"
          />
          <div className="mt-14">
            <ProcessSteps steps={sellingSteps} accentLabel="Step" />
          </div>
        </Container>
      </Section>

      {/* ---------- TESTIMONIALS ---------- */}
      <Section className="bg-paper-200/60">
        <Container>
          <SectionHeading
            eyebrow="Seller stories"
            title="Sold — and thrilled they chose Matin"
            align="center"
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.08}>
                <figure className="flex h-full min-w-0 flex-col rounded-2xl bg-white p-7 shadow-soft ring-1 ring-ink/[0.06]">
                  <Quote className="h-8 w-8 text-ink/[0.12]" />
                  <blockquote className="mt-3 flex-1 text-[0.98rem] leading-relaxed text-ink/85">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 border-t border-ink/[0.07] pt-4">
                    <div className="flex items-center gap-0.5 text-ink/55">
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

      {/* ---------- CTA ---------- */}
      <Section className="pb-28">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-center text-white shadow-glow sm:px-8 sm:py-16 md:px-16">
            <div className="absolute inset-0 grid-tech opacity-20" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgba(31,107,74,0.12),transparent)]" />
            <div className="relative">
              <span className="eyebrow eyebrow-light">Two ways to sell, one trusted team</span>
              <h2 className="display-2 mt-4 font-display text-white text-balance">
                Ready to see what your home is worth?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-white/90 text-pretty">
                List it on the open market for top dollar, or take a competitive cash offer and close on your
                timeline. We&apos;ll help you choose.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
                <ButtonLink href="#instant-value" variant="white" size="lg">
                  <TrendingUp className="h-4 w-4" /> Get my home value
                </ButtonLink>
                <ButtonLink href="/contact" variant="outline-light" size="lg">
                  <Handshake className="h-4 w-4" /> Talk to a listing expert
                </ButtonLink>
              </div>
              <p className="mt-6 text-[0.85rem] text-white/80 tabular-nums">
                {company.hours} · {company.phone}
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
