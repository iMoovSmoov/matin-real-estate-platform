"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone } from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import { AskMatinButton } from "./AskMatinButton";
import { company } from "@/lib/data";
import { cn } from "@/lib/utils";

/* Real nav routes, in the design's order (Buy · Sell · Cash Offer · Search ·
   Communities · Agents). About + Contact live in the mobile menu + footer. */
const NAV = [
  { label: "Buy", href: "/buy" },
  { label: "Sell", href: "/sell" },
  { label: "Cash Offer", href: "/cash-offer" },
  { label: "Search", href: "/property-search" },
  { label: "Communities", href: "/communities" },
  { label: "Agents", href: "/agents" },
];

/* Extra links surfaced only in the mobile menu (tablet has no bottom MobileNav). */
const MOBILE_EXTRA = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/* Routes whose page LEADS WITH A FULL-BLEED DARK HERO, so the header rides over
   it as a transparent white overlay (then solidifies into the paper bar on
   scroll). Per the design these are exactly the four screens with a photo hero
   behind the nav: Home, Sell, Communities, Agents. EVERY other route (Buy, Cash
   Offer, Property Search, Listing detail, Contact, About, Blog) shows the SOLID
   translucent-paper bar in normal flow — matching the design's inner-page navs
   (dark ink links on light, never white-on-white). The header reads this
   synchronously from the route (no hydration flash, zero per-page wiring); a
   new page that leads with a full-bleed dark hero opts in by adding its route
   here. Pages MUST lead with that hero for the white nav to stay legible. */
const OVERLAY_ROUTES = new Set<string>([
  "/",
  "/sell",
  "/communities",
  "/agents",
]);

const PHONE_TEL = `tel:+1${company.phoneRaw}`;

/** Translucent paper bar styling — the design's exact sticky nav surface. */
const SOLID_BAR_STYLE: React.CSSProperties = {
  background: "rgba(246,246,245,0.84)",
  backdropFilter: "blur(16px) saturate(160%)",
  WebkitBackdropFilter: "blur(16px) saturate(160%)",
};

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  const isOverlayRoute = OVERLAY_ROUTES.has(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Collapse the mobile menu on navigation.
  useEffect(() => setMenu(false), [pathname]);

  // Overlay treatment is active only on an overlay route, at the top, with the
  // mobile menu closed (an open menu always needs the readable solid surface).
  const overlay = isOverlayRoute && !scrolled && !menu;

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  }

  return (
    <header
      className={cn(
        "z-50 transition-[background-color,box-shadow,border-color] duration-300",
        // Home rides over the hero (fixed, out of flow); inner pages push
        // content down with a sticky bar.
        isOverlayRoute ? "fixed inset-x-0 top-0" : "sticky top-0",
        overlay
          ? "border-b border-transparent bg-transparent"
          : "border-b border-ink/[0.08]",
      )}
      style={overlay ? undefined : SOLID_BAR_STYLE}
    >
      {/* Skip link — visible on focus only */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none"
      >
        Skip to content
      </a>

      <div
        className={cn(
          "flex h-[58px] w-full items-center justify-between gap-4",
          isOverlayRoute ? "px-8 lg:px-[72px]" : "container-x",
        )}
      >
        {/* Brand lockup — M chip + Matin wordmark, theme-flipped per mode */}
        <Link
          href="/"
          aria-label="Matin Real Estate — home"
          className="flex shrink-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 rounded-sm"
        >
          <span
            className={cn(
              "inline-flex h-[30px] w-[30px] items-center justify-center rounded-[7px] transition-colors",
              overlay ? "bg-white" : "bg-ink",
            )}
          >
            <MatinMark className="h-[17px] w-auto" theme={overlay ? "dark" : "white"} />
          </span>
          <span
            className={cn(
              "text-[13px] font-semibold uppercase tracking-[0.22em] transition-colors",
              overlay ? "text-white" : "text-ink",
            )}
          >
            Matin
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  overlay
                    ? cn(
                        "focus-visible:ring-white/60 focus-visible:ring-offset-transparent",
                        active ? "font-semibold text-white" : "font-medium text-white/85 hover:text-white",
                      )
                    : cn(
                        "focus-visible:ring-gold/50",
                        active
                          ? "bg-gold-soft font-semibold text-gold"
                          : "font-medium text-ink-600 hover:text-ink",
                      ),
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <a
            href={PHONE_TEL}
            className={cn(
              "hidden text-[13px] font-semibold tabular-nums transition-colors md:inline-flex",
              overlay ? "text-white hover:text-white/80" : "text-ink hover:text-gold",
            )}
          >
            {company.phone}
          </a>

          <AskMatinButton className="hidden sm:inline-flex" />

          {/* Compact phone for the smallest screens */}
          <a
            href={PHONE_TEL}
            aria-label="Call Matin Real Estate"
            className={cn(
              "flex items-center sm:hidden transition-colors",
              overlay ? "text-white/85" : "text-ink",
            )}
          >
            <Phone className="h-5 w-5" />
          </a>

          {/* Mobile / tablet menu toggle */}
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            aria-label={menu ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menu}
            aria-controls="site-mobile-nav"
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              overlay
                ? "bg-white/10 text-white ring-1 ring-white/18 backdrop-blur-md focus-visible:ring-white/60 focus-visible:ring-offset-transparent"
                : "bg-ink/[0.04] text-ink ring-1 ring-ink/10 focus-visible:ring-gold/50",
            )}
          >
            {menu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile / tablet dropdown — always the solid surface for readability */}
      <div
        id="site-mobile-nav"
        className={cn(
          "overflow-hidden border-ink/[0.08] bg-paper/95 backdrop-blur-md transition-all duration-300 lg:hidden",
          menu ? "max-h-[34rem] border-t" : "max-h-0",
        )}
        aria-hidden={!menu}
      >
        <nav aria-label="Mobile navigation" className="container-x flex flex-col gap-1 py-4">
          {[...NAV, ...MOBILE_EXTRA].map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[44px] w-full items-center rounded-lg px-3 text-[0.95rem] transition-colors",
                  active
                    ? "bg-gold-soft font-semibold text-gold"
                    : "font-medium text-ink-600 hover:bg-ink/[0.04] hover:text-ink",
                )}
              >
                {n.label}
              </Link>
            );
          })}

          <a
            href={PHONE_TEL}
            className="mt-1 flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 text-[0.95rem] font-medium text-ink-600 hover:bg-ink/[0.04] hover:text-ink"
          >
            <Phone className="h-4 w-4 text-gold" /> {company.phone}
          </a>

          <AskMatinButton className="mt-2 w-full justify-center py-3" />
        </nav>
      </div>
    </header>
  );
}
