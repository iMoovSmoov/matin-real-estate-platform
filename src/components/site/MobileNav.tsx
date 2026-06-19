"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MapPin, Users, LayoutGrid, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { label: "Home", href: "/", Icon: Home },
  { label: "Search", href: "/property-search", Icon: Search },
  { label: "Communities", href: "/communities", Icon: MapPin },
  { label: "Agents", href: "/agents", Icon: Users },
] as const;

const MORE_NAV = [
  { label: "Buy", href: "/buy" },
  { label: "Sell", href: "/sell" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Blog", href: "/blog" },
  { label: "Cash Offer", href: "/cash-offer" },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Bottom bar */}
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-white/95 backdrop-blur-sm border-t border-ink/[0.08] pb-[env(safe-area-inset-bottom)]"
        style={{ height: "calc(56px + env(safe-area-inset-bottom))" }}
      >
        <div className="flex h-14 items-stretch">
          {PRIMARY_NAV.map(({ label, href, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 text-[0.62rem] font-medium tracking-wide transition-colors relative",
                  active ? "text-ink" : "text-slate/60 hover:text-ink",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
                {active && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ink" />
                )}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Open more navigation options"
            aria-expanded={open}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[0.62rem] font-medium tracking-wide transition-colors",
              open ? "text-ink" : "text-slate/60 hover:text-ink",
            )}
          >
            <LayoutGrid className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Slide-up overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 sm:hidden"
          aria-modal="true"
          role="dialog"
          aria-label="More navigation options"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="fixed bottom-0 inset-x-0 bg-white rounded-t-2xl px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-ink/60 tracking-wide uppercase">
                More
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close more navigation"
                className="rounded-full p-1.5 text-ink/50 hover:text-ink hover:bg-ink/[0.06] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="More navigation links" className="flex flex-col gap-1">
              {MORE_NAV.map(({ label, href }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex w-full items-center rounded-xl px-4 min-h-[48px] text-[0.95rem] font-medium transition-colors",
                      active
                        ? "bg-ink/[0.05] text-ink"
                        : "text-ink/70 hover:bg-ink/[0.04] hover:text-ink",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
