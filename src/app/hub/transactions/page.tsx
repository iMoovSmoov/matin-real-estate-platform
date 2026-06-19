import { Wallet, DollarSign, CalendarCheck, AlertTriangle } from "lucide-react";
import { transactions } from "@/lib/data";
import { compactUsd } from "@/lib/utils";
import { StatTile, SectionLabel, LiveDot } from "@/components/command/ui";
import { TransactionsBoard } from "@/components/command/crm/TransactionsBoard";

export const metadata = { title: "Transactions" };

export default function TransactionsPage() {
  const open = transactions.filter((t) => t.stage !== "Closed");
  const totalCommission = transactions.reduce((s, t) => s + t.commission, 0);
  const pipelineValue = open.reduce((s, t) => s + t.price, 0);
  const closingThisMonth = transactions.filter((t) => t.closeDateDaysOut >= 0 && t.closeDateDaysOut <= 30 && t.stage !== "Closed").length;
  const atRisk = transactions.filter((t) => t.riskFlag).length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-6 md:py-8">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <LiveDot tone="azure" />
          <SectionLabel>Transactions</SectionLabel>
        </div>
        <h1 className="font-display text-3xl text-white">Transactions</h1>
        <p className="mt-1 max-w-2xl text-[0.9rem] text-slate-300">
          Every active deal on one board, stage by stage — with a live checklist, commission tracking, and
          automatic risk flags so nothing slips through the cracks.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Open pipeline" value={compactUsd(pipelineValue)} icon={<Wallet className="h-4 w-4" />} accent hint={`${open.length} active deals`} />
        <StatTile label="Total commission" value={compactUsd(totalCommission)} icon={<DollarSign className="h-4 w-4" />} hint="Across all deals" />
        <StatTile label="Closing ≤ 30 days" value={closingThisMonth} icon={<CalendarCheck className="h-4 w-4" />} delta={{ value: "on track", dir: "up" }} />
        <StatTile label="At risk" value={atRisk} icon={<AlertTriangle className="h-4 w-4" />} delta={atRisk > 0 ? { value: "needs attention", dir: "down" } : undefined} />
      </div>

      <TransactionsBoard transactions={transactions} />
    </div>
  );
}
