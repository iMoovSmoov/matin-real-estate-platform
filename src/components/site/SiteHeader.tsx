"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Buy", href: "/buy" },
  { label: "Sell", href: "/sell" },
  { label: "Search", href: "/property-search" },
  { label: "Communities", href: "/communities" },
  { label: "Agents", href: "/agents" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();
  const onDark = pathname === "/" && !scrolled;

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
        "fixed inset-x-0 top-0 z-40 transition-all duration-500",
        onDark
          ? "bg-transparent py-4"
          : "border-b border-ink/10 bg-cloud/95 shadow-soft backdrop-blur-xl py-2.5",
      )}
    >
      <div className="container-x flex items-center justify-between gap-6">
        <Link href="/" className={cn("transition-colors", onDark ? "text-white" : "text-ink")}>
          <Logo className="h-9" />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "link-underline text-[0.92rem] font-medium transition-colors",
                  onDark
                    ? active ? "text-white" : "text-white/75 hover:text-white"
                    : active ? "text-ink" : "text-ink/60 hover:text-ink",
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
            className={cn(
              "hidden items-center gap-2 text-sm font-medium md:flex",
              onDark ? "text-white/90" : "text-ink/80",
            )}
          >
            <Phone className="h-4 w-4" /> (503) 622-9624
          </a>
          <Link
            href="/hub"
            className={cn(
              "hidden items-center gap-1.5 rounded-full px-4 py-2 text-[0.82rem] font-semibold transition sm:inline-flex",
              onDark
                ? "bg-white text-ink shadow-[0_8px_24px_rgba(6,6,6,.25)] hover:bg-paper"
                : "bg-azure text-white shadow-[0_8px_24px_rgba(6,6,6,.25)] hover:bg-azure-deep",
            )}
          >
            Matin Hub <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            className={cn("lg:hidden", onDark ? "text-white" : "text-ink")}
            onClick={() => setMenu((m) => !m)}
            aria-label="Menu"
          >
            {menu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden bg-cloud lg:hidden transition-all duration-300",
          menu ? "max-h-[28rem] border-t border-ink/10" : "max-h-0",
        )}
      >
        <nav className="container-x flex flex-col gap-1 py-4">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex w-full items-center rounded-lg px-3 min-h-[44px] text-[0.95rem] transition-colors",
                  active ? "bg-ink/[0.05] font-medium text-ink" : "text-ink/70 hover:bg-ink/5 hover:text-ink",
                )}
              >
                {n.label}
              </Link>
            );
          })}
          <Link href="/contact" className="flex w-full items-center rounded-lg px-3 min-h-[44px] text-ink/70 text-[0.95rem] hover:bg-ink/5 hover:text-ink">
            Contact
          </Link>
          <Link
            href="/hub"
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-azure px-4 min-h-[44px] font-semibold text-white"
          >
            Matin Hub <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
