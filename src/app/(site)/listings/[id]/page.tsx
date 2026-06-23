import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  BedDouble, Bath, Maximize, Ruler, CalendarDays, Home, Landmark, Car,
  TrendingUp, Clock, Hash, Check, MapPin, Phone, Mail, ArrowRight, ChevronRight,
  Star, CalendarCheck,
} from "lucide-react";
import { Container, Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { AskMatinButton } from "@/components/site/AskMatinButton";
import { ListingCard } from "@/components/site/ListingCard";
import { Gallery } from "@/components/site/property/Gallery";
import { getListing, getAgent, getCommunity, listings, listingsInCommunity } from "@/lib/data";
import { usd, num } from "@/lib/utils";
import { MortgageCalc } from "@/components/site/property/MortgageCalc";

export function generateStaticParams() {
  return listings.map((l) => ({ id: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) return { title: "Listing not found — Matin Real Estate" };
  return {
    title: `${listing.address}, ${listing.city} — ${usd(listing.price)} | Matin Real Estate`,
    description: listing.description,
  };
}

/** Design's small tracked section label (eyebrow) used down the left column. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate">
      {children}
    </div>
  );
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) notFound();

  const agent = getAgent(listing.agentSlug);
  const community = getCommunity(listing.communitySlug);
  const more = listingsInCommunity(listing.communitySlug).filter((l) => l.id !== listing.id).slice(0, 3);

  const facts: { icon: typeof BedDouble; label: string; value: string }[] = [
    { icon: BedDouble, label: "Bedrooms", value: `${listing.beds}` },
    { icon: Bath, label: "Bathrooms", value: `${listing.baths}` },
    { icon: Maximize, label: "Square feet", value: num(listing.sqft) },
    { icon: Ruler, label: "Lot size", value: listing.lotSize },
    { icon: CalendarDays, label: "Year built", value: `${listing.yearBuilt}` },
    { icon: Home, label: "Type", value: listing.type },
    { icon: Car, label: "Garage", value: listing.garage ? `${listing.garage}-car` : "None" },
    { icon: Landmark, label: "HOA", value: listing.hoa ? `${usd(listing.hoa)}/mo` : "None" },
    { icon: TrendingUp, label: "Price / sqft", value: `$${num(listing.pricePerSqft)}` },
    { icon: Clock, label: "Days on market", value: listing.daysOnMarket === 0 ? "New" : `${listing.daysOnMarket}` },
    { icon: Hash, label: "MLS #", value: listing.mlsId },
  ];

  return (
    <>
      {/* ---------- BREADCRUMB ---------- */}
      <div className="border-b border-ink/[0.06] bg-paper pt-6 pb-4">
        <Container>
          <nav className="flex flex-wrap items-center gap-1.5 text-[0.82rem] text-slate">
            <Link href="/property-search" className="hover:text-ink">Property search</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            {community ? (
              <Link href={`/communities/${community.slug}`} className="hover:text-ink">{community.name}</Link>
            ) : (
              <span>{listing.city}</span>
            )}
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink/80">{listing.address}</span>
          </nav>
        </Container>
      </div>

      {/* ---------- GALLERY ---------- */}
      <div className="w-full overflow-hidden px-0 sm:px-6 lg:px-8 pt-8">
        <div className="mx-auto max-w-screen-xl">
          <Gallery photos={listing.photos} alt={`${listing.address}, ${listing.city}`} />
        </div>
      </div>

      <Section className="pt-8 pb-24 md:pt-12 md:pb-16 lg:pt-14">
        <Container>
          <div className="grid gap-8 lg:gap-12 lg:grid-cols-[1.55fr_1fr]">
            {/* ===== MAIN COLUMN ===== */}
            <div className="min-w-0 lg:border-r lg:border-ink/[0.07] lg:pr-12">
              {/* Title bar — price, address, inline facts row, Ask Matin */}
              <div className="border-b border-ink/[0.08] pb-7">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={listing.status} />
                  {listing.daysOnMarket === 0 && (
                    <span className="inline-flex items-center rounded-full border border-[#cfe3d7] bg-gold-soft px-2.5 py-0.5 text-[0.72rem] font-semibold uppercase tracking-wide text-gold-ink">
                      Just listed
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="font-display text-[clamp(2.1rem,5vw,3.2rem)] font-medium leading-none tracking-tight text-ink tabular-nums">
                      {usd(listing.price)}
                    </h1>
                    <p className="mt-2.5 flex items-center gap-1.5 text-base text-ink/80 sm:text-[1.05rem]">
                      <MapPin className="h-4 w-4 shrink-0 text-gold" /> {listing.address}, {listing.city},{" "}
                      {listing.state} {listing.zip}
                    </p>
                  </div>
                  {/* Design's Save/Share slot → the real Ask Matin concierge */}
                  <AskMatinButton className="shrink-0" label="Ask Matin" />
                </div>

                {/* Inline facts row — beds · baths · sqft · lot · built */}
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.92rem] tabular-nums text-slate">
                  <span><b className="font-semibold text-ink">{listing.beds}</b> beds</span>
                  <span className="text-mist">·</span>
                  <span><b className="font-semibold text-ink">{listing.baths}</b> baths</span>
                  <span className="text-mist">·</span>
                  <span><b className="font-semibold text-ink">{num(listing.sqft)}</b> sqft</span>
                  {listing.lotSize && (
                    <>
                      <span className="text-mist">·</span>
                      <span><b className="font-semibold text-ink">{listing.lotSize}</b> lot</span>
                    </>
                  )}
                  <span className="text-mist">·</span>
                  <span>Built <b className="font-semibold text-ink">{listing.yearBuilt}</b></span>
                  {listing.pricePerSqft > 0 && (
                    <>
                      <span className="text-mist">·</span>
                      <span className="text-ink/55">${num(listing.pricePerSqft)}/sqft</span>
                    </>
                  )}
                </div>
              </div>

              {/* Property details — real data in the design's hairline card grid */}
              <div className="mt-8">
                <SectionLabel>Property details</SectionLabel>
                <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] bg-ink/[0.06] ring-1 ring-ink/[0.06] sm:grid-cols-3">
                  {facts.map((f) => (
                    <div key={f.label} className="bg-white p-4 sm:p-5">
                      <dt className="flex items-center gap-2 text-[0.72rem] uppercase tracking-wide text-slate">
                        <f.icon className="h-4 w-4 shrink-0 text-gold" /> {f.label}
                      </dt>
                      <dd className="mt-2 font-display text-lg text-ink sm:text-xl tabular-nums">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* About this home */}
              <div className="mt-9">
                <SectionLabel>About this home</SectionLabel>
                <p className="mt-3 max-w-prose text-[0.98rem] leading-[1.7] text-ink-600 text-pretty">
                  {listing.description}
                </p>
              </div>

              {/* Features — green check chips, exactly the design's treatment */}
              {listing.features.length > 0 && (
                <div className="mt-9">
                  <SectionLabel>Features</SectionLabel>
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                    {listing.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-2.5 text-[0.94rem] text-ink-600">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold-soft text-[10px] text-gold">
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mortgage calculator — inline on mobile (sidebar carries it on desktop) */}
              <div className="mt-9 lg:hidden">
                <MortgageCalc listingPrice={listing.price} />
              </div>

              {/* Location — real Google map */}
              <div className="mt-9">
                <SectionLabel>Location</SectionLabel>
                <div className="mt-4 overflow-hidden rounded-[14px] shadow-soft ring-1 ring-ink/[0.07]">
                  <iframe
                    title={`Map of ${listing.address}`}
                    src={`https://www.google.com/maps?q=${listing.lat},${listing.lng}&z=14&output=embed`}
                    className="h-48 w-full border-0 sm:h-64 md:h-[380px]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>

            {/* ===== AGENT SIDEBAR ===== */}
            <aside className="agent-sidebar mt-8 min-w-0 space-y-4 lg:mt-0 lg:sticky lg:top-24 lg:self-start">
              {/* Agent card */}
              {agent ? (
                <div className="rounded-[14px] border border-ink/[0.1] bg-white p-5 shadow-[0_1px_2px_rgba(20,20,22,.05)]">
                  {/* Agent identity */}
                  <div className="flex items-center gap-3.5">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-paper-200 ring-2 ring-gold/15">
                      <Image
                        src={agent.photo}
                        alt={agent.name}
                        fill
                        sizes="56px"
                        className="object-cover object-top"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-gold">
                        Listing agent
                      </div>
                      <h2 className="mt-0.5 font-display text-lg leading-tight text-ink">{agent.name}</h2>
                      <p className="truncate text-[0.8rem] text-slate">{agent.title}</p>
                    </div>
                  </div>

                  {agent.rating > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-[0.8rem]">
                      <Star className="h-3.5 w-3.5 fill-warn text-warn" />
                      <span className="font-semibold tabular-nums text-ink/80">{agent.rating.toFixed(1)}</span>
                      {agent.reviews > 0 && (
                        <span className="tabular-nums text-slate">({agent.reviews} reviews)</span>
                      )}
                    </div>
                  )}

                  {/* Contact links */}
                  <div className="mt-4 space-y-1.5 border-t border-ink/[0.07] pt-4">
                    <a
                      href={`tel:${agent.phone}`}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[0.88rem] text-ink/85 transition hover:bg-gold-soft hover:text-gold-ink"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-gold" />{" "}
                      <span className="tabular-nums">{agent.phone}</span>
                    </a>
                    <a
                      href={`mailto:${agent.email}`}
                      className="flex items-center gap-2.5 break-all rounded-lg px-2 py-2 text-[0.88rem] text-ink/85 transition hover:bg-gold-soft hover:text-gold-ink"
                    >
                      <Mail className="h-4 w-4 shrink-0 text-gold" /> {agent.email}
                    </a>
                  </div>

                  {/* CTAs — green→brass primary (Request a tour) + ghost secondary */}
                  <div className="mt-4 flex flex-col gap-2.5">
                    <Link
                      href={`/contact?listing=${listing.id}`}
                      className="btn-accent inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-5 py-3 text-[0.92rem] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright/70 focus-visible:ring-offset-2"
                    >
                      <CalendarCheck className="h-4 w-4" /> Schedule a showing
                    </Link>
                    <Link
                      href={`/agents/${agent.slug}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-ink/[0.16] px-5 py-3 text-[0.92rem] font-semibold text-ink transition hover:border-ink/40 hover:bg-ink/[0.04]"
                    >
                      View agent profile <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Agent stats */}
                  {(agent.homesSold > 0 || agent.yearsExperience > 0) && (
                    <div className="mt-4 grid grid-cols-2 divide-x divide-ink/[0.07] border-t border-ink/[0.07] pt-1">
                      <div className="px-2 py-3 text-center">
                        <div className="font-display text-xl text-ink tabular-nums">{agent.homesSold}</div>
                        <div className="text-[0.66rem] uppercase tracking-wide text-slate">Homes sold</div>
                      </div>
                      <div className="px-2 py-3 text-center">
                        <div className="font-display text-xl text-ink tabular-nums">{agent.yearsExperience}yr</div>
                        <div className="text-[0.66rem] uppercase tracking-wide text-slate">Experience</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-[14px] border border-ink/[0.1] bg-white p-6 shadow-[0_1px_2px_rgba(20,20,22,.05)]">
                  <h2 className="font-display text-xl text-ink">Interested in this home?</h2>
                  <p className="mt-2 text-[0.9rem] text-slate">
                    Connect with a Matin broker to schedule a private showing.
                  </p>
                  <Link
                    href={`/contact?listing=${listing.id}`}
                    className="btn-accent mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-5 py-3 text-[0.92rem] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright/70 focus-visible:ring-offset-2"
                  >
                    <CalendarCheck className="h-4 w-4" /> Schedule a showing
                  </Link>
                </div>
              )}

              {/* Mortgage calculator — desktop sidebar (mobile version is inline above) */}
              <div className="hidden lg:block">
                <MortgageCalc listingPrice={listing.price} />
              </div>

              {/* Explore the community */}
              {community && (
                <Link
                  href={`/communities/${community.slug}`}
                  className="group block overflow-hidden rounded-[14px] shadow-soft ring-1 ring-ink/[0.07]"
                >
                  <div className="relative aspect-[16/9]">
                    <Image src={community.thumb} alt={community.name} fill sizes="360px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="text-[0.72rem] uppercase tracking-wider text-white/70">Explore the area</div>
                      <div className="font-display text-2xl">{community.name}</div>
                    </div>
                  </div>
                </Link>
              )}
            </aside>
          </div>
        </Container>
      </Section>

      {/* ---------- SIMILAR LISTINGS ---------- */}
      {more.length > 0 && (
        <Section className="bg-paper-200/60 pt-0 pb-24 sm:pb-16">
          <Container>
            <div className="flex items-end justify-between gap-6 border-t border-ink/[0.07] pt-10 sm:pt-16">
              <div>
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-gold">
                  Similar homes
                </span>
                <h2 className="mt-3 font-display text-2xl text-ink sm:text-3xl">
                  You may also like
                </h2>
                <p className="mt-1.5 text-[0.9rem] text-slate">
                  More homes in {community ? community.name : listing.city}
                </p>
              </div>
              {community && (
                <ButtonLink href={`/communities/${community.slug}`} variant="outline" className="hidden shrink-0 sm:inline-flex">
                  View community <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              )}
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
            {community && (
              <div className="mt-8 text-center sm:hidden">
                <ButtonLink href={`/communities/${community.slug}`} variant="outline">
                  View all in {community.name} <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            )}
          </Container>
        </Section>
      )}
    </>
  );
}
