import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight, Phone, Wrench, Eye, Percent, CalendarCheck, ShieldCheck, Home,
  Check, X, Star, MapPin,
} from "lucide-react";
import { Section, Container } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { AskMatinButton } from "@/components/site/AskMatinButton";
import { CashOfferEstimator } from "@/components/site/cash/CashOfferEstimator";
import { CashFaqAccordion } from "@/components/site/cash/CashFaqAccordion";
import { company } from "@/lib/data";

export const metadata: Metadata = {
  title: "Matin Cash Offer — Sell your home for cash, as-is",
  description:
    "The Matin Real Estate cash-offer program. Get a no-obligation cash offer in 24 hours — or compare it side-by-side with an open-market listing, both priced by Matin AI from live RMLS comps. Skip repairs, showings, and fees, and close in as little as 14 days.",
};

const tel = `tel:+1${company.phoneRaw}`;

/* Design's 3-step strip (#w-cash). */
const steps: [string, string, string][] = [
  ["01", "Share your home", "A few questions. No walkthroughs, no prep."],
  ["02", "Compare your offers", "Cash vs. open-market, priced by AI."],
  ["03", "Choose your close date", "Pick the timeline that fits your move."],
];

/* Credibility — the real brokerage behind the offer (real values from company.stats). */
const credibility = [
  { stat: company.stats.annualVolume, label: "In annual local sales" },
  { stat: company.stats.propertiesSold, label: "Homes sold" },
  { stat: "OR & WA", label: "Licensed brokerage" },
  { stat: `${company.stats.agents}+`, label: "Local brokers" },
];

const perks = [
  { icon: Wrench, title: "Sell completely as-is", body: "Skip repairs, cleaning, and contractors. We buy it exactly how it sits today." },
  { icon: Eye, title: "Zero showings", body: "No open houses, no strangers walking through, no keeping it 'show-ready' for weeks." },
  { icon: Percent, title: "No fees or commissions", body: "No 6% listing fee, no surprise closing costs eating into your proceeds." },
  { icon: CalendarCheck, title: "Pick your close date", body: "Need to move in two weeks — or in three months? You choose. We work around you." },
  { icon: ShieldCheck, title: "Certain & cash-backed", body: "No financing fall-through, no appraisal gaps. A real cash offer that actually closes." },
  { icon: Home, title: "Any home, any situation", body: "Inherited, behind on payments, tired rental, major repairs — we've handled it all." },
];

const compare: [string, string, string][] = [
  ["Time to close", "As little as 14 days", "60–90+ days"],
  ["Repairs needed", "None — sold as-is", "Often thousands"],
  ["Showings & open houses", "Zero", "Weeks of them"],
  ["Commissions & fees", "$0", "~6% + closing costs"],
  ["Financing risk", "None — it's cash", "Deals fall through"],
  ["Cleaning & staging", "Not your problem", "On you"],
];

const testimonials = [
  { name: "Sandra M.", city: "Lake Oswego, OR", quote: "I thought selling would take months. Matin had a cash offer in my inbox the next morning and we closed in nine days. Absolutely painless." },
  { name: "Robert & Diane T.", city: "Beaverton, OR", quote: "We inherited a property that needed serious work. Matin bought it as-is — no repairs, no staging, no drama. The whole thing felt almost too easy." },
  { name: "Kevin L.", city: "West Linn, OR", quote: "The offer was fair and they were completely transparent about how they got there. No pressure, no games. I'd do it again without hesitation." },
];

const faqs = [
  { q: "How is the offer calculated?", a: "We price real, current comparable sales in your neighborhood — drawn from Matin's $130M+ in annual local sales — factor in condition and any needed work, then make a fair cash offer with zero fees taken out. Want top dollar instead? We'll price an open-market listing the same day so you can compare both paths, side by side." },
  { q: "Do I need to make repairs?", a: "None at all. We buy in any condition — outdated kitchens, damaged roofs, inherited clutter, tenant-occupied. Leave what you don't want; take what you do." },
  { q: "How fast can you close?", a: "As little as 14 days, or on whatever date works for you. No bank underwriting means no waiting and no deals falling through at the last minute." },
  { q: "Are there fees or commissions?", a: "None. No 6% listing commission, no closing-cost surprises, no repair credits. The number we agree on is what you walk away with." },
  { q: "What if I have a mortgage?", a: "No problem. We handle payoff coordination with your lender at closing — it's completely standard and won't slow anything down." },
];

function SectionHead({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-gold">{eyebrow}</span>
      <h2 className="display-3 mt-3.5 font-display text-ink text-balance">{title}</h2>
      {intro && <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate text-pretty">{intro}</p>}
    </div>
  );
}

export default function CashOfferPage() {
  return (
    <div className="bg-paper">
      {/* HERO — faithful port of #w-cash: split (heading + estimator | image), then the 3-step strip */}
      <section id="estimate" className="container-x scroll-mt-24 pt-7 pb-2 sm:pt-9">
        <div className="grid items-stretch gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:gap-12">
          {/* Left — heading + estimator */}
          <div className="min-w-0">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#cfe3d7] bg-gold-soft px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold-ink">
                <span className="font-display inline-flex h-[15px] w-[15px] items-center justify-center rounded-[4px] bg-gold text-[10px] leading-none text-white" aria-hidden>M</span>
                Matin Cash Offer
              </span>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="display-2 mt-5 font-display text-ink text-balance" style={{ letterSpacing: "-0.02em" }}>
                Sell on your timeline. Skip the showings.
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 max-w-[46ch] text-[1.02rem] leading-relaxed text-ink-600">
                Get a competitive, no-obligation cash offer in 24 hours — or list on the open market.
                Matin AI prices both paths from live RMLS comps so you can compare, side by side.
              </p>
            </Reveal>
            <Reveal delay={0.16} className="mt-7">
              <CashOfferEstimator />
            </Reveal>
          </div>

          {/* Right — image with floating proof cards */}
          <Reveal delay={0.12} className="min-w-0">
            <div className="relative h-full min-h-[280px] overflow-hidden rounded-2xl border border-ink/10 shadow-soft sm:min-h-[360px] lg:min-h-[560px]">
              <Image
                src="/matin/exteriors/exteriors-09.jpg"
                alt="A West Linn home being sold to Matin for cash"
                fill
                priority
                sizes="(min-width:1024px) 46vw, 100vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(200deg,rgba(6,6,6,0) 40%,rgba(6,6,6,.45) 100%)" }} />

              <div className="absolute right-4 top-4 inline-flex items-center gap-2.5 rounded-xl bg-paper/90 px-3.5 py-2.5 shadow-lg backdrop-blur">
                <span className="pulse-dot h-[9px] w-[9px] rounded-full bg-gold" aria-hidden />
                <span className="text-[0.8rem] font-semibold text-ink">Instant offer in 24 hours</span>
              </div>

              <div className="absolute inset-x-4 bottom-4 flex gap-2.5">
                {[
                  ["2", "paths priced"],
                  ["$0", "upfront cost"],
                  ["14d", "to close"],
                ].map(([n, l]) => (
                  <div key={l} className="min-w-0 flex-1 rounded-xl bg-paper/90 px-3 py-2.5 shadow-lg backdrop-blur">
                    <div className="font-display text-[1.35rem] leading-none text-ink tabular-nums">{n}</div>
                    <div className="mt-1 truncate text-[0.7rem] text-slate">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* 3-step strip */}
        <div className="mt-10 grid grid-cols-1 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft sm:grid-cols-3">
          {steps.map(([n, title, body], i) => (
            <div
              key={n}
              className={`px-6 py-6 sm:px-7 ${i > 0 ? "border-t border-ink/8 sm:border-l sm:border-t-0" : ""}`}
            >
              <div className="font-display text-[0.85rem] text-gold tabular-nums">{n}</div>
              <div className="mt-1.5 text-[1rem] font-semibold text-ink">{title}</div>
              <div className="mt-1 text-[0.86rem] leading-relaxed text-slate">{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CREDIBILITY — the real brokerage behind the offer */}
      <section className="mt-12 border-y border-ink/10 bg-white">
        <Container>
          <div className="grid grid-cols-2 divide-x divide-y divide-ink/8 sm:divide-y-0 md:grid-cols-4">
            {credibility.map((c) => (
              <div key={c.label} className="px-4 py-7 text-center">
                <p className="font-display text-[1.7rem] text-ink tabular-nums">{c.stat}</p>
                <p className="mt-1 text-[0.78rem] text-slate">{c.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* PERKS */}
      <Section>
        <Container>
          <SectionHead eyebrow="Why sell to Matin" title="The easiest way to sell — full stop" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {perks.map((p, i) => (
              <Reveal key={p.title} delay={(i % 3) * 0.07}>
                <div className="h-full rounded-2xl border border-ink/8 bg-white p-6 shadow-soft transition-colors hover:border-gold/40">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-soft text-gold ring-1 ring-inset ring-[#cfe3d7]">
                    <p.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 font-display text-xl text-ink">{p.title}</h3>
                  <p className="mt-1.5 text-[0.92rem] leading-relaxed text-slate">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* COMPARISON */}
      <Section className="bg-white">
        <Container>
          <SectionHead eyebrow="The difference" title="The Matin cash offer vs. the traditional sale" />

          {/* Phone (< sm): stacked comparison cards */}
          <div className="mx-auto mt-10 grid max-w-md gap-3 sm:hidden">
            {compare.map(([label, a, b]) => (
              <div key={label} className="rounded-2xl border border-ink/10 bg-paper p-4">
                <div className="text-[0.78rem] font-semibold uppercase tracking-wider text-slate">{label}</div>
                <div className="mt-2.5 flex items-start gap-2 text-[0.92rem] text-gold-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <span><span className="text-gold/80">Matin cash offer:</span> {a}</span>
                </div>
                <div className="mt-1.5 flex items-start gap-2 text-[0.92rem] text-slate">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-slate/50" />
                  <span><span className="text-slate/70">Traditional:</span> {b}</span>
                </div>
              </div>
            ))}
          </div>

          {/* sm+ : full comparison table */}
          <div className="mx-auto mt-12 hidden max-w-3xl overflow-hidden rounded-2xl border border-ink/10 shadow-soft sm:block">
            <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-paper-200 text-[0.8rem] font-semibold uppercase tracking-wider text-slate">
              <div className="px-5 py-3.5" />
              <div className="px-5 py-3.5 text-gold">Matin cash offer</div>
              <div className="px-5 py-3.5 text-slate">Traditional sale</div>
            </div>
            {compare.map(([label, a, b], i) => (
              <div key={label} className={`grid grid-cols-[1.4fr_1fr_1fr] items-center text-[0.9rem] ${i % 2 ? "bg-paper/60" : "bg-white"}`}>
                <div className="min-w-0 px-5 py-3.5 font-medium text-ink">{label}</div>
                <div className="flex min-w-0 items-center gap-2 px-5 py-3.5 text-gold-ink">
                  <Check className="h-4 w-4 shrink-0 text-gold" /> {a}
                </div>
                <div className="flex min-w-0 items-center gap-2 px-5 py-3.5 text-slate">
                  <X className="h-4 w-4 shrink-0 text-slate/45" /> {b}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* SOCIAL PROOF */}
      <Section>
        <Container>
          <SectionHead eyebrow="Seller stories" title="Real people, real results" />
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.08}>
                <figure className="flex h-full flex-col rounded-2xl border border-ink/8 bg-white p-6 shadow-soft">
                  <div className="flex gap-0.5 text-gold">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1">
                    <p className="text-[0.93rem] leading-relaxed text-ink-600 italic">&ldquo;{t.quote}&rdquo;</p>
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-2 border-t border-ink/8 pt-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-soft text-[0.8rem] font-bold text-gold-ink">
                      {t.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{t.name}</p>
                      <p className="flex items-center gap-1 text-[0.78rem] text-slate">
                        <MapPin className="h-3 w-3" /> {t.city}
                      </p>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section className="bg-white">
        <Container>
          <SectionHead eyebrow="Good to know" title="Cash offer questions, answered" />
          <CashFaqAccordion faqs={faqs} />
        </Container>
      </Section>

      {/* CTA — premium closing band (real cash photography + Estate-Green concierge) */}
      <section className="relative overflow-hidden">
        <Image
          src="/matin/cash/cash-09.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(6,6,6,.86),rgba(6,6,6,.72))" }} />
        <Container className="relative py-20 text-center md:py-28">
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/82">Real cash. No banks. Your timeline.</span>
          <h2 className="display-2 mt-4 font-display text-white text-balance">Ready for a real cash offer?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-300">
            Get your no-obligation number today, backed by a real {company.address.state} &amp; WA brokerage.
            If it&apos;s a fit, you could be closed and paid in as little as two weeks.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="#estimate" size="lg" variant="white">
              Get my cash offer <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <AskMatinButton label="Ask Matin about selling" className="px-5 py-3.5 text-[0.9rem]" />
            <a href={tel} className="inline-flex items-center gap-2 text-[0.9rem] font-semibold text-white/90 tabular-nums transition-colors hover:text-white">
              <Phone className="h-4 w-4" /> {company.phone}
            </a>
          </div>
        </Container>
      </section>
    </div>
  );
}
