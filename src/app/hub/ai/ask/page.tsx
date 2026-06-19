import Link from "next/link";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { AiChat } from "@/components/command/AiChat";

export default function AskPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6 md:py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-[0.78rem] text-slate/60">
        <Link href="/hub/ai" className="inline-flex items-center gap-1 hover:text-ink transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" />
          AI Studio
        </Link>
        <span>/</span>
        <span className="text-ink/70">Ask Matin</span>
      </nav>

      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Ask Matin</h1>
          <p className="mt-1 max-w-2xl text-[0.92rem] leading-relaxed text-slate">
            The internal company copilot for brokers and staff — policies, market knowledge, referrals, and quick
            drafts, grounded in Matin&apos;s knowledge base, listings, and agent roster.
          </p>
        </div>
      </div>
      <AiChat
        tool="ask-matin"
        title="Ask Matin"
        subtitle="Internal company copilot"
        userLabel="Alicia Kelly-Smith"
        placeholder="Ask about policy, a neighborhood, a referral, or draft something…"
        greeting="Hi! I'm the Matin copilot. Ask me about company policy, a neighborhood, who to refer a client to, or have me draft an email — I know our playbook, listings, and team. What do you need?"
        chips={[
          { label: "Commission split policy", text: "What's our commission split policy for new agents?" },
          { label: "Draft a price-drop email", text: "Draft a friendly price-drop email to a seller whose home has been on the market 30 days with no offers." },
          { label: "West Linn market summary", text: "Summarize the West Linn market for a seller consult this afternoon." },
          { label: "Camas buyer referral", text: "Who on the team should I refer a Camas buyer to?" },
        ]}
      />
    </div>
  );
}
