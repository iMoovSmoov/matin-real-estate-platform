import { Briefcase, CalendarCheck, AlertTriangle } from "lucide-react";
import { transactions } from "@/lib/data";
import { StatTile, LiveDot } from "@/components/command/ui";
import { TransactionsView } from "@/components/command/transactions/TransactionsView";

export const metadata = { title: "Transactions" };

export default function TransactionsPage() {
  const active = transactions.filter((t) => t.stage !== "Closed");
  const closingThisMonth = transactions.filter(
    (t) => t.stage !== "Closed" && t.closeDateDaysOut <= 30,
  ).length;
  const atRisk = transactions.filter((t) => t.riskFlag).length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 px-4 pt-3 md:px-6">
      <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
        <h1 className="font-display text-[1.05rem] font-semibold text-ink">Transactions</h1>
        <LiveDot tone="azure" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label="Active transactions"
          value={active.length}
          icon={<Briefcase className="h-4 w-4" />}
          accent
          hint="Open deals in progress"
        />
        <StatTile
          label="Closing this month"
          value={closingThisMonth}
          icon={<CalendarCheck className="h-4 w-4" />}
          hint="Closing in ≤ 30 days"
        />
        <StatTile
          label="At risk"
          value={atRisk}
          icon={<AlertTriangle className="h-4 w-4" />}
          delta={atRisk > 0 ? { value: "needs attention", dir: "down" } : { value: "all clear", dir: "up" }}
        />
      </div>

      <TransactionsView transactions={transactions} />
    </div>
  );
}
