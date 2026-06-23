import type { Metadata } from "next";
import { MapPin, Phone, ArrowRight, MessageCircle, Clock } from "lucide-react";
import { Section, Container } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { ContactForm } from "@/components/site/marketing/ContactForm";
import { AskMatinButton } from "@/components/site/AskMatinButton";
import { company, offices } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact Us | Matin Real Estate",
  description:
    "Get in touch with Matin Real Estate in West Linn, OR. Call (503) 622-9624, send a message, or ask our AI concierge anything — we reply within one business day.",
};

const { phone, phoneRaw } = company;
const hqMapSrc =
  "https://www.google.com/maps?q=18825+Willamette+Dr+West+Linn+OR&z=14&output=embed";

/** Real Google Maps directions link for an office (uses its lat/lng). */
function directionsHref(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export default function ContactPage() {
  return (
    // Solid sticky header sits in normal flow above — start content directly.
    <Section className="pt-10 pb-24 sm:pt-14 sm:pb-20">
      <Container>
        {/* ---------- Heading (design: "Get in touch" eyebrow + Fraunces H1) ---------- */}
        <div className="max-w-2xl">
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-gold">
            Get in touch
          </span>
          <h1 className="mt-4 font-display text-[clamp(2rem,4.4vw,3.2rem)] font-normal leading-[1.05] tracking-[-0.015em] text-ink text-balance">
            Let&apos;s talk about your move.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate text-pretty sm:text-[1.05rem]">
            Buying, selling, or exploring your options — tell us where you are and a Matin broker
            will reach out within one business day. Prefer to talk now? Call{" "}
            <a
              href={`tel:+1${phoneRaw}`}
              className="link-underline font-semibold tabular-nums text-gold"
            >
              {phone}
            </a>
            .
          </p>
        </div>

        {/* ---------- Form (left) + map / offices / concierge (right) ---------- */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* form column — real, validated ContactForm */}
          <div className="min-w-0">
            <ContactForm />
          </div>

          {/* info column */}
          <div className="min-w-0 space-y-5">
            {/* Real map of the West Linn HQ */}
            <Reveal>
              <div className="overflow-hidden rounded-[14px] border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,20,22,.05),0_14px_36px_rgba(20,20,22,.08)]">
                <div className="relative aspect-[16/10] w-full bg-paper-200">
                  <iframe
                    title={`Map to ${company.name} in West Linn, OR`}
                    src={hqMapSrc}
                    className="absolute inset-0 h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              </div>
            </Reveal>

            {/* Real offices (OR HQ + WA) */}
            {offices.map((o) => (
              <Reveal key={o.name}>
                <div className="rounded-[14px] border border-ink/[0.1] bg-white p-5 shadow-[0_1px_2px_rgba(20,20,22,.05)]">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h2 className="text-[0.98rem] font-semibold text-ink">{o.name}</h2>
                    {o.isHeadquarters && (
                      <span className="inline-flex items-center rounded-full border border-[#cfe3d7] bg-gold-soft px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-gold-ink">
                        Headquarters
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-start gap-2 text-[0.88rem] leading-relaxed text-slate">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <span>
                      {o.address}, {o.city}, {o.state} {o.zip}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.82rem]">
                    <a
                      href={`tel:+1${phoneRaw}`}
                      className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-gold hover:text-gold-bright"
                    >
                      <Phone className="h-3.5 w-3.5" /> {o.phone}
                    </a>
                    <span className="inline-flex items-center gap-1.5 tabular-nums text-slate">
                      <Clock className="h-3.5 w-3.5" /> {o.hours}
                    </span>
                  </div>
                  <a
                    href={directionsHref(o.lat, o.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-ink link-underline"
                  >
                    Get directions <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </Reveal>
            ))}

            {/* Ask Matin concierge — the real green→brass CTA opens the floating concierge */}
            <Reveal>
              <div className="rounded-[14px] border border-[#1d3b30] p-5 text-white shadow-[0_18px_44px_rgba(0,0,0,.4)]"
                style={{ background: "linear-gradient(165deg,#13231b,#0a1410)" }}
              >
                <div className="flex items-center gap-2 text-[#7fce9f]">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em]">
                    Need an answer right now?
                  </span>
                </div>
                <h2 className="mt-3 font-display text-xl text-white">
                  Ask Matin, our AI concierge
                </h2>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-slate-300">
                  Ask about neighborhoods, pricing, the buying or selling process, or a specific
                  listing — it answers instantly, day or night.
                </p>
                <AskMatinButton className="mt-4" />
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}
