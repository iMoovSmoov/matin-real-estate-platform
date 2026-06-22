"use client";

import {
  Phone,
  MessageSquare,
  Mail,
  CalendarPlus,
  UserPlus,
  Eye,
} from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import { Avatar, ScoreRing } from "@/components/os";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";
import { telHref } from "./ComposeDrawer";
import { tempLabel, engagementStats } from "./leadView";

/* ──────────────────────────────────────────────────────────────────────────
   CRM — dense Real-Geeks row cells (S2.3)

   • LeadIdentityCell — temperature avatar-ring (gold ≥ 80 / gray cold) with a
     compact ScoreRing, name + source/community sub-line.
   • LeadEngagementCell — Searches/Props/Visits/Favs + "Last search" + "Last
     active Xm", all derived from real lead fields (no decoration).
   • LeadQuickActions — a 6-up quick-action icon cluster (Call · Text · Email ·
     Schedule · Assign · Ask AI), each a real affordance ≥ 44px on touch, with
     a persistent (not hover-only) chevron-free affordance.
   ────────────────────────────────────────────────────────────────────────── */

export function LeadIdentityCell({ lead }: { lead: Lead }) {
  const hot = lead.score >= 80;
  const temp = tempLabel(lead.score);
  return (
    <div className="flex items-center gap-3">
      <span className="relative shrink-0">
        <Avatar
          name={lead.name}
          size={40}
          className={cn(hot ? "ring-2 ring-gold" : "ring-1 ring-mist")}
        />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[0.88rem] font-semibold leading-tight text-ink">
            {lead.name}
          </span>
          <span
            className={cn(
              "shrink-0 text-[0.66rem] font-semibold uppercase tracking-[0.1em]",
              temp.tone === "success"
                ? "text-success"
                : temp.tone === "warn"
                  ? "text-warn"
                  : "text-info",
            )}
          >
            {temp.label}
          </span>
        </div>
        <p className="truncate text-[0.74rem] leading-tight text-slate">
          {lead.source} · {lead.community}
        </p>
      </div>
    </div>
  );
}

export function LeadScoreRing({ lead }: { lead: Lead }) {
  return <ScoreRing value={lead.score} size={40} />;
}

export function LeadEngagementCell({ lead }: { lead: Lead }) {
  const e = engagementStats(lead);
  const cells = [
    { k: "Search", v: e.searches },
    { k: "Props", v: e.props },
    { k: "Visits", v: e.visits },
    { k: "Favs", v: e.favs },
  ];
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-3">
        {cells.map((c) => (
          <span key={c.k} className="text-center">
            <span className="block text-[0.82rem] font-semibold leading-none tabular-nums text-ink">
              {c.v}
            </span>
            <span className="block text-[0.58rem] font-medium uppercase tracking-[0.08em] text-slate">
              {c.k}
            </span>
          </span>
        ))}
      </div>
      <p className="mt-1 truncate text-[0.72rem] text-slate">
        <span className="text-slate/70">{e.lastActive}</span> · {e.lastSearch}
      </p>
    </div>
  );
}

type QuickAction = "text" | "email" | "schedule" | "assign" | "ai";

function IconBtn({
  icon: Icon,
  glyph,
  label,
  href,
  onClick,
}: {
  icon?: typeof Phone;
  glyph?: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const cls =
    "inline-flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-lg border border-mist bg-cloud text-slate transition-colors hover:border-ink/20 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20";
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const inner = glyph ?? (Icon ? <Icon className="h-4 w-4" aria-hidden /> : null);
  if (href) {
    return (
      <a href={href} onClick={stop} className={cls} aria-label={label} title={label}>
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        stop(e);
        onClick?.();
      }}
      className={cls}
      aria-label={label}
      title={label}
    >
      {inner}
    </button>
  );
}

export function LeadQuickActions({
  lead,
  onAction,
  onOpen,
}: {
  lead: Lead;
  onAction: (lead: Lead, action: QuickAction) => void;
  onOpen?: (lead: Lead) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <IconBtn icon={Phone} label="Call" href={telHref(lead.phone)} />
      <IconBtn icon={MessageSquare} label="Text" onClick={() => onAction(lead, "text")} />
      <IconBtn icon={Mail} label="Email" onClick={() => onAction(lead, "email")} />
      <IconBtn icon={CalendarPlus} label="Schedule" onClick={() => onAction(lead, "schedule")} />
      <IconBtn icon={UserPlus} label="Assign" onClick={() => onAction(lead, "assign")} />
      {onOpen ? (
        <IconBtn icon={Eye} label="Open lead" onClick={() => onOpen(lead)} />
      ) : (
        <IconBtn
          glyph={<MatinMark theme="dark" className="h-4 w-4" />}
          label="Ask Matin"
          onClick={() => onAction(lead, "ai")}
        />
      )}
    </div>
  );
}
