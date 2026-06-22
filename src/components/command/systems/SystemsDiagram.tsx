import type { CSSProperties } from "react";
import type { Integration } from "@/lib/types";

/* ──────────────────────────────────────────────────────────────────────────
   Systems Health — SystemsDiagram (ref §2.11 ticket 2)

   Node/edge data-flow hero: SOURCES (Zillow / Meta / IDX / RMLS) flow into the
   MatinOS core (Matin mark) which fans out to SYSTEMS (CRM / Transactions /
   Marketing / AI). Curved SVG connectors are GREEN when the feeding connector
   is healthy and RED when it is failing/needs-auth — so the operator sees the
   whole pipeline's health at a glance. Pure SVG, SSR/print-safe, no animation.
   ────────────────────────────────────────────────────────────────────────── */

type Health = "ok" | "bad";

type DiagramNode = {
  id: string;
  label: string;
  sub?: string;
  health: Health;
};

/** Map a list of connector statuses to a single node health (any non-healthy = bad). */
function healthOf(integrations: Integration[], names: string[]): Health {
  const rel = integrations.filter((i) => names.some((n) => i.name.toLowerCase().includes(n)));
  if (rel.length === 0) return "ok";
  return rel.every((i) => i.status === "Healthy") ? "ok" : "bad";
}

export function SystemsDiagram({ integrations }: { integrations: Integration[] }) {
  const sources: DiagramNode[] = [
    { id: "idx", label: "IDX Website", sub: "Sierra", health: healthOf(integrations, ["matinrealestate", "idx"]) },
    { id: "mls", label: "RMLS / NWMLS", sub: "MLS data", health: healthOf(integrations, ["rmls", "nwmls"]) },
    { id: "meta", label: "Meta / Google", sub: "Ad leads", health: healthOf(integrations, ["meta", "google"]) },
    { id: "sms", label: "Twilio", sub: "Calls / texts", health: healthOf(integrations, ["twilio"]) },
  ];
  const systems: DiagramNode[] = [
    { id: "crm", label: "CRM & Leads", sub: "FUB · Lofty", health: healthOf(integrations, ["follow up boss", "lofty"]) },
    { id: "tx", label: "Transactions", sub: "SkySlope · Dotloop", health: healthOf(integrations, ["skyslope", "dotloop"]) },
    { id: "mktg", label: "Marketing", sub: "SendGrid · Make", health: healthOf(integrations, ["sendgrid", "make", "n8n", "zapier"]) },
    { id: "ai", label: "AI Models", sub: "Claude · GPT", health: healthOf(integrations, ["anthropic", "openai", "gemini"]) },
  ];

  // Layout geometry.
  const W = 720;
  const H = 320;
  const leftX = 120;
  const rightX = W - 120;
  const coreX = W / 2;
  const coreY = H / 2;
  const slot = (i: number, n: number) => (H / (n + 1)) * (i + 1);

  const stroke = (h: Health) => (h === "bad" ? "var(--color-danger)" : "var(--color-success)");

  return (
    <div className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-mist px-5 py-4">
        <div>
          <h2 className="font-display text-[1.12rem] font-normal leading-tight text-ink">
            Data flow
          </h2>
          <p className="mt-0.5 text-[0.78rem] text-slate">
            Sources feed the MatinOS core, which fans out to every system. Red
            connectors mark a failing or unauthenticated feed.
          </p>
        </div>
        <span className="hidden items-center gap-3 text-[0.72rem] tabular-nums sm:inline-flex">
          <span className="inline-flex items-center gap-1.5 text-success">
            <span className="h-2 w-3 rounded-full bg-success" /> Healthy
          </span>
          <span className="inline-flex items-center gap-1.5 text-danger">
            <span className="h-2 w-3 rounded-full bg-danger" /> Failing
          </span>
        </span>
      </div>

      <div className="px-3 py-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full max-w-full"
          role="img"
          aria-label="MatinOS data-flow diagram: sources into the MatinOS core into systems"
        >
          {/* Source → core edges */}
          {sources.map((s, i) => {
            const y = slot(i, sources.length);
            const midX = (leftX + coreX) / 2;
            return (
              <path
                key={`e-${s.id}`}
                d={`M ${leftX + 56} ${y} C ${midX} ${y}, ${midX} ${coreY}, ${coreX - 44} ${coreY}`}
                fill="none"
                stroke={stroke(s.health)}
                strokeWidth={s.health === "bad" ? 2.4 : 1.8}
                strokeDasharray={s.health === "bad" ? "5 4" : undefined}
                opacity={0.75}
              />
            );
          })}
          {/* Core → system edges */}
          {systems.map((s, i) => {
            const y = slot(i, systems.length);
            const midX = (coreX + rightX) / 2;
            return (
              <path
                key={`e2-${s.id}`}
                d={`M ${coreX + 44} ${coreY} C ${midX} ${coreY}, ${midX} ${y}, ${rightX - 56} ${y}`}
                fill="none"
                stroke={stroke(s.health)}
                strokeWidth={s.health === "bad" ? 2.4 : 1.8}
                strokeDasharray={s.health === "bad" ? "5 4" : undefined}
                opacity={0.75}
              />
            );
          })}

          {/* Source nodes */}
          {sources.map((s, i) => (
            <DiagramChip key={s.id} node={s} x={leftX} y={slot(i, sources.length)} anchor="left" />
          ))}

          {/* Core node — ink disc with gold ring + Matin "M" */}
          <g>
            <circle cx={coreX} cy={coreY} r={44} fill="var(--color-ink)" />
            <circle cx={coreX} cy={coreY} r={44} fill="none" stroke="var(--color-gold)" strokeWidth={1.5} opacity={0.7} />
            <text
              x={coreX}
              y={coreY - 4}
              textAnchor="middle"
              className="fill-paper"
              style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)" }}
            >
              M
            </text>
            <text
              x={coreX}
              y={coreY + 13}
              textAnchor="middle"
              className="fill-gold"
              style={{ fontSize: 7, fontWeight: 600, letterSpacing: "0.14em", fontFamily: "var(--font-sans)" }}
            >
              MATINOS
            </text>
          </g>

          {/* System nodes */}
          {systems.map((s, i) => (
            <DiagramChip key={s.id} node={s} x={rightX} y={slot(i, systems.length)} anchor="right" />
          ))}

          {/* Column labels */}
          <text x={leftX} y={20} textAnchor="middle" className="fill-slate" style={LABEL}>SOURCES</text>
          <text x={coreX} y={20} textAnchor="middle" className="fill-slate" style={LABEL}>MATINOS CORE</text>
          <text x={rightX} y={20} textAnchor="middle" className="fill-slate" style={LABEL}>SYSTEMS</text>
        </svg>
      </div>
    </div>
  );
}

const LABEL: CSSProperties = {
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: "0.18em",
  fontFamily: "var(--font-sans)",
};

function DiagramChip({
  node,
  x,
  y,
  anchor,
}: {
  node: DiagramNode;
  x: number;
  y: number;
  anchor: "left" | "right";
}) {
  const w = 112;
  const h = 38;
  const rx = x - w / 2;
  const dotX = anchor === "left" ? rx + w - 12 : rx + 12;
  return (
    <g>
      <rect
        x={rx}
        y={y - h / 2}
        width={w}
        height={h}
        rx={9}
        fill="var(--color-cloud)"
        stroke={node.health === "bad" ? "var(--color-danger)" : "var(--color-mist)"}
        strokeWidth={node.health === "bad" ? 1.6 : 1}
      />
      <circle cx={dotX} cy={y - h / 2 + 11} r={3.2} fill={node.health === "bad" ? "var(--color-danger)" : "var(--color-success)"} />
      <text x={x} y={y - 2} textAnchor="middle" className="fill-ink" style={{ fontSize: 10.5, fontWeight: 600, fontFamily: "var(--font-sans)" }}>
        {node.label}
      </text>
      {node.sub ? (
        <text x={x} y={y + 10} textAnchor="middle" className="fill-slate" style={{ fontSize: 8.5, fontFamily: "var(--font-sans)" }}>
          {node.sub}
        </text>
      ) : null}
    </g>
  );
}
