import { transactions } from "@/lib/data";
import { TransactionsCockpit } from "@/components/command/transactions/TransactionsCockpit";

export const metadata = { title: "Transactions" };

/* Transaction Timeline + Checklist — contract-to-close cockpit (build ref §2.6).
   The TopCommandBar renders the "Transactions" H1; this page renders only the
   muted subtitle, then the KPI strip + one-deal 3-column screen via the client
   cockpit (selection + streamAi need the client boundary). */

export default function TransactionsPage() {
  return (
    <div className="px-4 pb-10 pt-4 md:px-6">
      <p className="mb-5 text-[0.82rem] text-slate">
        Deadlines, checklist, docs, risk, and emails on one deal screen — contract to close.
      </p>
      <TransactionsCockpit transactions={transactions} />
    </div>
  );
}
