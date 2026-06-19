import { Briefcase, CalendarCheck, AlertTriangle } from "lucide-react";
import { transactions } from "@/lib/data";
import { StatTile, SectionLabel, LiveDot } from "@/components/command/ui";
import { TransactionsView } from "@/components/command/transactions/TransactionsView";

export const metadata = { title: "Transactions" };

export default function TransactionsPage() {
  const active = transactions.filter((t) => t.stage !== "Closed");
  const closingThisMonth = transactions.filter(
    (t) => t.stage !== "Closed" && t.closeDateDaysOut <= 30,
  ).length;
  const atRisk = transactions.filter((t) => t.riskFlag).length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-6 md:py-8">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <LiveDot tone="azure" />
          <SectionLabel>Transaction management</SectionLabel>
        </div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Transactions</h1>
        <p className="mt-1 max-w-2xl text-[0.9rem] text-slate">
          Every deal as a loop — a smart checklist, deadlines, and documents in one place, so nothing
          slips between contract and close.
        </p>
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
