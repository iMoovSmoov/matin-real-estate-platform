import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Star, Phone, Mail, MapPin, Award, Globe, TrendingUp, Home, BadgeCheck, ChevronRight,
} from "lucide-react";
import { Container, Section } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ListingCard } from "@/components/site/ListingCard";
import { InquiryForm } from "@/components/site/property/InquiryForm";
import { agents, getAgent, getCommunity, listingsByAgent } from "@/lib/data";
import { usd, num } from "@/lib/utils";

export function generateStaticParams() {
  return agents.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) return { title: "Broker not found — Matin Real Estate" };
  return {
    title: `${agent.name} — ${agent.title} | Matin Real Estate`,
    description: agent.bio,
  };
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) notFound();

  const myListings = listingsByAgent(agent.slug).filter((l) => l.status !== "Sold");
  const servedCommunities = agent.communities
    .map((s) => getCommunity(s))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const stats: { icon: typeof Home; value: string; label: string }[] = [
    { icon: Home, value: num(agent.homesSold), label: "Homes sold" },
    { icon: TrendingUp, value: usd(agent.volume), label: "Sales volume" },
    { icon: Award, value: `${agent.yearsExperience} yrs`, label: "Experience" },
    { icon: BadgeCheck, value: `${agent.activeListings}`, label: "Active listings" },
  ];

  return (
    <>
      {/* ---------- BREADCRUMB ---------- */}
      <div className="border-b border-ink/[0.06] bg-paper pt-24 pb-4">
        <Container>
          <nav className="flex flex-wrap items-center gap-1.5 text-[0.82rem] text-slate">
            <Link href="/agents" className="hover:text-ink">Our brokers</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink/80">{agent.name}</span>
          </nav>
        </Container>
      </div>

      <Section className="pt-10 md:pt-12">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
            {/* ===== MAIN ===== */}
            <div>
              <div className="flex flex-col gap-8 sm:flex-row sm:items-end">
                <div className="relative aspect-[4/5] w-full max-w-[280px] shrink-0 overflow-hidden rounded-2xl shadow-lift ring-1 ring-ink/[0.06]">
                  <Image
                    src={agent.photo}
                    alt={agent.name}
                    fill
                    priority
                    sizes="280px"
                    className="object-cover object-top"
                  />
                </div>
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {agent.leadership && <Badge tone="azure">Leadership</Badge>}
                    {agent.support && <Badge tone="neutral">Support team</Badge>}
                    {agent.licenses.map((lic) => (
                      <Badge key={lic} tone="ink">{lic} licensed</Badge>
                    ))}
                  </div>
                  <h1 className="display-3 mt-4 font-display text-ink">{agent.name}</h1>
                  <p className="mt-1.5 text-lg text-slate">{agent.title}</p>
                  <p className="mt-1 text-[0.92rem] text-slate">{agent.role}</p>

                  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.92rem]">
                    <span className="flex items-center gap-1.5 font-medium text-ink">
                      <Star className="h-4 w-4 fill-azure text-azure" /> {agent.rating}
                      <span className="font-normal text-slate">({num(agent.reviews)} reviews)</span>
                    </span>
                    <a href={`tel:${agent.phone}`} className="flex items-center gap-1.5 text-ink/85 hover:text-azure">
                      <Phone className="h-4 w-4 text-azure" /> {agent.phone}
                    </a>
                    <a href={`mailto:${agent.email}`} className="flex items-center gap-1.5 break-all text-ink/85 hover:text-azure">
                      <Mail className="h-4 w-4 text-azure" /> {agent.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-ink/[0.06] ring-1 ring-ink/[0.06] sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="bg-cloud p-5">
                    <dt className="flex items-center gap-2 text-[0.74rem] uppercase tracking-wide text-slate">
                      <s.icon className="h-4 w-4 text-azure" /> {s.label}
                    </dt>
                    <dd className="mt-2 font-display text-2xl text-ink">{s.value}</dd>
                  </div>
                ))}
              </dl>

              {/* Bio */}
              <div className="mt-12">
                <h2 className="font-display text-2xl text-ink">About {agent.firstName}</h2>
                <p className="mt-5 text-[1.02rem] leading-relaxed text-ink/85 text-pretty">{agent.bio}</p>
              </div>

              {/* Specialties + languages */}
              <div className="mt-10 grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-slate">Specialties</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {agent.specialties.map((s) => (
                      <span key={s} className="rounded-full bg-azure/10 px-3.5 py-1.5 text-[0.82rem] font-medium text-azure-deep ring-1 ring-azure/15">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-slate">Languages</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {agent.languages.map((l) => (
                      <span key={l} className="flex items-center gap-1.5 rounded-full bg-cloud px-3.5 py-1.5 text-[0.82rem] font-medium text-ink ring-1 ring-ink/[0.1]">
                        <Globe className="h-3.5 w-3.5 text-azure" /> {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Communities served */}
              {servedCommunities.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-slate">Communities served</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {servedCommunities.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/communities/${c.slug}`}
                        className="flex items-center gap-1.5 rounded-full bg-cloud px-3.5 py-1.5 text-[0.82rem] font-medium text-ink ring-1 ring-ink/[0.1] transition hover:ring-azure/40 hover:text-azure"
                      >
                        <MapPin className="h-3.5 w-3.5 text-azure" /> {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* This agent's listings */}
              <div className="mt-14">
                <h2 className="font-display text-2xl text-ink">
                  {agent.firstName}&apos;s active listings
                </h2>
                {myListings.length > 0 ? (
                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {myListings.map((l) => (
                      <ListingCard key={l.id} listing={l} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-cloud px-6 py-12 text-center shadow-soft ring-1 ring-ink/[0.06]">
                    <p className="text-[0.95rem] text-slate">
                      {agent.firstName} has no active listings right now.{" "}
                      <a href={`mailto:${agent.email}`} className="font-medium text-azure link-underline">
                        Reach out
                      </a>{" "}
                      about off-market opportunities or to list your home.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ===== CONTACT SIDEBAR ===== */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-2xl bg-cloud p-6 shadow-lift ring-1 ring-ink/[0.06]">
                <h3 className="font-display text-xl text-ink">Contact {agent.firstName}</h3>
                <p className="mt-1.5 text-[0.88rem] text-slate">
                  Buying, selling, or just exploring? Send a note and {agent.firstName} will follow up.
                </p>

                <div className="mt-5 flex flex-col gap-2.5">
                  <ButtonLink href={`tel:${agent.phone}`} variant="primary" className="w-full">
                    <Phone className="h-4 w-4" /> {agent.phone}
                  </ButtonLink>
                  <ButtonLink href={`mailto:${agent.email}`} variant="outline" className="w-full">
                    <Mail className="h-4 w-4" /> Email {agent.firstName}
                  </ButtonLink>
                </div>

                <div className="my-6 flex items-center gap-3 text-[0.72rem] uppercase tracking-wide text-slate">
                  <span className="h-px flex-1 bg-ink/10" /> or send a message <span className="h-px flex-1 bg-ink/10" />
                </div>

                <InquiryForm agentName={agent.name} />
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
