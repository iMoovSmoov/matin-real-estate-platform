"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { company } from "@/lib/data";

function SocialIcon({ kind }: { kind: "facebook" | "instagram" | "linkedin" | "youtube" }) {
  const paths: Record<string, React.ReactNode> = {
    facebook: (
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
    ),
    instagram: (
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.68A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.41-10.4a1.44 1.44 0 1 1-1.44-1.44 1.44 1.44 0 0 1 1.44 1.44z" />
    ),
    linkedin: (
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.73v20.53C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.73C24 .78 23.2 0 22.22 0z" />
    ),
    youtube: (
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.3-1.9.5-3.8.5-5.8a31.3 31.3 0 0 0-.5-5.8zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z" />
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      {paths[kind]}
    </svg>
  );
}

const buyLinks: [string, string][] = [
  ["Buy a Home", "/buy"],
  ["Sell a Home", "/sell"],
  ["Cash Offer", "/cash-offer"],
  ["Property Search", "/property-search"],
  ["Communities", "/communities"],
  ["Market Reports", "/market-reports"],
];

const companyLinks: [string, string][] = [
  ["About", "/about"],
  ["Our Agents", "/agents"],
  ["Blog", "/blog"],
  ["Careers", "/careers"],
  ["Contact", "/contact"],
  ["Privacy Policy", "/privacy"],
  ["Terms of Service", "/terms"],
];

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) setSubscribed(true);
  }

  return (
    <footer className="bg-ink text-cloud">
      {/* Premium accent rule */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[rgba(210,160,80,0.55)] to-transparent" />

      <div className="container-x py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
          {/* Column 1 — Brand */}
          <div>
            <Logo className="h-10 text-white" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-cloud/70">
              Portland &amp; SW Washington&apos;s most advanced real estate brokerage
            </p>
            <div className="mt-6 flex gap-3">
              {([
                ["instagram", company.social?.instagram ?? "#"],
                ["facebook", company.social?.facebook ?? "#"],
                ["linkedin", company.social?.linkedin ?? "#"],
                ["youtube", "#"],
              ] as const).map(([kind, href]) => (
                <a
                  key={kind}
                  href={href}
                  aria-label={kind}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-cloud/15 text-cloud/60 transition hover:border-cloud/50 hover:text-cloud"
                >
                  <SocialIcon kind={kind} />
                </a>
              ))}
            </div>
            <p className="mt-6 text-[0.72rem] leading-relaxed text-cloud/45">
              Licensed in Oregon &amp; Washington. Equal Housing Opportunity.
            </p>
          </div>

          {/* Column 2 — Buy & Sell */}
          <div>
            <h4 className="font-display text-base font-semibold text-cloud">Buy &amp; Sell</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {buyLinks.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-cloud/70 transition hover:text-cloud">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Company */}
          <div>
            <h4 className="font-display text-base font-semibold text-cloud">Company</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {companyLinks.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-cloud/70 transition hover:text-cloud">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Newsletter */}
          <div>
            <h4 className="font-display text-base font-semibold text-cloud">
              Market insights, direct to you
            </h4>
            <p className="mt-1.5 text-sm text-cloud/50">Join 2,400+ Portland homeowners</p>
            {subscribed ? (
              <p className="mt-5 rounded-lg border border-cloud/20 bg-cloud/[0.08] px-4 py-3 text-sm text-cloud">
                Thanks! You&apos;re subscribed.
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-5 flex flex-col gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-lg bg-cloud/[0.08] border border-cloud/20 px-4 py-2.5 text-sm text-cloud placeholder:text-cloud/40 outline-none focus:ring-2 focus:ring-cloud/30 transition"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-cloud px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-cloud/90"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Network bar */}
      <div className="border-t border-cloud/10">
        <div className="container-x flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 py-4 text-[0.72rem] text-cloud/50">
          <span className="font-semibold uppercase tracking-wider text-cloud/70">The Matin network</span>
          {["PortlandRealEstate.com", "PortlandLuxuryRealEstate.com", "OregonRealEstate.com", "WashingtonRealEstate.com", "MatinCareers.com"].map((s) => (
            <a key={s} href={`https://www.${s.toLowerCase()}`} target="_blank" rel="noopener" className="transition hover:text-cloud">
              {s}
            </a>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-cloud/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-[0.78rem] text-cloud/50 md:flex-row">
          <p>&copy; 2026 {company.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="transition hover:text-cloud">Privacy</Link>
            <Link href="/terms" className="transition hover:text-cloud">Terms</Link>
            <Link href="/sitemap.xml" className="transition hover:text-cloud">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
