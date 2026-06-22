"use client";

import { Phone, MessageSquare, Mail, RefreshCw, ArrowRight, CircleCheck } from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import {
  StatusChip,
  Dot,
  ScoreChip,
  Avatar,
  PropertyThumb,
} from "@/components/os";
import { leads } from "@/lib/data";
import type { WorkQueueItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { telHref } from "@/components/command/crm/ComposeDrawer";
import { CATEGORY_TONE, dueTone } from "./workQueueMeta";
import { enrich, personSlugFor } from "./queueEnrich";

/* ──────────────────────────────────────────────────────────────────────────
   Today Command Center — a single Human Work Queue row (S1.1 / S1.8)

   Row formula (§2.1 + §1.5):
     [category chip] + [real property photo OR owner headshot] + [two-line:
     subject + why] + [intent/seller ScoreChip] + [right-aligned colored due
     time] + a PER-ROW QUICK-ACTION CLUSTER operable WITHOUT opening the drawer
     (BoldTrail 4-button footer):
       lead / seller   → Call · Text · Email
       AI Drafts       → Approve & draft (gold)
       Failed Automat. → Retry
       everything else → Open

   The main region is a click target → opens the record drawer (deep view). The
   action cluster is separate buttons (no nested-button), each ≥ 44px on phone
   (R5). Real photos via listingPhoto (not seeded). Gold stays on AI actions.
   ────────────────────────────────────────────────────────────────────────── */

function ActionBtn({
  icon: Icon,
  glyph,
  label,
  href,
  onClick,
  tone = "ghost",
}: {
  icon?: typeof Phone;
  /** custom leading glyph (e.g. the Matin mark) — overrides `icon`. */
  glyph?: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  tone?: "ghost" | "gold";
}) {
  const cls = cn(
    "inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-[0.74rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20",
    tone === "gold"
      ? "bg-gold text-ink hover:bg-gold-bright"
      : "border border-mist bg-cloud text-slate hover:border-ink/20 hover:text-ink",
  );
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const inner = (
    <>
      {glyph ?? (Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null)}
      <span className="hidden sm:inline">{label}</span>
    </>
  );
  if (href) {
    return (
      <a href={href} onClick={stop} className={cls} aria-label={label}>
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
    >
      {inner}
    </button>
  );
}

export function QueueRow({
  item,
  resolved,
  onOpen,
  onQuick,
  onRetry,
}: {
  item: WorkQueueItem;
  /** true once the row's failed automation has been retried + resolved */
  resolved?: boolean;
  onOpen: (item: WorkQueueItem) => void;
  /** opens the drawer pre-targeted to a compose/approve action (text/email/approve) */
  onQuick?: (item: WorkQueueItem, action: "text" | "email" | "approve") => void;
  /** retry a failed-automation row in place (no drawer) */
  onRetry?: (item: WorkQueueItem) => void;
}) {
  const tone = CATEGORY_TONE[item.category];
  const dt = dueTone(item.dueLabel);
  const isAi = item.category === "Approve" || item.category === "Coach";
  const rec = enrich(item);
  const personSlug = personSlugFor(item);
  const isProperty = rec.thumbSrc != null || rec.thumbSeed != null;

  // Resolve a real lead phone for one-tap calling. Seller leads carry no
  // contact phone in the record, so we intentionally leave this undefined for
  // them — a Call button there would dial the assigned agent, not the seller.
  const phone =
    item.sourceType === "lead"
      ? leads.find((l) => l.id === item.sourceId)?.phone
      : undefined;

  const isContactRow = item.sourceType === "lead" || item.sourceType === "seller-lead";
  const isDraftRow = item.tab === "AI Drafts";
  const isFailedRow = item.tab === "Failed Automations";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(item);
        }
      }}
      aria-label={`Open ${item.subject}`}
      className="group flex w-full cursor-pointer flex-wrap items-center gap-3 border-b border-mist px-4 py-3 text-left transition-colors last:border-0 hover:bg-paper-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/20 sm:px-5"
    >
      {/* Category chip */}
      <span className="shrink-0">
        <StatusChip tone={tone}>
          {isAi ? <MatinMark theme="dark" className="h-3 w-3" /> : <Dot tone={tone} />}
          {item.category}
        </StatusChip>
      </span>

      {/* Property photo (real) OR owner headshot — visible on phone too (R3) */}
      {isProperty ? (
        <span className="h-10 w-14 shrink-0 overflow-hidden rounded-lg">
          <PropertyThumb
            src={rec.thumbSrc}
            seedIndex={rec.thumbSeed}
            ratio="video"
            rounded={false}
            alt={rec.address ?? item.subject}
            className="h-full w-full"
          />
        </span>
      ) : (
        <Avatar
          name={rec.personName ?? rec.ownerName}
          slug={personSlug ?? rec.ownerSlug}
          size={36}
          ring
          className="shrink-0"
        />
      )}

      {/* Two-line primary */}
      <span className="min-w-0 flex-1 basis-40">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-[0.9rem] font-semibold leading-tight text-ink",
              resolved && "line-through opacity-55",
            )}
          >
            {item.subject}
          </span>
          {rec.score != null ? (
            <ScoreChip score={rec.score} suffix={rec.scoreLabel} className="shrink-0" />
          ) : null}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[0.8rem] leading-snug text-slate">
          {item.why}
        </span>
      </span>

      {/* Due time */}
      <span className="ml-auto flex shrink-0 flex-col items-end gap-1 pl-1">
        {resolved ? (
          <StatusChip tone="success">
            <CircleCheck className="h-3 w-3" aria-hidden />
            Resolved
          </StatusChip>
        ) : (
          <span
            className={cn(
              "whitespace-nowrap text-[0.74rem] font-medium tabular-nums",
              dt === "danger" ? "text-danger" : dt === "warn" ? "text-warn" : "text-slate",
            )}
          >
            {item.dueLabel}
          </span>
        )}
      </span>

      {/* Quick-action cluster — operable without opening the drawer */}
      <div className="flex w-full shrink-0 items-center justify-end gap-1.5 sm:w-auto">
        {isFailedRow ? (
          resolved ? (
            <span className="inline-flex items-center gap-1 text-[0.74rem] font-medium text-success">
              <CircleCheck className="h-3.5 w-3.5" aria-hidden /> Retried
            </span>
          ) : (
            <ActionBtn icon={RefreshCw} label="Retry" onClick={() => onRetry?.(item)} />
          )
        ) : isDraftRow ? (
          <ActionBtn
            glyph={<MatinMark theme="dark" className="h-3.5 w-3.5" />}
            label="Approve & draft"
            tone="gold"
            onClick={() => onQuick?.(item, "approve")}
          />
        ) : isContactRow ? (
          <>
            {phone ? <ActionBtn icon={Phone} label="Call" href={telHref(phone)} /> : null}
            <ActionBtn icon={MessageSquare} label="Text" onClick={() => onQuick?.(item, "text")} />
            <ActionBtn icon={Mail} label="Email" onClick={() => onQuick?.(item, "email")} />
          </>
        ) : (
          <ActionBtn icon={ArrowRight} label="Open" onClick={() => onOpen(item)} />
        )}
      </div>
    </div>
  );
}
