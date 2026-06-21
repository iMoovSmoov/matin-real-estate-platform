import type { ReactNode } from "react";
import {
  Phone,
  MessageSquare,
  Mail,
  Activity,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — ActivityTimeline   (ref §1.7)

   LIGHT feed (renders inside light record drawers). Row formula:
     [channel glyph in tinted circle] + [bold name] + [inline color event tag]
     + [gray meta] + [right-aligned relative timeLabel]
   Hairline-separated (border-mist). Consecutive items collapse under a
   relative-time header (the `group` string) when present.

   Channel-typed left icons encode call/text/email/system/note without text
   labels (FUB). System/AI events (channel='system') get a subtle gold marker
   so "Automated Email Sent" reads differently from "Email Received" — critical
   for AI transparency. Event tags are inline COLORED TEXT, not heavy badges.
   Server-safe.
   ────────────────────────────────────────────────────────────────────────── */

export type ActivityChannel = "call" | "text" | "email" | "system" | "note";
export type ActivityTagTone = "success" | "danger" | "warn" | "info" | "gold";

export type ActivityItem = {
  id: string;
  channel?: ActivityChannel;
  name: ReactNode;
  tag?: ReactNode;
  tagTone?: ActivityTagTone;
  meta?: ReactNode;
  timeLabel: ReactNode;
  /** Relative-time header this item groups under (e.g. "Now", "TODAY"). */
  group?: string;
};

const CHANNEL_ICON: Record<ActivityChannel, typeof Phone> = {
  call: Phone,
  text: MessageSquare,
  email: Mail,
  system: Activity,
  note: StickyNote,
};

const CHANNEL_TINT: Record<ActivityChannel, string> = {
  call: "bg-success/12 text-success ring-success/20",
  text: "bg-info/12 text-info ring-info/20",
  email: "bg-warn/15 text-warn ring-warn/25",
  system: "bg-gold-soft text-gold-ink ring-gold/25",
  note: "bg-paper-200 text-slate ring-mist",
};

const TAG_TONE: Record<ActivityTagTone, string> = {
  success: "text-success",
  danger: "text-danger",
  warn: "text-warn",
  info: "text-info",
  gold: "text-gold-ink",
};

function ChannelGlyph({ channel }: { channel: ActivityChannel }) {
  const Icon = CHANNEL_ICON[channel];
  const isSystem = channel === "system";
  return (
    <span
      className={cn(
        "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-inset",
        CHANNEL_TINT[channel],
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {/* Subtle gold marker distinguishes system/AI events. */}
      {isSystem ? (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gold ring-2 ring-cloud"
        />
      ) : null}
    </span>
  );
}

function Row({ item }: { item: ActivityItem }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <ChannelGlyph channel={item.channel ?? "note"} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[0.84rem] font-semibold leading-tight text-ink">
            {item.name}
          </span>
          {item.tag != null ? (
            <span
              className={cn(
                "text-[0.78rem] font-medium leading-tight",
                TAG_TONE[item.tagTone ?? "info"],
              )}
            >
              {item.tag}
            </span>
          ) : null}
        </div>
        {item.meta != null ? (
          <p className="mt-0.5 text-[0.76rem] leading-snug text-slate">{item.meta}</p>
        ) : null}
      </div>
      <span className="shrink-0 whitespace-nowrap pt-0.5 text-[0.72rem] leading-none text-slate tabular-nums">
        {item.timeLabel}
      </span>
    </li>
  );
}

export function ActivityTimeline({
  items,
  className,
}: {
  items: ActivityItem[];
  className?: string;
}) {
  // Build ordered groups, collapsing consecutive items under the same `group`.
  const groups: { key: string; header: string | null; items: ActivityItem[] }[] =
    [];
  for (const item of items) {
    const header = item.group ?? null;
    const last = groups[groups.length - 1];
    if (last && last.header === header) {
      last.items.push(item);
    } else {
      groups.push({ key: `${header ?? "_"}-${item.id}`, header, items: [item] });
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {groups.map((g) => (
        <section key={g.key}>
          {g.header ? (
            <p className="eyebrow pt-3 pb-1 text-slate">{g.header}</p>
          ) : null}
          <ul className="divide-y divide-mist">
            {g.items.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
