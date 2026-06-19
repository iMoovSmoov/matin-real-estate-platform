import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight, Phone, Wrench, Eye, Percent, CalendarCheck, ShieldCheck, Home,
  Check, X, Banknote, Clock,
} from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { CashRain } from "@/components/site/cash/CashRain";
import { CashOfferEstimator } from "@/components/site/cash/CashOfferEstimator";
import { CashFaqAccordion } from "@/components/site/cash/CashFaqAccordion";

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
  { n: "01", title: "Tell us about your home", body: "Share your address and basic details — takes two minutes online or one quick call." },
  { n: "02", title: "Get your offer", body: "We review real local comps and present a fair cash price within 24 hours. No obligation." },
  { n: "03", title: "Choose your closing date", body: "Pick any date in the next 7–60 days. Sign, collect your cash. Done." },
];

const testimonials = [
  {
    name: "Sandra M.",
    city: "Portland, OR",
    quote: "I thought selling would take months. Cash Is King had an offer in my inbox the next morning and we closed in nine days. Absolutely painless.",
  },
  {
    name: "Robert & Diane T.",
    city: "Beaverton, OR",
    quote: "We inherited a property that needed serious work. Matin bought it as-is — no repairs, no staging, no drama. The whole thing felt almost too easy.",
  },
  {
    name: "Kevin L.",
    city: "Gresham, OR",
    quote: "The offer was fair and they were completely transparent about how they got there. No pressure, no games. I'd do it again without hesitation.",
  },
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
  { q: "How is the offer calculated?", a: "We run real, current comparable sales in your neighborhood and factor in condition and any needed work — then make a fair cash offer, usually 90–95% of market value with zero fees taken out." },
  { q: "Do I need to make repairs?", a: "None at all. We buy in any condition — outdated kitchens, damaged roofs, inherited clutter, tenant-occupied. Leave what you don't want; take what you do." },
  { q: "How fast can you close?", a: "As little as 7 days, or on whatever date works for you. No bank underwriting means no waiting and no deals falling through at the last minute." },
  { q: "Are there fees or commissions?", a: "None. No 6% listing commission, no closing-cost surprises, no repair credits. The number we agree on is what you walk away with." },
  { q: "What if I have a mortgage?", a: "No problem. We handle payoff coordination with your lender at closing — it's completely standard and won't slow anything down." },
];

export default function CashOfferPage() {
  return (
    <div className="bg-ink text-white">
      {/* HERO — above the fold landing treatment */}
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

          {/* Primary headline */}
          <Reveal delay={0.08}>
            <h1 className="display-1 mx-auto mt-6 max-w-4xl font-display text-white text-balance">
              Get a cash offer in 24 hours —{" "}
              <span className="italic text-emerald-400">no repairs, no showings, no stress.</span>
            </h1>
          </Reveal>

          {/* 3 trust signals inline */}
          <Reveal delay={0.16}>
            <div className="mx-auto mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm font-medium text-white/90">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Close in as little as 7 days</span>
              <span className="hidden sm:block text-white/20">·</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> As-is condition</span>
              <span className="hidden sm:block text-white/20">·</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> No agent commissions</span>
            </div>
          </Reveal>

          {/* Primary CTA */}
          <Reveal delay={0.22}>
            <div className="mx-auto mt-9 w-full max-w-xs sm:max-w-none sm:w-auto">
              <ButtonLink
                href="#estimate"
                size="lg"
                className="w-full sm:w-auto bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_12px_36px_rgba(16,122,80,.45)]"
              >
                Get my offer <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
            <p className="mt-3 text-[0.8rem] text-slate-300/70">No obligation. Free estimate.</p>
          </Reveal>

          {/* Secondary phone link */}
          <Reveal delay={0.3}>
            <div className="mt-6">
              <ButtonLink href="tel:+15036229624" size="lg" variant="outline-light">
                <Phone className="h-4 w-4" /> (503) 622-9624
              </ButtonLink>
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

      {/* HOW IT WORKS — numbered steps with connecting line */}
      <Section className="bg-paper-200/[0.04]">
        <Container>
          <SectionHeading eyebrow="How it works" title="Three steps to sold" align="center" light />
          <div className="relative mt-14">
            {/* connecting line — desktop only */}
            <div
              aria-hidden="true"
              className="absolute left-1/6 right-1/6 top-[2.75rem] hidden h-px bg-emerald-400/20 md:block"
            />
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <Reveal key={s.n} delay={i * 0.1}>
                  <div className="relative flex flex-col items-center text-center px-4">
                    {/* large serif number */}
                    <div className="relative z-10 flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full border border-emerald-400/20 bg-ink">
                      <span className="font-display text-4xl font-light text-emerald-400">{s.n}</span>
                    </div>
                    <h3 className="mt-5 font-display text-xl text-white">{s.title}</h3>
                    <p className="mt-2 max-w-xs text-[0.92rem] leading-relaxed text-slate-300">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* SOCIAL PROOF — testimonial band */}
      <Section className="bg-ink-900/60">
        <Container>
          <SectionHeading eyebrow="Seller stories" title="Real people, real results" align="center" light />
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.08}>
                <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-ink-800/50 p-6">
                  <blockquote className="flex-1">
                    <p className="text-[0.93rem] leading-relaxed text-slate-300 italic">&ldquo;{t.quote}&rdquo;</p>
                  </blockquote>
                  <figcaption className="mt-5 border-t border-white/10 pt-4">
                    <p className="font-semibold text-white text-sm">{t.name}</p>
                    <p className="text-[0.8rem] text-slate-300/70">{t.city}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* PROOF — real cash band */}
      <section className="relative overflow-hidden py-28">
        <Image src="/matin/cash/cash-09.jpg" alt="Stacks of cash" fill sizes="100vw" className="object-cover object-center" placeholder="blur" blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=" />
        <div className="absolute inset-0 bg-ink/82" />
        <Container className="relative text-center">
          <p className="display-2 font-display text-white text-balance">Real cash. No banks. Your timeline.</p>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
            Every Cash Is King purchase is funded cash — no buyer financing to fall through, no appraisal gaps, no
            30-day waits. Pick the closing date that fits your life and we&apos;ll be there with the check.
          </p>
        </Container>
      </section>

      {/* COMPARISON */}
      <Section className="bg-ink-900/60">
        <Container>
          <SectionHeading eyebrow="The difference" title="Cash Is King vs. the traditional sale" align="center" light />
          <div className="mx-auto mt-12 max-w-3xl overflow-x-auto rounded-2xl border border-white/10">
            <div className="min-w-[520px]">
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
          </div>
        </Container>
      </Section>

      {/* FAQ — client accordion */}
      <Section>
        <Container>
          <SectionHeading eyebrow="Good to know" title="Cash offer questions, answered" align="center" light />
          <CashFaqAccordion faqs={faqs} />
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
                  Get my offer <ArrowRight className="h-4 w-4" />
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
