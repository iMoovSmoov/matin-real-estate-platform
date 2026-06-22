"use client";

import { ActivityTimeline, Avatar, type ActivityItem, type ActivityChannel, type ActivityTagTone } from "@/components/os";
import { activities } from "@/lib/data";
import { timeAgo } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Today — Recent activity feed (S1.5)

   Fills the right rail to the fold with ~6 real, timestamped brokerage events
   from activities.json (real agent + real action + minsAgo). Each row maps to a
   channel-typed glyph and a color-coded event tag, grouped under relative-time
   headers (Now / Earlier today). System/AI events (AI-drafted CMA) get the gold
   marker so automated work reads differently from human work (AI transparency).
   ────────────────────────────────────────────────────────────────────────── */

type EventShape = { channel: ActivityChannel; tag: string; tagTone: ActivityTagTone };

/** Classify a real activity line into channel + a colored event tag. */
function classify(text: string): EventShape {
  const t = text.toLowerCase();
  if (t.includes("ai-drafted") || t.includes("cma"))
    return { channel: "system", tag: "AI draft", tagTone: "gold" };
  if (t.includes("closed"))
    return { channel: "note", tag: "Closed", tagTone: "success" };
  if (t.includes("accepted offer"))
    return { channel: "system", tag: "Accepted offer", tagTone: "success" };
  if (t.includes("booked a showing"))
    return { channel: "call", tag: "Showing booked", tagTone: "info" };
  if (t.includes("listed"))
    return { channel: "note", tag: "New listing", tagTone: "warn" };
  if (t.includes("clear to close"))
    return { channel: "system", tag: "Clear to close", tagTone: "success" };
  if (t.includes("pending") || t.includes("inspection") || t.includes("financing") || t.includes("active") || t.includes("moved a deal"))
    return { channel: "system", tag: "Stage change", tagTone: "info" };
  return { channel: "note", tag: "Activity", tagTone: "info" };
}

export function RecentActivityFeed({ limit = 7 }: { limit?: number }) {
  const rows = [...activities].sort((a, b) => a.minsAgo - b.minsAgo).slice(0, limit);

  const items: ActivityItem[] = rows.map((a) => {
    const { channel, tag, tagTone } = classify(a.text);
    return {
      id: `act-${a.id}`,
      channel,
      name: (
        <span className="inline-flex items-center gap-1.5">
          <Avatar name={a.agent} slug={a.agentSlug} size={18} ring />
          <span>{a.agent}</span>
        </span>
      ),
      tag,
      tagTone,
      meta: a.text,
      timeLabel: timeAgo(a.minsAgo),
      group: a.minsAgo <= 60 ? "Now" : "Earlier today",
    };
  });

  return (
    <section className="rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-[1.05rem] font-normal leading-tight text-ink">
          Recent activity
        </h3>
        <span className="text-[0.74rem] text-slate tabular-nums">{rows.length} events</span>
      </div>
      <p className="mt-0.5 text-[0.78rem] text-slate">Live brokerage events across the team</p>
      <ActivityTimeline items={items} className="mt-1" />
    </section>
  );
}
