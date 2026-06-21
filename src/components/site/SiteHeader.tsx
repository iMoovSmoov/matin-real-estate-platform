"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Buy", href: "/buy" },
  { label: "Mortgage Calculator", href: "/mortgage-calculator" },
  { label: "Sell", href: "/sell" },
  { label: "Cash Offer", href: "/cash-offer" },
  { label: "Communities", href: "/communities" },
  { label: "Agents", href: "/agents" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenu(false), [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-500 bg-[#0d0d0e]",
        scrolled
          ? "py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.06)]"
          : "py-4",
      )}
    >
      {/* Skip to main content — visible on focus, hidden otherwise */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:outline-none"
      >
        Skip to content
      </a>

      <div className="container-x flex items-center justify-between gap-6">
        <Link href="/" className="text-white transition-colors">
          <Logo className="h-9" />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "link-underline text-[0.92rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0e] rounded-sm",
                  active ? "text-white" : "text-white/65 hover:text-white",
                  active && "!bg-[100%_1px]",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="tel:+15036229624"
            className="hidden items-center gap-2 text-sm font-medium md:flex text-white/75 hover:text-white transition-colors"
          >
            <Phone className="h-4 w-4" /> (503) 622-9624
          </a>
          <Link
            href="/hub"
            className="hidden items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[0.82rem] font-semibold text-ink shadow-[0_4px_16px_rgba(0,0,0,.4)] transition hover:bg-paper sm:inline-flex"
          >
            Matin Hub <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <a
            href="tel:+15036229624"
            aria-label="Call Matin Real Estate"
            className="flex items-center sm:hidden text-white/80"
          >
            <Phone className="h-5 w-5" />
          </a>
          <button
            className="lg:hidden text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0e] rounded-sm"
            onClick={() => setMenu((m) => !m)}
            aria-label={menu ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menu}
            aria-controls="mobile-nav"
          >
            {menu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-nav"
        className={cn(
          "overflow-hidden bg-[#0d0d0e] lg:hidden transition-all duration-300",
          menu ? "max-h-[32rem] border-t border-white/10" : "max-h-0",
        )}
        aria-hidden={!menu}
      >
        <nav aria-label="Mobile navigation" className="container-x flex flex-col gap-1 py-4">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex w-full items-center rounded-lg px-3 min-h-[44px] text-[0.95rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2",
                  active ? "bg-white/10 font-medium text-white" : "text-white/65 hover:bg-white/[0.07] hover:text-white",
                )}
              >
                {n.label}
              </Link>
            );
          })}
          <Link href="/contact" className="flex w-full items-center rounded-lg px-3 min-h-[44px] text-white/65 text-[0.95rem] hover:bg-white/[0.07] hover:text-white">
            Contact
          </Link>
          <Link
            href="/hub"
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-4 min-h-[44px] font-semibold text-ink"
          >
            Matin Hub <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
