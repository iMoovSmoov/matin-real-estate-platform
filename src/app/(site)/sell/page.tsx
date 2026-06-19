import type { Metadata } from "next";
import Image from "next/image";
import {
  Camera, Globe2, LineChart, Megaphone, Users2, Quote, Star,
  DollarSign, CalendarCheck, Hammer, ShieldCheck, ClipboardCheck, Handshake, TrendingUp,
} from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { ProcessSteps } from "@/components/site/marketing/ProcessSteps";
import { InstantValue } from "@/components/site/marketing/InstantValue";
import { company } from "@/lib/data";

export const metadata: Metadata = {
  title: "Sell Your Home | Matin Real Estate",
  description:
    "Sell faster and net more with Matin Real Estate — 18 active listings, 40+ brokers, $130M volume. Pro photography, the largest local website, sharp pricing. Or get a guaranteed cash offer.",
};

const advantages = [
  { icon: Camera, title: "Cinematic pro media", body: "Magazine-grade photography, drone, and video on every listing. Buyers shop with their eyes — your home leads with its best face forward." },
  { icon: Globe2, title: "The largest local audience", body: "Your home headlines the largest locally owned real-estate website in the Portland area, plus syndication to every major portal." },
  { icon: LineChart, title: "Pricing that wins", body: "Live comps and AI-assisted analysis set a number that invites offers in the first 10 days instead of chasing the market down." },
  { icon: Megaphone, title: "A $2.4M marketing engine", body: "We reinvest $2.4M a year into reaching buyers — paid, social, email, and a 40-broker referral network working for you." },
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
  { name: "R. Delgado", area: "Vancouver, WA", quote: "We needed to sell fast and as-is. Cash Is King made a guaranteed offer and we picked our own close date. Effortless." },
];

const cashFeatures = [
  { icon: DollarSign, title: "A guaranteed cash offer", body: "A real, written offer on your home — no financing contingencies, no fall-through risk, no waiting on a buyer's loan." },
  { icon: Hammer, title: "Sell completely as-is", body: "Skip repairs, staging, and showings. We buy in any condition — you don't lift a hammer or a paintbrush." },
  { icon: CalendarCheck, title: "Pick your own close date", body: "Need to move in 10 days or 60? Close on the timeline that fits your life, not the market's." },
];

export default function SellPage() {
  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="relative flex min-h-[78vh] items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/matin/interiors/interiors-04.jpg"
            alt="Beautifully staged living space ready for market"
            fill
            priority
            sizes="100vw"
            className="ken-burns object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/55 to-ink/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/80 to-transparent" />
        </div>
        <Container className="relative z-10 pt-20 sm:pt-28">
          <div className="max-w-3xl">
            <Reveal>
              <span className="eyebrow-light">Sell with Matin</span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="display-1 mt-5 font-display text-white text-balance">
                Sell faster. Net more.{" "}
                <span className="italic text-azure-bright">Matin delivers both.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 hidden max-w-xl text-base leading-relaxed text-white/85 text-pretty sm:block sm:text-lg">
                Cinematic marketing, the largest local audience, and sharp pricing — backed by a $2.4M
                marketing engine and 40+ full-time brokers. Start with your home&apos;s value, free and
                instant.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <ButtonLink href="#instant-value" variant="primary" size="lg">
                  <TrendingUp className="h-4 w-4" /> Get my home value
                </ButtonLink>
                <ButtonLink href="#cash-offer" variant="outline-light" size="lg">
                  Need a cash offer?
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ---------- INSTANT VALUE (LIVE AI) ---------- */}
      <Section id="instant-value">
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
      <Section className="bg-paper-200/60">
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
                <div className="group flex h-full flex-col rounded-2xl bg-cloud p-7 shadow-soft ring-1 ring-ink/[0.06] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-azure/10 text-azure transition-colors duration-500 group-hover:bg-azure group-hover:text-white">
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

      {/* ---------- CASH IS KING ---------- */}
      <section id="cash-offer" className="relative overflow-hidden bg-ink py-24 text-white md:py-28">
        <div className="absolute inset-0 grid-tech opacity-50" />
        <div className="absolute -right-40 top-10 h-96 w-96 rounded-full bg-azure/20 blur-3xl" />
        <Container className="relative">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-3">
                <Badge tone="azure">Sister company</Badge>
                <span className="eyebrow-light">Cash Is King Home Buyers</span>
              </div>
              <h2 className="display-2 mt-4 font-display text-white text-balance">
                Need to sell fast? Get a guaranteed cash offer.
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-300">
                Not every move fits the open market. Through our sister company,{" "}
                <strong className="text-white">Cash Is King Home Buyers</strong>, you can take a guaranteed
                cash offer, sell completely as-is, and pick the closing date that works for you — with the
                same team you already trust.
              </p>
              <div className="mt-8 space-y-5">
                {cashFeatures.map((f) => (
                  <Reveal key={f.title} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-azure/15 text-azure-bright">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-white">{f.title}</h3>
                      <p className="mt-1 text-[0.93rem] leading-relaxed text-slate-300">{f.body}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <ButtonLink href="/contact" variant="primary" size="lg">
                  <DollarSign className="h-4 w-4" /> Get my cash offer
                </ButtonLink>
                <ButtonLink href="#instant-value" variant="outline-light" size="lg">
                  Compare to a market sale
                </ButtonLink>
              </div>
            </div>

            <Reveal delay={0.1}>
              <div className="relative">
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-lift">
                  <Image
                    src="/matin/brand/guaranteed-cash-offer-today.jpg"
                    alt="Cash Is King Home Buyers — guaranteed cash offer"
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 rounded-2xl bg-cloud px-5 py-4 text-ink shadow-lift sm:-bottom-5 sm:-left-5 sm:px-6 sm:py-5">
                  <div className="flex items-center gap-2 text-azure">
                    <ClipboardCheck className="h-5 w-5" />
                    <span className="text-[0.78rem] font-semibold uppercase tracking-wide">No obligation</span>
                  </div>
                  <div className="mt-1.5 font-display text-2xl">Offer in 24–48 hrs</div>
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
                <figure className="flex h-full flex-col rounded-2xl bg-cloud p-7 shadow-soft ring-1 ring-ink/[0.06]">
                  <Quote className="h-8 w-8 text-azure/30" />
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

      {/* ---------- CTA ---------- */}
      <Section className="pb-28">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-azure-deep via-azure to-azure-bright px-6 py-14 text-center text-white shadow-glow sm:px-8 sm:py-16 md:px-16">
            <div className="absolute inset-0 grid-tech opacity-20" />
            <div className="relative">
              <span className="eyebrow-light">Two ways to sell, one trusted team</span>
              <h2 className="display-2 mt-4 font-display text-white text-balance">
                Ready to see what your home is worth?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
                List it on the open market for top dollar, or take a guaranteed cash offer and close on your
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
              <p className="mt-6 text-[0.85rem] text-white/80">
                {company.hours} · {company.phone}
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
