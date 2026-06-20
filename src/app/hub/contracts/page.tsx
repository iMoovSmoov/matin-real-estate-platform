import { FileSignature, ScrollText, Timer, Send, ArrowUpRight } from "lucide-react";
import { Pill, Panel, StatTile } from "@/components/command/ui";
import { reForms } from "@/lib/forms";
import { transactions, getAgent } from "@/lib/data";
import { usd } from "@/lib/utils";
import { ContractWizard } from "@/components/command/contracts/ContractWizard";

/* ──────────────────────────────────────────────────────────────────────────
   Contract Builder — pick a contract, auto-fill it, draft with AI, check
   compliance, and send it for signature. Built like a real document tool
   (SkySlope / Dotloop), not a multi-step process wizard.
   ────────────────────────────────────────────────────────────────────────── */

export const metadata = {
  title: "Contract Builder · Matin Hub",
  description:
    "Pick a contract, auto-fill it from the CRM, let AI draft the language, check compliance, and send it for signature in minutes.",
};

const CONTRACT_FORMS = reForms.filter((f) => f.pillar === "Contract Systems");

// Map a transaction stage to a status label + pill tone (white / status only).
function stageStatus(stage: string): { tone: "success" | "azure" | "neutral"; label: string } {
  const s = stage.toLowerCase();
  if (s.includes("clos") || s.includes("disburs")) return { tone: "success", label: "Closed" };
  if (s.includes("offer") || s.includes("contract") || s.includes("accept"))
    return { tone: "azure", label: "Signed" };
  if (s.includes("inspect") || s.includes("apprais") || s.includes("repair"))
    return { tone: "neutral", label: "In review" };
  return { tone: "neutral", label: stage };
}

export default function ContractsPage() {
  const recent = transactions.slice(0, 6);

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 px-4 pt-3 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
        <h1 className="font-display text-[1.05rem] font-semibold text-ink">Contract Builder</h1>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile
          label="Contracts available"
          value={String(CONTRACT_FORMS.length)}
          icon={<ScrollText className="h-4 w-4" />}
          hint="OREF + federal forms, e-sign ready"
        />
        <StatTile
          label="Avg time to draft"
          value="4 min"
          icon={<Timer className="h-4 w-4" />}
          hint="AI-drafted, down from ~14 by hand"
        />
        <StatTile
          label="E-sign turnaround"
          value="2.3 hrs"
          icon={<Send className="h-4 w-4" />}
          hint="median time to all parties signed"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* The builder */}
      <ContractWizard />

      {/* Recent contracts */}
      <Panel>
        <div className="flex items-center justify-between gap-3 border-b border-ink/[0.08] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]">
              <ScrollText className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-[0.95rem] font-semibold text-ink">Recent contracts</h3>
              <p className="text-[0.76rem] text-slate/70">Documents across active transactions</p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 text-[0.76rem] font-medium text-ink sm:inline-flex">
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>

        <ul className="divide-y divide-ink/[0.06]">
          {recent.map((tx) => {
            const agent = getAgent(tx.agentSlug);
            const st = stageStatus(tx.stage);
            const isListing = tx.type.toLowerCase().includes("listing");
            return (
              <li
                key={tx.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-paper"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-ink ring-1 ring-inset ring-ink/[0.06]">
                  <FileSignature className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.88rem] font-semibold text-ink">{tx.address}</p>
                  <p className="truncate text-[0.76rem] text-slate/70">
                    {isListing ? "Listing Agreement" : "Sale Agreement"} · {tx.client}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-[0.82rem] font-semibold tabular-nums text-ink">{usd(tx.price)}</p>
                  <p className="text-[0.72rem] text-slate/55">{agent?.name ?? "—"}</p>
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
