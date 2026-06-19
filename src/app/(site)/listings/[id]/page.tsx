import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  BedDouble, Bath, Maximize, Ruler, CalendarDays, Home, Landmark, Car,
  TrendingUp, Clock, Hash, Check, MapPin, Phone, Mail, ArrowRight, ChevronRight,
} from "lucide-react";
import { Container, Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ListingCard } from "@/components/site/ListingCard";
import { Gallery } from "@/components/site/property/Gallery";
import { getListing, getAgent, getCommunity, listings, listingsInCommunity } from "@/lib/data";
import { usd, num } from "@/lib/utils";

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

function monthlyPayment(price: number) {
  const down = price * 0.2;
  const principal = price - down;
  const r = 0.068 / 12;
  const n = 30 * 12;
  const m = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(m);
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) notFound();

  const agent = getAgent(listing.agentSlug);
  const community = getCommunity(listing.communitySlug);
  const more = listingsInCommunity(listing.communitySlug).filter((l) => l.id !== listing.id).slice(0, 3);
  const monthly = monthlyPayment(listing.price);

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
      <div className="border-b border-ink/[0.06] bg-paper pt-24 pb-4">
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
      <Container className="pt-8">
        <Gallery photos={listing.photos} alt={`${listing.address}, ${listing.city}`} />
      </Container>

      <Section className="pt-12 md:pt-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
            {/* ===== MAIN COLUMN ===== */}
            <div>
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/[0.08] pb-8">
                <div>
                  <div className="mb-3"><StatusBadge status={listing.status} /></div>
                  <h1 className="font-display text-4xl text-ink md:text-5xl">{usd(listing.price)}</h1>
                  <p className="mt-3 flex items-center gap-1.5 text-lg text-ink/80">
                    <MapPin className="h-4.5 w-4.5 text-azure" /> {listing.address}
                  </p>
                  <p className="mt-1 text-slate">{listing.city}, {listing.state} {listing.zip}</p>
                </div>
                <div className="flex items-center gap-6 rounded-2xl bg-cloud px-6 py-4 shadow-soft ring-1 ring-ink/[0.06]">
                  <Stat icon={BedDouble} value={listing.beds} label="beds" />
                  <span className="h-8 w-px bg-ink/10" />
                  <Stat icon={Bath} value={listing.baths} label="baths" />
                  <span className="h-8 w-px bg-ink/10" />
                  <Stat icon={Maximize} value={num(listing.sqft)} label="sqft" />
                </div>
              </div>

              {/* Key facts grid */}
              <div className="mt-10">
                <h2 className="font-display text-2xl text-ink">Property details</h2>
                <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-ink/[0.06] ring-1 ring-ink/[0.06] sm:grid-cols-3">
                  {facts.map((f) => (
                    <div key={f.label} className="bg-cloud p-5">
                      <dt className="flex items-center gap-2 text-[0.78rem] uppercase tracking-wide text-slate">
                        <f.icon className="h-4 w-4 text-azure" /> {f.label}
                      </dt>
                      <dd className="mt-2 font-display text-xl text-ink">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Description */}
              <div className="mt-12">
                <h2 className="font-display text-2xl text-ink">About this home</h2>
                <p className="mt-5 text-[1.02rem] leading-relaxed text-ink/85 text-pretty">{listing.description}</p>
              </div>

              {/* Features */}
              {listing.features.length > 0 && (
                <div className="mt-12">
                  <h2 className="font-display text-2xl text-ink">Features &amp; highlights</h2>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {listing.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-[0.95rem] text-ink/85">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-azure/10 text-azure">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Payment estimate */}
              <div className="mt-12 rounded-2xl bg-gradient-to-br from-ink to-ink-700 p-8 text-white shadow-lift">
                <span className="eyebrow-light">Payment estimate</span>
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <span className="font-display text-5xl text-white">{usd(monthly)}</span>
                  <span className="pb-1.5 text-white/70">/ month</span>
                </div>
                <p className="mt-4 max-w-md text-[0.9rem] leading-relaxed text-slate-300">
                  Estimated principal &amp; interest with 20% down ({usd(Math.round(listing.price * 0.2))}) on a 30-year
                  fixed at ~6.8%. Taxes, insurance and HOA not included. For illustration only.
                </p>
                <div className="mt-6 flex flex-wrap gap-6 border-t border-white/10 pt-5 text-sm">
                  <div>
                    <div className="text-white/60">Down payment</div>
                    <div className="mt-0.5 font-display text-lg text-white">{usd(Math.round(listing.price * 0.2))}</div>
                  </div>
                  <div>
                    <div className="text-white/60">Loan amount</div>
                    <div className="mt-0.5 font-display text-lg text-white">{usd(Math.round(listing.price * 0.8))}</div>
                  </div>
                  <div>
                    <div className="text-white/60">Rate / term</div>
                    <div className="mt-0.5 font-display text-lg text-white">6.8% · 30yr</div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="mt-12">
                <h2 className="font-display text-2xl text-ink">Location</h2>
                <div className="mt-6 overflow-hidden rounded-2xl shadow-soft ring-1 ring-ink/[0.06]">
                  <iframe
                    title={`Map of ${listing.address}`}
                    src={`https://www.google.com/maps?q=${listing.lat},${listing.lng}&z=14&output=embed`}
                    className="h-[400px] w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>

            {/* ===== AGENT SIDEBAR ===== */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              {agent ? (
                <div className="overflow-hidden rounded-2xl bg-cloud shadow-lift ring-1 ring-ink/[0.06]">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={agent.photo}
                      alt={agent.name}
                      fill
                      sizes="360px"
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="p-6">
                    <div className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-azure">
                      Listing agent
                    </div>
                    <h3 className="mt-2 font-display text-2xl text-ink">{agent.name}</h3>
                    <p className="text-[0.9rem] text-slate">{agent.title}</p>

                    <div className="mt-5 space-y-2.5 text-[0.9rem]">
                      <a href={`tel:${agent.phone}`} className="flex items-center gap-3 text-ink/85 hover:text-azure">
                        <Phone className="h-4 w-4 text-azure" /> {agent.phone}
                      </a>
                      <a href={`mailto:${agent.email}`} className="flex items-center gap-3 break-all text-ink/85 hover:text-azure">
                        <Mail className="h-4 w-4 text-azure" /> {agent.email}
                      </a>
                    </div>

                    <div className="mt-6 flex flex-col gap-2.5">
                      <ButtonLink href={`/agents/${agent.slug}`} variant="primary" className="w-full">
                        Request a tour <ArrowRight className="h-4 w-4" />
                      </ButtonLink>
                      <ButtonLink href={`/agents/${agent.slug}`} variant="outline" className="w-full">
                        View agent profile
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-cloud p-6 shadow-soft ring-1 ring-ink/[0.06]">
                  <h3 className="font-display text-xl text-ink">Interested in this home?</h3>
                  <p className="mt-2 text-[0.9rem] text-slate">Connect with a Matin broker to schedule a tour.</p>
                  <ButtonLink href="/agents" variant="primary" className="mt-5 w-full">
                    Meet our brokers
                  </ButtonLink>
                </div>
              )}

              {community && (
                <Link
                  href={`/communities/${community.slug}`}
                  className="group mt-4 block overflow-hidden rounded-2xl shadow-soft ring-1 ring-ink/[0.06]"
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

      {/* ---------- MORE IN COMMUNITY ---------- */}
      {more.length > 0 && (
        <Section className="bg-paper-200/60 pt-0">
          <Container>
            <div className="flex items-end justify-between gap-6 border-t border-ink/[0.07] pt-16">
              <div>
                <span className="eyebrow">Nearby</span>
                <h2 className="display-3 mt-3 font-display text-ink">
                  More in {community ? community.name : listing.city}
                </h2>
              </div>
              {community && (
                <ButtonLink href={`/communities/${community.slug}`} variant="outline" className="hidden shrink-0 sm:inline-flex">
                  View community <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              )}
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof BedDouble; value: string | number; label: string }) {
  return (
    <div className="text-center">
      <Icon className="mx-auto h-5 w-5 text-azure" />
      <div className="mt-1.5 font-display text-xl text-ink">{value}</div>
      <div className="text-[0.72rem] uppercase tracking-wide text-slate">{label}</div>
    </div>
  );
}
