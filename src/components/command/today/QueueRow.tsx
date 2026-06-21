"use client";

import { MatinMark } from "@/components/brand/Logo";
import {
  StatusChip,
  Dot,
  ScoreChip,
  Avatar,
  PropertyThumb,
} from "@/components/os";
import type { WorkQueueItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CATEGORY_TONE, dueTone } from "./workQueueMeta";
import { enrich, personSlugFor } from "./queueEnrich";

/* ──────────────────────────────────────────────────────────────────────────
   Today Command Center — a single Human Work Queue row

   Row formula (build reference §2.1 + §1.5):
     [category chip] + [owner avatar] + [thumb if property] + [two-line: subject
     + why] + [intent/seller ScoreChip] + [right-aligned colored due time]

   Row click opens THAT record's drawer (handled by the page) — never the AI
   panel. Owner headshot + listing/deal photo are real assets, not placeholders.
   ────────────────────────────────────────────────────────────────────────── */

export function QueueRow({
  item,
  resolved,
  onOpen,
}: {
  item: WorkQueueItem;
  /** true once the row's failed automation has been retried + resolved */
  resolved?: boolean;
  onOpen: (item: WorkQueueItem) => void;
}) {
  const tone = CATEGORY_TONE[item.category];
  const dt = dueTone(item.dueLabel);
  const isAi = item.category === "Approve" || item.category === "Coach";
  const rec = enrich(item);
  const personSlug = personSlugFor(item);

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      aria-label={`Open ${item.subject}`}
      className="group flex w-full items-center gap-3 border-b border-mist px-5 py-3 text-left transition-colors last:border-0 hover:bg-paper-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/20"
    >
      {/* Category chip */}
      <span className="shrink-0">
        <StatusChip tone={tone}>
          {isAi ? <MatinMark theme="dark" className="h-3 w-3" /> : <Dot tone={tone} />}
          {item.category}
        </StatusChip>
      </span>

      {/* Property photo (listing / deal / seller) OR owner headshot */}
      {rec.thumbSeed != null ? (
        <span className="hidden h-10 w-14 shrink-0 overflow-hidden rounded-lg sm:block">
          <PropertyThumb
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
          size={32}
          ring
          className="hidden shrink-0 sm:inline-flex"
        />
      )}

      {/* Two-line primary */}
      <span className="min-w-0 flex-1">
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

      {/* Owner token + due time */}
      <span className="flex shrink-0 flex-col items-end gap-1.5 pl-1">
        {resolved ? (
          <StatusChip tone="success">Resolved</StatusChip>
        ) : (
          <span
            className={cn(
              "whitespace-nowrap text-[0.74rem] font-medium tabular-nums",
              dt === "danger"
                ? "text-danger"
                : dt === "warn"
                  ? "text-warn"
                  : "text-slate",
            )}
          >
            {item.dueLabel}
          </span>
        )}
        {/* tiny owner headshot when the lead photo took the main slot */}
        {rec.thumbSeed != null ? (
          <Avatar name={rec.ownerName} slug={rec.ownerSlug} size={18} ring />
        ) : null}
      </span>
    </button>
  );
}
