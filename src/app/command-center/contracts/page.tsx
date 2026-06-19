import {
  FileSignature,
  ScrollText,
  Timer,
  ShieldCheck,
  Send,
  Database,
  Stamp,
  ArrowUpRight,
} from "lucide-react";
import { SectionLabel, StatTile, LiveDot, Pill, Panel } from "@/components/command/ui";
import { reForms } from "@/lib/forms";
import { transactions, getAgent } from "@/lib/data";
import { usd } from "@/lib/utils";
import { ContractWizard } from "@/components/command/contracts/ContractWizard";

/* ──────────────────────────────────────────────────────────────────────────
   Pillar 5 · Contract Systems — the AI Contract Builder.
   A guided, AI-native workflow that drafts and compliance-checks Oregon
   listing & buyer agreements in minutes, then routes them for e-signature.
   ────────────────────────────────────────────────────────────────────────── */

export const metadata = {
  title: "Contract Builder · Matin Command Center",
  description:
    "AI-powered listing and buyer agreement creation — drafted, compliance-checked, and routed for e-signature in minutes.",
};

const CONTRACT_FORMS = reForms.filter((f) => f.pillar === "Contract Systems");

// Map a transaction stage to a contract-status pill tone.
function stageTone(stage: string): { tone: "success" | "azure" | "warn" | "neutral"; label: string } {
  const s = stage.toLowerCase();
  if (s.includes("clos") || s.includes("disburs")) return { tone: "success", label: "Closed" };
  if (s.includes("offer") || s.includes("contract") || s.includes("accept"))
    return { tone: "azure", label: "Signed" };
  if (s.includes("inspect") || s.includes("apprais") || s.includes("repair"))
    return { tone: "warn", label: "In review" };
  return { tone: "neutral", label: stage };
}

export default function ContractsPage() {
  const recent = transactions.slice(0, 6);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 md:px-6 md:py-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-ink-800/80 to-ink-900/80 px-6 py-7">
        <div className="pointer-events-none absolute -right-12 top-0 h-56 w-56 rounded-full bg-azure/20 blur-3xl" />
        <div className="grid-tech pointer-events-none absolute inset-0 opacity-[0.4]" />
        <div className="relative max-w-2xl">
          <div className="mb-2 flex items-center gap-2">
            <LiveDot tone="success" />
            <SectionLabel>Pillar 5 · Contract Systems</SectionLabel>
          </div>
          <h1 className="flex items-center gap-3 font-display text-3xl text-white md:text-[2.3rem]">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-azure/15 text-azure-bright ring-1 ring-inset ring-azure/25">
              <FileSignature className="h-6 w-6" />
            </span>
            AI Contract Builder
          </h1>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-slate-300">
            Listing &amp; buyer agreements, drafted and checked in minutes. Pick a form, auto-fill it from the CRM,
            let Claude write the clause language, run automated Oregon &amp; federal compliance, and route the
            packet for e-signature — one guided flow, zero duplicate data entry.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {[
              { icon: Database, label: "Auto-fill from CRM" },
              { icon: ScrollText, label: "Claude drafts the clauses" },
              { icon: ShieldCheck, label: "Compliance-checked" },
              { icon: Stamp, label: "DocuSign / Dotloop e-sign" },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.label}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
                >
                  <Icon className="h-4 w-4 text-azure-bright" />
                  <span className="text-[0.8rem] font-semibold text-white">{t.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Contracts available"
          value={CONTRACT_FORMS.length}
          icon={<ScrollText className="h-4 w-4" />}
          hint="OREF + federal forms, e-sign ready"
        />
        <StatTile
          label="Avg time to draft"
          value="4 min"
          delta={{ value: "−71%", dir: "up" }}
          icon={<Timer className="h-4 w-4" />}
          hint="vs ~14 min by hand"
          accent
        />
        <StatTile
          label="Compliance pass rate"
          value="99.2%"
          delta={{ value: "+6.1pt", dir: "up" }}
          icon={<ShieldCheck className="h-4 w-4" />}
          hint="auto-checked before send"
        />
        <StatTile
          label="E-sign turnaround"
          value="2.3 hrs"
          delta={{ value: "−40%", dir: "up" }}
          icon={<Send className="h-4 w-4" />}
          hint="median time to all-signed"
        />
      </div>

      {/* The wizard */}
      <ContractWizard />

      {/* Recent contracts */}
      <Panel>
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-azure/12 text-azure-bright ring-1 ring-inset ring-azure/20">
              <ScrollText className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-[0.95rem] font-semibold text-white">Recent contracts</h3>
              <p className="text-[0.76rem] text-slate-300/70">Documents generated across active transactions</p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 text-[0.76rem] font-medium text-azure-bright sm:inline-flex">
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>

        <ul className="divide-y divide-white/[0.06]">
          {recent.map((tx) => {
            const agent = getAgent(tx.agentSlug);
            const st = stageTone(tx.stage);
            const isListing = tx.type.toLowerCase().includes("listing");
            return (
              <li
                key={tx.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-azure-bright ring-1 ring-inset ring-white/10">
                  <FileSignature className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.88rem] font-semibold text-white">{tx.address}</p>
                  <p className="truncate text-[0.76rem] text-slate-300/70">
                    {isListing ? "Listing Agreement" : "Sale Agreement"} · {tx.client}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-[0.82rem] font-semibold tabular-nums text-white">{usd(tx.price)}</p>
                  <p className="text-[0.72rem] text-slate-300/55">{agent?.name ?? "—"}</p>
                </div>
                <Pill tone={st.tone}>{st.label}</Pill>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
