import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight, Phone, Wrench, Eye, Percent, CalendarCheck, ShieldCheck, Home,
  Check, X, Clock, Star, MapPin, BadgeCheck,
} from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { CashOfferEstimator } from "@/components/site/cash/CashOfferEstimator";
import { CashFaqAccordion } from "@/components/site/cash/CashFaqAccordion";

export const metadata: Metadata = {
  title: "Matin Cash Offer — Sell your home for cash, as-is",
  description:
    "The Matin Real Estate cash-offer program. Get a no-obligation cash offer backed by a $130M+ Portland brokerage — skip repairs, showings, and fees, and close in as little as 7 days.",
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
  { n: "01", title: "Tell us about your home", body: "Share your address and basic details — takes two minutes online or one quick call with a licensed Matin broker." },
  { n: "02", title: "Get your offer", body: "We review real local comps from our $130M+ in annual sales and present a fair cash price within 24 hours. No obligation." },
  { n: "03", title: "Choose your closing date", body: "Pick any date in the next 7–60 days. Sign, collect your cash. Done." },
];

const testimonials = [
  {
    name: "Sandra M.",
    city: "Lake Oswego, OR",
    quote: "I thought selling would take months. Matin had a cash offer in my inbox the next morning and we closed in nine days. Absolutely painless.",
  },
  {
    name: "Robert & Diane T.",
    city: "Beaverton, OR",
    quote: "We inherited a property that needed serious work. Matin bought it as-is — no repairs, no staging, no drama. The whole thing felt almost too easy.",
  },
  {
    name: "Kevin L.",
    city: "West Linn, OR",
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
  { q: "How is the offer calculated?", a: "We run real, current comparable sales in your neighborhood — drawn from Matin's $130M+ in annual local sales — and factor in condition and any needed work, then make a fair cash offer with zero fees taken out." },
  { q: "Do I need to make repairs?", a: "None at all. We buy in any condition — outdated kitchens, damaged roofs, inherited clutter, tenant-occupied. Leave what you don't want; take what you do." },
  { q: "How fast can you close?", a: "As little as 7 days, or on whatever date works for you. No bank underwriting means no waiting and no deals falling through at the last minute." },
  { q: "Are there fees or commissions?", a: "None. No 6% listing commission, no closing-cost surprises, no repair credits. The number we agree on is what you walk away with." },
  { q: "What if I have a mortgage?", a: "No problem. We handle payoff coordination with your lender at closing — it's completely standard and won't slow anything down." },
];

/* Credibility — the real brokerage behind the offer (what makes it real, not an iBuyer). */
const credibility = [
  { stat: "$130M+", label: "In annual local sales" },
  { stat: "305+", label: "Homes sold" },
  { stat: "OR & WA", label: "Licensed brokerage" },
  { stat: "4.9★", label: "From 700+ reviews" },
];

export default function CashOfferPage() {
  return (
    <div className="bg-ink text-white">
      {/* HERO — real home photography, refined gold accents, no gimmicks */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden">
        <Image
          src="/matin/exteriors/exteriors-05.jpg"
          alt="A Portland-area home"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Cinematic dark wash for legibility + premium depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/50" />

        <Container className="relative z-10 pt-28 pb-16">
          <div className="max-w-2xl">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/[0.08] px-4 py-1.5 text-[0.78rem] font-semibold tracking-wide text-gold">
                <BadgeCheck className="h-4 w-4" /> The Matin Cash Offer Program
              </span>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="display-1 mt-6 font-display text-white text-balance">
                Sell your home for cash —{" "}
                <span className="italic text-gold">no repairs, no showings, no stress.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
                A fair, no-obligation cash offer in 24 hours — backed by Matin Real Estate, a
                licensed $130M+ Portland &amp; SW Washington brokerage. Skip the listing, keep the
                certainty.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-2 text-sm font-medium text-white/90">
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-gold" /> Close in as little as 7 days</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-gold" /> As-is condition</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-gold" /> No agent commissions</span>
              </div>
            </Reveal>

            <Reveal delay={0.26}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <ButtonLink
                  href="#estimate"
                  size="lg"
                  className="bg-gold text-ink hover:bg-gold-bright shadow-[0_12px_36px_rgba(202,166,78,.35)]"
                >
                  Get my cash offer <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="tel:+15036229624" size="lg" variant="outline-light">
                  <Phone className="h-4 w-4" /> (503) 622-9624
                </ButtonLink>
              </div>
              <p className="mt-3 text-[0.8rem] text-slate-300/70">No obligation · free estimate · talk to a real licensed broker.</p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* CREDIBILITY STRIP — the real brokerage behind the offer */}
      <section className="border-y border-white/10 bg-ink-900">
        <Container>
          <div className="grid grid-cols-2 divide-x divide-white/10 md:grid-cols-4">
            {credibility.map((c) => (
              <div key={c.label} className="px-4 py-7 text-center">
                <p className="font-display text-3xl text-white tabular-nums">{c.stat}</p>
                <p className="mt-1 text-[0.8rem] text-slate-300/80">{c.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ESTIMATOR */}
      <Section id="estimate" className="relative scroll-mt-20">
        <Container>
          <SectionHeading
            eyebrow="Instant estimate"
            title="See your cash number now"
            intro="A no-obligation range in seconds — then a licensed Matin broker firms it up with real comps within 24 hours."
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
          <SectionHeading eyebrow="Why sell to Matin" title="The easiest way to sell — full stop" align="center" light />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {perks.map((p, i) => (
              <Reveal key={p.title} delay={(i % 3) * 0.07}>
                <div className="h-full rounded-2xl border border-white/10 bg-ink-800/50 p-6 transition-colors hover:border-gold/35">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/12 text-gold ring-1 ring-inset ring-gold/25">
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

      {/* HOW IT WORKS */}
      <Section className="bg-paper-200/[0.04]">
        <Container>
          <SectionHeading eyebrow="How it works" title="Three steps to sold" align="center" light />
          <div className="relative mt-14">
            <div
              aria-hidden="true"
              className="absolute left-1/6 right-1/6 top-[2.75rem] hidden h-px bg-gold/20 md:block"
            />
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <Reveal key={s.n} delay={i * 0.1}>
                  <div className="relative flex flex-col items-center text-center px-4">
                    <div className="relative z-10 flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full border border-gold/25 bg-ink">
                      <span className="font-display text-4xl font-light text-gold">{s.n}</span>
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

      {/* SOCIAL PROOF */}
      <Section className="bg-ink-900/60">
        <Container>
          <SectionHeading eyebrow="Seller stories" title="Real people, real results" align="center" light />
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.08}>
                <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-ink-800/50 p-6">
                  <div className="flex gap-0.5 text-gold">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1">
                    <p className="text-[0.93rem] leading-relaxed text-slate-300 italic">&ldquo;{t.quote}&rdquo;</p>
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-[0.8rem] font-bold text-gold">
                      {t.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="flex items-center gap-1 text-[0.78rem] text-slate-300/70">
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

      {/* PROOF — real cash, grounded in real numbers */}
      <section className="relative overflow-hidden py-28">
        <Image src="/matin/cash/cash-09.jpg" alt="Cash funds ready at closing" fill sizes="100vw" className="object-cover object-center" placeholder="blur" blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=" />
        <div className="absolute inset-0 bg-ink/85" />
        <Container className="relative text-center">
          <p className="display-2 font-display text-white text-balance">Real cash. No banks. Your timeline.</p>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
            Every Matin cash purchase is funded cash — no buyer financing to fall through, no
            appraisal gaps, no 30-day waits. Pick the closing date that fits your life and we&apos;ll
            be there with the check.
          </p>
        </Container>
      </section>

      {/* COMPARISON */}
      <Section className="bg-ink-900/60">
        <Container>
          <SectionHeading eyebrow="The difference" title="The Matin cash offer vs. the traditional sale" align="center" light />

          {/* Phone (< sm): stacked comparison cards */}
          <div className="mx-auto mt-10 grid max-w-md gap-3 sm:hidden">
            {compare.map(([label, a, b]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-ink-900/70 p-4">
                <div className="text-[0.78rem] font-semibold uppercase tracking-wider text-slate-300">{label}</div>
                <div className="mt-2.5 flex items-start gap-2 text-[0.92rem] text-gold">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span><span className="text-gold/70">Matin cash offer:</span> {a}</span>
                </div>
                <div className="mt-1.5 flex items-start gap-2 text-[0.92rem] text-slate-300/70">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-300/40" />
                  <span><span className="text-slate-300/50">Traditional:</span> {b}</span>
                </div>
              </div>
            ))}
          </div>

          {/* sm+ : full comparison table */}
          <div className="mx-auto mt-12 hidden max-w-3xl overflow-hidden rounded-2xl border border-white/10 sm:block">
            <div>
              <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-ink-800/70 text-[0.8rem] font-semibold uppercase tracking-wider text-slate-300">
                <div className="px-5 py-3.5" />
                <div className="px-5 py-3.5 text-gold">Matin cash offer</div>
                <div className="px-5 py-3.5 text-slate-300/70">Traditional sale</div>
              </div>
              {compare.map(([label, a, b], i) => (
                <div key={label} className={`grid grid-cols-[1.4fr_1fr_1fr] items-center text-[0.9rem] ${i % 2 ? "bg-ink-900/40" : "bg-ink-900/70"}`}>
                  <div className="px-5 py-3.5 font-medium text-white">{label}</div>
                  <div className="flex items-center gap-2 px-5 py-3.5 text-gold">
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

      {/* FAQ */}
      <Section>
        <Container>
          <SectionHeading eyebrow="Good to know" title="Cash offer questions, answered" align="center" light />
          <CashFaqAccordion faqs={faqs} />
        </Container>
      </Section>

      {/* CTA */}
      <Section className="pb-28">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-gold/25 px-8 py-16 text-center md:px-16">
            <Image
              src="/matin/exteriors/exteriors-12.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-ink/85" />
            <div className="relative">
              <Clock className="mx-auto h-8 w-8 text-gold" />
              <h2 className="display-2 mt-4 font-display text-white text-balance">Ready for a real cash offer?</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                Get your no-obligation number today, backed by a real Portland brokerage. If it&apos;s
                a fit, you could be closed and paid next week.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href="#estimate" size="lg" className="bg-gold text-ink hover:bg-gold-bright">
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
