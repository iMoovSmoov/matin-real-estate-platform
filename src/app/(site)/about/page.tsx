import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Award, MapPin, Star, Phone, Mail, Cpu,
  TrendingUp, Building2, Trophy, Users,
} from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { company, leadership } from "@/lib/data";
import { compactUsd, num } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About Matin Real Estate | West Linn, OR",
  description:
    "Jordan Matin founded Matin Real Estate in 2014 in West Linn. 20+ years of experience, $130M annual volume, 40+ agents, and the largest locally owned Portland real estate website.",
};

const stats = [
  ["$130M+", "Annual sales volume"],
  ["305+", "Properties sold each year"],
  ["100+", "Active listings"],
  ["35%", "Business growth this year"],
  ["$2.4M", "Annual marketing budget"],
];

const milestones = [
  { year: "2014", title: "Founded in West Linn", body: "Jordan Matin opens Matin Real Estate with a simple thesis: treat a brokerage like a tech company and clients win." },
  { year: "2018", title: "Built the largest local website", body: "We grow into the largest locally owned real-estate website in the Portland area — more homes, sooner, for every client." },
  { year: "2021", title: "Recognized for growth", body: "Named to the Portland Business Journal's Fastest Growing Private Companies as the team scales past 40 brokers." },
  { year: "Today", title: "The Matin Hub era", body: "A custom platform unifies CRM, listings, transactions, marketing, and AI — so brokers spend their time on people, not paperwork." },
];

// Put the founder first.
const orderedLeadership = [...leadership].sort((a) =>
  a.slug === "jordan-matin" ? -1 : 1,
);

export default function AboutPage() {
  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="relative flex min-h-[70vh] items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={company.officeMeeting}
            alt="The Matin Real Estate team in their West Linn office"
            fill
            priority
            sizes="100vw"
            className="ken-burns object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/10 to-ink/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/40 to-transparent" />
        </div>
        <Container className="relative z-10 pb-16 pt-24 sm:pb-20 sm:pt-32">
          <div className="max-w-3xl">
            <Reveal>
              <span className="eyebrow eyebrow-light">Our story</span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="display-1 mt-5 font-display text-white text-balance">
                Portland&apos;s most{" "}
                <span className="italic text-azure-bright">data-driven</span>{" "}
                real estate team.
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 text-pretty">
                Founded in {company.founded} in West Linn by {company.founder}, Matin Real Estate operates
                the largest locally owned real estate website in the Portland area — with 40+ agents,
                $130M in annual volume, and 20+ years of local market experience.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-azure-bright" /> {company.address.city}, {company.address.state}
                </span>
                <span className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-azure-bright" /> PBJ Fastest-Growing Private Company
                </span>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ---------- STAT BAND ---------- */}
      <div className="border-y border-ink/[0.07] bg-cloud">
        <Container>
          <dl className="grid grid-cols-2 [&>*:nth-child(5)]:col-span-2 divide-y divide-ink/[0.07] py-10 md:grid-cols-5 md:[&>*:nth-child(5)]:col-span-1 md:divide-x md:divide-y-0">
            {stats.map(([n, l], i) => (
              <Reveal key={l} delay={i * 0.06} className="px-4 py-3 text-center">
                <dt className="font-display text-4xl text-ink md:text-[2.6rem]">{n}</dt>
                <dd className="mt-1 text-[0.82rem] leading-tight text-slate">{l}</dd>
              </Reveal>
            ))}
          </dl>
        </Container>
      </div>

      {/* ---------- STORY / MISSION ---------- */}
      <Section>
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <div className="relative aspect-[5/4] overflow-hidden rounded-3xl shadow-lift">
                <Image
                  src={company.officeHero}
                  alt="Inside the Matin Real Estate office"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute bottom-5 left-5 rounded-2xl bg-cloud/95 px-5 py-4 shadow-lift backdrop-blur">
                  <div className="font-display text-3xl text-ink">{company.founded}</div>
                  <div className="text-[0.8rem] text-slate">Founded in West Linn, OR</div>
                </div>
              </div>
            </Reveal>
            <div>
              <SectionHeading
                eyebrow="Our mission"
                title="Data-driven decisions. Human-led results."
              />
              <div className="mt-7 max-w-prose space-y-5 text-base leading-relaxed text-slate sm:text-[1.02rem]">
                <p>
                  When {company.founder} founded Matin Real Estate in {company.founded}, the real-estate
                  industry still ran on spreadsheets, fax machines, and gut feel. He saw a better way: build
                  a brokerage with the discipline, data, and tooling of a modern tech company — and put all
                  of it to work for the client.
                </p>
                <p>
                  A decade later, that thesis has compounded. We operate the largest locally owned
                  real-estate website in the Portland area, employ 40+ full-time brokers across Oregon and
                  Washington, and close <strong className="text-ink">{company.stats.annualVolume}</strong> in
                  volume every year — all while reinvesting{" "}
                  <strong className="text-ink">{company.stats.marketing}</strong> into reaching the right
                  buyers for our sellers.
                </p>
                <p>
                  The mission hasn&apos;t changed: use better systems so our people can do what software
                  can&apos;t — guide, negotiate, and care.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/contact" variant="ink">
                  Work with us <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="/agents" variant="outline">
                  Meet the team
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------- TIMELINE ---------- */}
      <Section className="bg-paper-200/60">
        <Container>
          <SectionHeading
            eyebrow="The journey"
            title="A decade of building differently"
            align="center"
          />
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {milestones.map((m, i) => (
              <Reveal key={m.year} delay={(i % 4) * 0.08}>
                <div className="flex h-full flex-col rounded-2xl bg-cloud p-7 shadow-soft ring-1 ring-ink/[0.06]">
                  <div className="font-display text-3xl text-azure-deep">{m.year}</div>
                  <div className="mt-3 h-px w-10 rounded bg-azure/40" />
                  <h3 className="mt-4 font-display text-lg text-ink">{m.title}</h3>
                  <p className="mt-2 flex-1 text-[0.9rem] leading-relaxed text-slate">{m.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---------- LEADERSHIP ---------- */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Leadership"
            title="The people steering the ship"
            intro="Two principal brokers, four decades of combined experience, and a relentless standard for how clients are cared for."
            align="center"
          />
          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            {orderedLeadership.map((person, i) => (
              <Reveal key={person.slug} delay={i * 0.1}>
                <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-cloud shadow-soft ring-1 ring-ink/[0.06] transition-shadow duration-300 hover:shadow-lift sm:flex-row">
                  <div className="relative aspect-[3/2] w-full shrink-0 bg-paper-200 sm:aspect-auto sm:w-56">
                    <Image
                      src={person.photo}
                      alt={person.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 14rem"
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl text-ink sm:text-2xl">{person.name}</h3>
                        <div className="mt-0.5 text-[0.85rem] text-ink/60 sm:text-[0.9rem]">{person.title}</div>
                      </div>
                      <Badge tone="neutral">Leadership</Badge>
                    </div>
                    <p className="mt-4 flex-1 text-[0.9rem] leading-relaxed text-slate sm:text-[0.92rem]">{person.bio}</p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-ink/[0.07] pt-4 text-[0.8rem] text-ink/60">
                      <span className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 fill-current text-ink/70" /> {person.rating} · {person.reviews} reviews
                      </span>
                      <span>{person.yearsExperience} yrs experience</span>
                      <span>{num(person.homesSold)} homes sold</span>
                      <span>{compactUsd(person.volume)} volume</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/agents/${person.slug}`}
                        className="inline-flex items-center gap-1.5 text-[0.85rem] font-medium text-ink link-underline"
                      >
                        View profile <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <span className="text-ink/20">·</span>
                      <a href={`tel:${person.phone}`} className="inline-flex items-center gap-1.5 text-[0.8rem] text-slate hover:text-ink">
                        <Phone className="h-3.5 w-3.5" /> {person.phone}
                      </a>
                      <a href={`mailto:${person.email}`} className="inline-flex items-center gap-1.5 text-[0.8rem] text-slate hover:text-ink">
                        <Mail className="h-3.5 w-3.5" /> Email
                      </a>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-[0.9rem] text-slate">
            Day-to-day operations are led by <strong className="text-ink">Alicia Kelly-Smith</strong>, who keeps
            our 40-broker team — and every transaction — running on time.
          </p>

          {/* Join our team CTA */}
          <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-ink/[0.08] bg-cloud px-6 py-10 text-center shadow-soft sm:flex-row sm:text-left">
            <div className="flex-1">
              <h3 className="font-display text-xl text-ink">Want to join the Matin team?</h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-slate">
                We&apos;re always looking for driven, full-time brokers who share our standard for
                client service and data-driven practice. Let&apos;s talk.
              </p>
            </div>
            <ButtonLink href="/contact" variant="ink" className="shrink-0">
              Apply now <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* ---------- AWARDS ---------- */}
      <Section className="bg-paper-200/60">
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <SectionHeading
                eyebrow="Recognition"
                title="Honored for how fast we grow — and how well we serve"
              />
              <p className="mt-6 max-w-prose text-base leading-relaxed text-slate sm:text-[1.02rem]">
                Growth is a byproduct of getting the fundamentals right: sharp pricing, relentless marketing,
                and clients who refer their friends. The recognition is nice — the repeat business is the real
                scoreboard.
              </p>
            </div>
            <ul className="space-y-4">
              {company.awards.map((award, i) => (
                <Reveal key={award} delay={i * 0.08}>
                  <li className="flex items-center gap-4 rounded-2xl bg-cloud p-5 shadow-soft ring-1 ring-ink/[0.06]">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-paper-200 text-ink">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-ink">{award}</span>
                  </li>
                </Reveal>
              ))}
              <Reveal delay={company.awards.length * 0.08}>
                <li className="flex items-center gap-4 rounded-2xl bg-cloud p-5 shadow-soft ring-1 ring-ink/[0.06]">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-paper-200 text-ink">
                    <Star className="h-6 w-6 fill-current" />
                  </div>
                  <span className="font-medium text-ink">4.9-star average across 700+ client reviews</span>
                </li>
              </Reveal>
            </ul>
          </div>
        </Container>
      </Section>

      {/* ---------- TECH-FORWARD FUTURE ---------- */}
      <section className="relative overflow-hidden bg-ink py-16 text-white sm:py-24">
        <div className="absolute inset-0 grid-tech opacity-60" />
        <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-[rgba(210,160,80,0.15)] blur-3xl" />
        <Container className="relative">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="eyebrow eyebrow-light border-l-2 border-white/40 pl-3">The platform behind the results</span>
              <h2 className="display-2 mt-4 font-display text-white text-balance">
                One system. Every deal.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
                The <strong className="text-white">Matin Hub</strong> is our proprietary platform — it
                unifies CRM, listings, transactions, and marketing into one system. It&apos;s how a
                40-broker team delivers a boutique experience at scale, without dropping a detail.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/hub" variant="primary" size="lg">
                  <Cpu className="h-4 w-4" /> Tour the Matin Hub
                </ButtonLink>
                <ButtonLink href="/contact" variant="outline-light" size="lg">
                  Talk to our team
                </ButtonLink>
              </div>
            </div>
            <Reveal delay={0.1}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  [TrendingUp, "Live market data", "Real-time comps driving every decision"],
                  [Users, "Dedicated brokers", "A named agent on every deal, start to close"],
                  [Building2, "Unified platform", "One system for listings, CRM, and transactions"],
                  [Cpu, "Matin Hub", "Custom software built for this brokerage"],
                ].map(([Icon, t, d]) => {
                  const I = Icon as React.ComponentType<{ className?: string }>;
                  return (
                    <div key={t as string} className="glass rounded-2xl p-5">
                      <I className="h-5 w-5 text-azure-bright" />
                      <div className="mt-3 font-display text-lg text-white">{t as string}</div>
                      <div className="mt-1 text-[0.84rem] text-slate-300">{d as string}</div>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
