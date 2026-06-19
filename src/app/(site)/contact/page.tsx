import type { Metadata } from "next";
import {
  MapPin, Phone, Mail, Clock, MessageCircle, ArrowRight, Building2,
} from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ContactForm } from "@/components/site/marketing/ContactForm";
import { company } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact Us | Matin Real Estate",
  description:
    "Get in touch with Matin Real Estate in West Linn, OR. Call (503) 622-9624, send a message, or ask our AI concierge anything — we reply within one business day.",
};

const { address, phone, phoneRaw, email, hours } = company;

const quickFacts = [
  {
    icon: MapPin,
    label: "Visit the office",
    value: `${address.street}, ${address.city}, ${address.state} ${address.zip}`,
    href: "https://www.google.com/maps?q=18825+Willamette+Dr+West+Linn+OR",
    cta: "Get directions",
  },
  {
    icon: Phone,
    label: "Call us",
    value: phone,
    href: `tel:+1${phoneRaw}`,
    cta: "Call now",
  },
  {
    icon: Mail,
    label: "Email us",
    value: email,
    href: `mailto:${email}`,
    cta: "Send email",
  },
  {
    icon: Clock,
    label: "Office hours",
    value: hours,
    href: null,
    cta: null,
  },
];

export default function ContactPage() {
  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-ink pb-20 pt-36 text-white md:pb-24">
        <div className="absolute inset-0 grid-tech opacity-50" />
        <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-azure/20 blur-3xl" />
        <Container className="relative">
          <div className="max-w-2xl">
            <Reveal>
              <span className="eyebrow-light">Contact us</span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="display-1 mt-5 font-display text-white text-balance">
                Let&apos;s start a{" "}
                <span className="italic text-azure-bright">conversation.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 text-sm leading-relaxed text-slate-300 text-pretty sm:text-lg">
                Buying, selling, or just exploring your options — tell us where you are and a Matin broker
                will reach out within one business day. Prefer to talk now? Call{" "}
                <a href={`tel:+1${phoneRaw}`} className="font-medium text-azure-bright link-underline">
                  {phone}
                </a>
                .
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ---------- FORM + INFO ---------- */}
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            {/* form */}
            <div>
              <SectionHeading
                eyebrow="Send a message"
                title="Tell us how we can help"
              />
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>

            {/* info column */}
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {quickFacts.map((f) => (
                  <Reveal key={f.label}>
                    <div className="flex h-full flex-col rounded-2xl bg-cloud p-6 shadow-soft ring-1 ring-ink/[0.06]">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-azure/10 text-azure">
                        <f.icon className="h-5 w-5" />
                      </div>
                      <div className="mt-4 text-[0.78rem] font-semibold uppercase tracking-wide text-slate">
                        {f.label}
                      </div>
                      <div className="mt-1 flex-1 text-[0.95rem] leading-relaxed text-ink">{f.value}</div>
                      {f.href && f.cta && (
                        <a
                          href={f.href}
                          target={f.href.startsWith("http") ? "_blank" : undefined}
                          rel={f.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="mt-3 inline-flex items-center gap-1.5 text-[0.85rem] font-medium text-azure-deep link-underline"
                        >
                          {f.cta} <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Ask Matin note */}
              <Reveal>
                <div className="relative overflow-hidden rounded-2xl bg-ink p-7 text-white shadow-lift">
                  <div className="absolute inset-0 grid-tech opacity-40" />
                  <div className="relative">
                    <div className="flex items-center gap-2 text-azure-bright">
                      <MessageCircle className="h-5 w-5" />
                      <span className="eyebrow-light">Need an answer right now?</span>
                    </div>
                    <h3 className="mt-3 font-display text-xl text-white">Ask Matin, our AI concierge</h3>
                    <p className="mt-2 text-[0.92rem] leading-relaxed text-slate-300">
                      Tap the chat bubble in the corner anytime. Ask about neighborhoods, pricing, the buying
                      or selling process, or a specific listing — it answers instantly, day or night.
                    </p>
                    <div className="mt-5 flex items-center gap-2 text-[0.85rem] text-azure-bright">
                      <MessageCircle className="h-4 w-4" />
                      Look for the chat bubble, bottom-right
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------- MAP ---------- */}
      <Section className="bg-paper-200/60 pt-0 pb-24 sm:pb-16">
        <Container>
          <SectionHeading
            eyebrow="Find us"
            title="Right on Willamette Drive in West Linn"
            intro="Stop by the office for a coffee and a conversation — no appointment necessary during business hours."
          />
          <Reveal>
            <div className="mt-10 overflow-hidden rounded-3xl shadow-lift ring-1 ring-ink/[0.06]">
              <div className="relative aspect-[16/9] w-full bg-paper-200 md:aspect-[21/9]">
                <iframe
                  title={`Map to ${company.name} in West Linn, OR`}
                  src="https://www.google.com/maps?q=18825+Willamette+Dr+West+Linn+OR&output=embed"
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <div className="flex flex-col gap-4 bg-cloud p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-azure/10 text-azure">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-ink">{company.name}</div>
                    <div className="text-[0.88rem] text-slate">
                      {address.street}, {address.city}, {address.state} {address.zip}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <ButtonLink
                    href="https://www.google.com/maps?q=18825+Willamette+Dr+West+Linn+OR"
                    variant="ink"
                  >
                    <MapPin className="h-4 w-4" /> Get directions
                  </ButtonLink>
                  <ButtonLink href={`tel:+1${phoneRaw}`} variant="outline">
                    <Phone className="h-4 w-4" /> {phone}
                  </ButtonLink>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
