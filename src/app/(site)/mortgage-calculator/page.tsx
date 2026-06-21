import type { Metadata } from "next";
import { ArrowRight, Calculator, TrendingDown, DollarSign, Percent } from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { MortgageCalculator } from "./MortgageCalculator";

export const metadata: Metadata = {
  title: "Mortgage Calculator | Matin Real Estate",
  description:
    "Estimate your monthly mortgage payment — principal, interest, property tax, and insurance — in seconds. Free tool from Matin Real Estate, Portland's most trusted broker team.",
};

const tips = [
  {
    icon: TrendingDown,
    title: "A larger down payment lowers your rate",
    body: "Putting 20% down eliminates PMI and often earns a better rate. Even an extra 5% can meaningfully cut your monthly payment and total interest.",
  },
  {
    icon: DollarSign,
    title: "Your rate depends on your credit score",
    body: "Lenders reserve the best rates for scores above 740. Even a 20-point improvement can save thousands over the life of a 30-year loan.",
  },
  {
    icon: Percent,
    title: "Shorter terms save dramatically on interest",
    body: "A 15-year loan carries a lower rate and cuts total interest nearly in half — though monthly payments are higher. Run both scenarios before deciding.",
  },
];

export default function MortgageCalculatorPage() {
  return (
    <>
      {/* ---- PAGE HEADER ---- */}
      <section className="bg-paper-200/60 pb-14 pt-28 md:pb-16 md:pt-36">
        <Container>
          <span className="eyebrow">Buyer tools</span>
          <h1 className="display-1 mt-4 max-w-2xl font-display text-ink text-balance">
            Mortgage Calculator
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate text-pretty sm:text-lg">
            Enter your home price, down payment, interest rate, and loan term to instantly
            estimate your monthly payment — including principal, interest, property tax, and
            insurance.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.88rem] text-slate/70">
            <span className="flex items-center gap-1.5">
              <Calculator className="h-4 w-4" /> Free · no sign-up required
            </span>
            <span className="flex items-center gap-1.5">
              <ArrowRight className="h-4 w-4" />
              <a href="/contact" className="underline underline-offset-2 hover:text-ink transition-colors">
                Talk to a broker to get pre-approved
              </a>
            </span>
          </div>
        </Container>
      </section>

      {/* ---- CALCULATOR ---- */}
      <Section>
        <Container>
          <MortgageCalculator />
        </Container>
      </Section>

      {/* ---- TIPS ---- */}
      <Section className="bg-paper-200/60">
        <Container>
          <SectionHeading
            eyebrow="What affects your payment"
            title="Know before you offer"
            intro="Three factors buyers often overlook when budgeting for a home purchase."
            align="center"
          />
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {tips.map((t, i) => (
              <Reveal key={t.title} delay={i * 0.08}>
                <div className="group flex h-full flex-col rounded-2xl bg-cloud p-7 shadow-soft ring-1 ring-ink/[0.06] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink/[0.07] text-ink transition-colors duration-500 group-hover:bg-ink group-hover:text-white">
                    <t.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-xl text-ink">{t.title}</h3>
                  <p className="mt-2 flex-1 text-[0.93rem] leading-relaxed text-slate">{t.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---- BOTTOM CTA ---- */}
      <Section className="pb-28">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-center text-white shadow-glow sm:px-8 sm:py-16 md:px-16">
            <div className="absolute inset-0 grid-tech opacity-20" />
            <div className="relative">
              <span className="eyebrow eyebrow-light">Ready to move?</span>
              <h2 className="display-2 mt-4 font-display text-white text-balance">
                Numbers look good? Let&apos;s get you pre-approved.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/90 text-pretty sm:text-lg">
                Our brokers connect buyers with trusted local lenders daily — pre-approval letters
                often arrive within 24 hours so you can make offers with confidence.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="/contact"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[0.9rem] font-semibold text-ink shadow-[0_8px_24px_rgba(6,6,6,.25)] transition hover:bg-paper active:scale-[0.98]"
                >
                  Connect with a broker <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/buy"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/30 px-7 text-[0.9rem] font-medium text-white/90 transition hover:border-white/60 hover:text-white"
                >
                  Learn about buying with Matin
                </a>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
