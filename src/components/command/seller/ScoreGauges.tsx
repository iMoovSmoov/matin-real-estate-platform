import type { SellerLead } from "@/lib/types";
import { cn } from "@/lib/utils";
import { equityBand } from "./sellerView";

/* ──────────────────────────────────────────────────────────────────────────
   Seller / Cash Offers — score intensity gauges (S3 ticket 1)

   Fello "Current Owner Low → High" gauge: a horizontal track with a positioned
   marker + Low/Med/High labels for each driver of seller intent. The #1 "looks
   basic" fix — turns three plain chips into a readable intensity read. Every
   value is DERIVED from the record (no fake fields):

     • Equity      — equityBand() (value × years owned)
     • Timeline    — urgency of the seller's stated timeline
     • Engagement  — count of tracked behavioral signals + stage progression

   Pure/server-safe; gold is NOT used (these are data gauges, not AI). The
   marker colors follow the §1.1 status palette (success / warn / info).
   ────────────────────────────────────────────────────────────────────────── */

type GaugeTone = "success" | "warn" | "info" | "danger";

interface Gauge {
  label: string;
  /** 0–100 marker position. */
  level: number;
  /** Short read shown on the right (e.g. "High equity"). */
  read: string;
  tone: GaugeTone;
}

const TONE_DOT: Record<GaugeTone, string> = {
  success: "bg-success",
  warn: "bg-warn",
  info: "bg-info",
  danger: "bg-danger",
};
const TONE_TEXT: Record<GaugeTone, string> = {
  success: "text-success",
  warn: "text-warn",
  info: "text-info",
  danger: "text-danger",
};

/** Equity gauge — strength of the owner's likely equity position. */
function equityGauge(lead: SellerLead): Gauge {
  const band = equityBand(lead);
  const level = band.tone === "success" ? 86 : band.tone === "info" ? 58 : 32;
  return { label: "Equity", level, read: band.label, tone: band.tone === "warn" ? "warn" : band.tone === "info" ? "info" : "success" };
}

/** Timeline gauge — how soon the seller intends to move. */
function timelineGauge(lead: SellerLead): Gauge {
  switch (lead.timeline) {
    case "ASAP":
      return { label: "Timeline", level: 92, read: "Moving ASAP", tone: "danger" };
    case "1-3 months":
      return { label: "Timeline", level: 70, read: "1–3 months", tone: "warn" };
    case "3-6 months":
      return { label: "Timeline", level: 45, read: "3–6 months", tone: "info" };
    default:
      return { label: "Timeline", level: 22, read: "6+ months", tone: "info" };
  }
}

/** Engagement gauge — behavioral intensity from tracked signals + stage. */
function engagementGauge(lead: SellerLead): Gauge {
  const signalPts = Math.min(60, (lead.signals?.length ?? 0) * 20);
  const stagePts =
    lead.stage === "Offer Pending" || lead.stage === "Offer Sent" || lead.stage === "Accepted"
      ? 40
      : lead.stage === "Needs Valuation"
        ? 24
        : lead.stage === "New Request"
          ? 18
          : 8;
  const level = Math.max(10, Math.min(100, signalPts + stagePts));
  const read =
    level >= 75 ? "Highly engaged" : level >= 45 ? "Warming up" : "Low activity";
  const tone: GaugeTone = level >= 75 ? "success" : level >= 45 ? "warn" : "info";
  return { label: "Engagement", level, read, tone };
}

export function ScoreGauges({ lead }: { lead: SellerLead }) {
  const gauges = [equityGauge(lead), timelineGauge(lead), engagementGauge(lead)];
  return (
    <div className="space-y-3.5">
      {gauges.map((g) => (
        <div key={g.label}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[0.78rem] font-medium text-ink">{g.label}</span>
            <span className={cn("text-[0.74rem] font-semibold", TONE_TEXT[g.tone])}>
              {g.read}
            </span>
          </div>
          <div className="relative mt-1.5 h-2 w-full rounded-full bg-paper-200">
            {/* Subtle Low→High band so the marker reads against a scale */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-paper-200 via-mist to-paper-200 opacity-60" />
            {/* Positioned marker */}
            <span
              className={cn(
                "absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-cloud",
                TONE_DOT[g.tone],
              )}
              style={{ left: `${g.level}%` }}
              aria-hidden
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[0.62rem] font-medium uppercase tracking-[0.1em] text-slate/70">
            <span>Low</span>
            <span>Med</span>
            <span>High</span>
          </div>
        </div>
      ))}
    </div>
  );
}
