"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  BellOff,
  User,
  Clock,
  FileText,
  Home,
  TrendingUp,
  Dumbbell,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotificationType =
  | "lead"
  | "deadline"
  | "agreement"
  | "coaching"
  | "listing"
  | "cash-offer";

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  read: boolean;
  time: string;
  icon: LucideIcon;
};

// ---------------------------------------------------------------------------
// Static notification data (derived from leads, transactions, agreements)
// ---------------------------------------------------------------------------

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n-001",
    type: "lead",
    title: "New lead — Priya Reyes just submitted",
    body: "Call-in · Ridgefield · Buying · Budget $805K–$980K",
    href: "/hub/crm",
    read: false,
    time: "2 min ago",
    icon: User,
  },
  {
    id: "n-002",
    type: "lead",
    title: "Hot new lead from Zillow — score 94",
    body: "Buyer inquiry · Lake Oswego · Budget $780K · respond now",
    href: "/hub/crm",
    read: false,
    time: "8 min ago",
    icon: TrendingUp,
  },
  {
    id: "n-003",
    type: "lead",
    title: "Stale lead — Mei Bennett, 3 days no contact",
    body: "Showing stage · Camas · High score 73 · action needed",
    href: "/hub/crm",
    read: false,
    time: "1 hr ago",
    icon: Clock,
  },
  {
    id: "n-004",
    type: "deadline",
    title: "Inspection deadline — 489 SE Ellsworth Rd",
    body: "TX-4000 · Vancouver · Repairs negotiated step overdue",
    href: "/hub/transactions",
    read: false,
    time: "1 hr ago",
    icon: Clock,
  },
  {
    id: "n-005",
    type: "deadline",
    title: "Contract deadline — 4521 Oak Dr is tomorrow",
    body: "Earnest money contingency · buyer response required",
    href: "/hub/transactions",
    read: false,
    time: "3 hrs ago",
    icon: FileText,
  },
  {
    id: "n-006",
    type: "agreement",
    title: "Buyer agreement unsigned — Angela Park",
    body: "BA-004 · Sent 4 days ago · Sherwood/Tualatin · showing soon",
    href: "/hub/buyer-agreements",
    read: false,
    time: "4 hrs ago",
    icon: FileText,
  },
  {
    id: "n-007",
    type: "agreement",
    title: "The Vances haven't signed their buyer agreement",
    body: "BA-008 · 3 showings scheduled, agreement still pending",
    href: "/hub/buyer-agreements",
    read: true,
    time: "Yesterday",
    icon: FileText,
  },
  {
    id: "n-008",
    type: "listing",
    title: "Marketing kit for 892 River Rd is ready",
    body: "LP-003 · Photos, virtual tour, MLS draft — review now",
    href: "/hub/listing-launch",
    read: true,
    time: "Yesterday",
    icon: Home,
  },
  {
    id: "n-009",
    type: "cash-offer",
    title: "Seller at 1204 Birch Ave accepted your offer",
    body: "Cash offer · $1.15M · Closing in 21 days · next steps",
    href: "/hub/cash-offer",
    read: true,
    time: "Yesterday",
    icon: Home,
  },
  {
    id: "n-010",
    type: "coaching",
    title: "Appointment-set rate dropped this week",
    body: "Down 12% vs. last week · try a role-play scenario now",
    href: "/hub/coaching",
    read: true,
    time: "2 days ago",
    icon: Dumbbell,
  },
  {
    id: "n-011",
    type: "lead",
    title: "Priya Hughes hasn't been contacted in 3 days",
    body: "Score 92 · Investing · Tualatin · $1.4M budget · urgent",
    href: "/hub/crm",
    read: true,
    time: "2 days ago",
    icon: User,
  },
  {
    id: "n-012",
    type: "listing",
    title: "14720 SW Osprey Dr listing went live",
    body: "LP-001 · Beaverton · $795K · MLS active · monitor traffic",
    href: "/hub/listing-launch",
    read: true,
    time: "3 days ago",
    icon: Home,
  },
];

// ---------------------------------------------------------------------------
// Icon color map per type
// ---------------------------------------------------------------------------

const TYPE_STYLES: Record<
  NotificationType,
  { bg: string; text: string }
> = {
  lead:        { bg: "bg-blue-50",   text: "text-blue-600"  },
  deadline:    { bg: "bg-amber-50",  text: "text-amber-600" },
  agreement:   { bg: "bg-amber-50",  text: "text-amber-600" },
  coaching:    { bg: "bg-violet-50", text: "text-violet-600" },
  listing:     { bg: "bg-emerald-50",text: "text-emerald-600" },
  "cash-offer":{ bg: "bg-emerald-50",text: "text-emerald-600" },
};

// ---------------------------------------------------------------------------
// NotificationCenter
// ---------------------------------------------------------------------------

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] =
    useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const displayed =
    tab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-ink/[0.04] hover:text-ink",
          open ? "bg-ink/[0.06] text-ink" : "text-slate",
        )}
      >
        <Bell className="h-[1.1rem] w-[1.1rem]" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[0.56rem] font-bold text-white ring-2 ring-paper">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-xl sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink/[0.07] px-4 py-3">
            <span className="text-[0.84rem] font-semibold text-ink">
              Notifications
            </span>
            <button
              onClick={markAllRead}
              className="text-sm text-slate transition-colors hover:text-ink"
            >
              Mark all read
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-ink/[0.07] px-4">
            {(["all", "unread"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "pb-2 pt-2.5 text-[0.78rem] font-medium capitalize transition-colors mr-4",
                  tab === t
                    ? "border-b-2 border-azure text-azure"
                    : "text-slate/60 hover:text-ink",
                )}
              >
                {t}
                {t === "unread" && unreadCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-danger/10 px-1.5 py-0.5 text-[0.6rem] font-bold text-danger">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notification list */}
          <ul className="max-h-[22rem] divide-y divide-ink/[0.05] overflow-y-auto">
            {displayed.length === 0 ? (
              /* Empty state */
              <li className="flex flex-col items-center gap-2 px-4 py-10">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <p className="text-[0.84rem] font-medium text-ink">
                  You&apos;re all caught up!
                </p>
                <p className="text-[0.74rem] text-slate/55">
                  No unread notifications
                </p>
              </li>
            ) : (
              displayed.map((notif) => {
                const styles = TYPE_STYLES[notif.type];
                const Icon = notif.icon;
                return (
                  <li
                    key={notif.id}
                    className={cn(
                      "transition-colors hover:bg-paper/60",
                      !notif.read && "bg-paper/40",
                    )}
                  >
                    <Link
                      href={notif.href}
                      onClick={() => {
                        markRead(notif.id);
                        setOpen(false);
                      }}
                      className="flex items-start gap-3 px-4 py-3"
                    >
                      {/* Icon circle */}
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          styles.bg,
                          styles.text,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.82rem] font-medium text-ink leading-snug">
                          {notif.title}
                        </p>
                        <p className="mt-0.5 truncate text-[0.72rem] text-slate/60">
                          {notif.body}
                        </p>
                        <p className="mt-0.5 text-[0.68rem] text-slate/50">
                          {notif.time}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!notif.read && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-azure" />
                      )}
                    </Link>
                  </li>
                );
              })
            )}
          </ul>

          {/* Footer */}
          <div className="border-t border-ink/[0.07]">
            <Link
              href="/hub/analytics"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-center text-[0.76rem] font-semibold text-azure transition-colors hover:bg-paper/60"
            >
              View all activity →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
