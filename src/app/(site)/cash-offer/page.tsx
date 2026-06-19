import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight, Phone, Wrench, Eye, Percent, CalendarCheck, ShieldCheck, Home,
  Check, X, Banknote, Clock, ChevronDown,
} from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { CashRain } from "@/components/site/cash/CashRain";
import { CashOfferEstimator } from "@/components/site/cash/CashOfferEstimator";

export const metadata: Metadata = {
  title: "Cash Is King — Sell your home for cash, as-is",
  description:
    "Cash Is King Home Buyers, by Matin Real Estate. Get a no-obligation cash offer, skip repairs, showings, and fees, and close in as little as 7 days.",
};

const perks = [
  { icon: Wrench, title: "Sell completely as-is", body: "Skip repairs, cleaning, and contractors. We buy it exactly how it sits today." },
  { icon: Eye, title: "Zero showings", body: "No open houses, no strangers walking through, no keeping it 'show ready' for weeks." },
  { icon: Percent, title: "No fees or commissions", body: "No 6% listing fee, no surprise closing costs eating into your proceeds." },
  { icon: CalendarCheck, title: "Pick your close date", body: "Need to move in a week — or in three months? You choose. We work around you." },
  { icon: ShieldCheck, title: "Guaranteed & certain", body: "No financing fall-through, no appraisal gaps. A real cash offer that closes." },
  { icon: Home, title: "Any home, any situation", body: "Inherited, behind on payments, tired rental, major repairs — we've handled it all." },
];

const steps = [
  { n: "01", title: "Tell us about your home", body: "Two minutes online or one quick call — address, condition, timeline." },
  { n: "02", title: "Get a cash offer in 24 hours", body: "We run real local comps and send a fair, no-obligation cash offer fast." },
  { n: "03", title: "Close in as little as 7 days", body: "Pick your date, sign, and get paid. No banks, no waiting, no games." },
];

const compare = [
  ["Time to close", "As little as 7 days", "60–90+ days"],
  ["Repairs needed", "None — sold as-is", "Often thousands"],
  ["Showings & open houses", "Zero", "Weeks of them"],
  ["Commissions & fees", "$0", "~6% + closing costs"],
  ["Financing risk", "None — it's cash", "Deals fall through"],
  ["Cleaning & staging", "Not your problem", "On you"],
];

const faqs = [
  { q: "How do you calculate the offer?", a: "We run real, current comparable sales in your neighborhood and factor in condition and any needed work — then make a fair cash offer, usually 90–95% of market value with zero fees taken out." },
  { q: "Are there any fees or commissions?", a: "None. No 6% listing commission, no closing-cost surprises, no repair credits. The number we agree on is what you walk away with." },
  { q: "What condition does my home need to be in?", a: "Any condition. Outdated, damaged, inherited, tenant-occupied, behind on payments — we buy as-is. Leave what you don't want; take what you do." },
  { q: "How fast can we close?", a: "As little as 7 days, or on whatever date works for you. No bank underwriting means no waiting and no deals falling through at the last minute." },
  { q: "Is this really an alternative to listing?", a: "Yes — and we'll tell you honestly when a traditional listing would net you more. As the area's largest brokerage, we can do both and recommend what's actually best for you." },
];

export default function CashOfferPage() {
  return (
    <div className="bg-ink text-white">
      {/* HERO */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink-900 to-ink" />
        <CashRain />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/60" />
        <Container className="relative z-10 pt-28 pb-16 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-[0.78rem] font-semibold tracking-wide text-emerald-300">
              <Banknote className="h-4 w-4" /> Cash Is King Home Buyers · by Matin Real Estate
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="display-1 mx-auto mt-6 max-w-4xl font-display text-white text-balance">
              Sell your home for <span className="italic text-emerald-400">cash.</span> As-is. On your timeline.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 text-pretty">
              No repairs. No showings. No fees. Get a real, no-obligation cash offer and close in as little as
              seven days — backed by the largest locally owned brokerage in the Portland area.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <ButtonLink href="#estimate" size="lg" className="bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_12px_36px_rgba(16,122,80,.45)]">
                Get my cash offer <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="tel:+15036229624" size="lg" variant="outline-light">
                <Phone className="h-4 w-4" /> (503) 622-9624
              </ButtonLink>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-slate-300/80">
              {["Sold as-is", "$0 in fees", "Close in 7 days", "Any condition"].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" /> {t}</span>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ESTIMATOR */}
      <Section id="estimate" className="relative">
        <Container>
          <SectionHeading
            eyebrow="Instant estimate"
            title="See your cash number now"
            intro="A no-obligation range in seconds — then we firm it up with real comps within 24 hours."
            align="center"
            light
          />
          <div className="mt-10">
            <CashOfferEstimator />
          </div>
        </Container>
      </Section>

      {/* PERKS */}
      <Section className="bg-ink-900/60">
        <Container>
          <SectionHeading eyebrow="Why Cash Is King" title="The easiest way to sell — full stop" align="center" light />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {perks.map((p, i) => (
              <Reveal key={p.title} delay={(i % 3) * 0.07}>
                <div className="h-full rounded-2xl border border-white/10 bg-ink-800/50 p-6 transition-colors hover:border-emerald-400/30">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                    <p.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 font-display text-xl text-white">{p.title}</h3>
                  <p className="mt-1.5 text-[0.92rem] leading-relaxed text-slate-300">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* PROOF — real cash band */}
      <section className="relative overflow-hidden py-28">
        <Image src="/matin/cash/cash-09.jpg" alt="Stacks of cash" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-ink/82" />
        <Container className="relative text-center">
          <p className="display-2 font-display text-white text-balance">Real cash. No banks. Your timeline.</p>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
            Every Cash Is King purchase is funded cash — no buyer financing to fall through, no appraisal gaps, no
            30-day waits. Pick the closing date that fits your life and we&apos;ll be there with the check.
          </p>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <Section>
        <Container>
          <SectionHeading eyebrow="How it works" title="Three steps to sold" align="center" light />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div className="relative rounded-2xl border border-white/10 bg-ink-900/60 p-7">
                  <span className="font-display text-5xl text-emerald-400/30">{s.n}</span>
                  <h3 className="mt-3 font-display text-xl text-white">{s.title}</h3>
                  <p className="mt-1.5 text-[0.92rem] leading-relaxed text-slate-300">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* COMPARISON */}
      <Section className="bg-ink-900/60">
        <Container>
          <SectionHeading eyebrow="The difference" title="Cash Is King vs. the traditional sale" align="center" light />
          <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-ink-800/70 text-[0.8rem] font-semibold uppercase tracking-wider text-slate-300">
              <div className="px-5 py-3.5" />
              <div className="px-5 py-3.5 text-emerald-300">Cash Is King</div>
              <div className="px-5 py-3.5 text-slate-300/70">Traditional sale</div>
            </div>
            {compare.map(([label, a, b], i) => (
              <div key={label} className={`grid grid-cols-[1.4fr_1fr_1fr] items-center text-[0.9rem] ${i % 2 ? "bg-ink-900/40" : "bg-ink-900/70"}`}>
                <div className="px-5 py-3.5 font-medium text-white">{label}</div>
                <div className="flex items-center gap-2 px-5 py-3.5 text-emerald-300">
                  <Check className="h-4 w-4 shrink-0" /> {a}
                </div>
                <div className="flex items-center gap-2 px-5 py-3.5 text-slate-300/70">
                  <X className="h-4 w-4 shrink-0 text-slate-300/40" /> {b}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section>
        <Container>
          <SectionHeading eyebrow="Good to know" title="Cash offer questions, answered" align="center" light />
          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-white/10 bg-ink-900/60 p-5 transition-colors hover:border-emerald-400/30">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-white">
                  {f.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-emerald-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-[0.92rem] leading-relaxed text-slate-300">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="pb-28">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-900/50 to-ink-900 px-8 py-16 text-center md:px-16">
            <CashRain />
            <div className="pointer-events-none absolute inset-0 bg-ink/40" />
            <div className="relative">
              <Clock className="mx-auto h-8 w-8 text-emerald-400" />
              <h2 className="display-2 mt-4 font-display text-white text-balance">Ready for a real cash offer?</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                Get your no-obligation number today. If it&apos;s a fit, you could be closed and paid next week.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href="#estimate" size="lg" className="bg-emerald-600 text-white hover:bg-emerald-500">
                  Get my cash offer <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="/contact" size="lg" variant="outline-light">Talk to our team</ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
