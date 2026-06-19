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
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "link-underline text-[0.92rem] font-medium transition-colors",
                onDark ? "text-white/90 hover:text-white" : "text-ink/80 hover:text-ink",
              )}
            >
              {n.label}
            </Link>
          ))}
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
            className="hidden items-center gap-1.5 rounded-full bg-azure px-4 py-2 text-[0.82rem] font-semibold text-white shadow-[0_8px_24px_rgba(6,6,6,.25)] transition hover:bg-azure-deep sm:inline-flex"
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
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2.5 text-ink/85 hover:bg-ink/5">
              {n.label}
            </Link>
          ))}
          <Link href="/contact" className="rounded-lg px-3 py-2.5 text-ink/85 hover:bg-ink/5">
            Contact
          </Link>
          <Link
            href="/hub"
            className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-azure px-4 py-2.5 font-semibold text-white"
          >
            Matin Hub <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
