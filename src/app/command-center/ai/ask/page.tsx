import { AiChat } from "@/components/command/AiChat";

export default function AskPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-4">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-azure-300/80">
          Pillar 3 · AI Integration
        </p>
        <h1 className="mt-1 font-display text-3xl text-white">Ask Matin</h1>
        <p className="mt-1.5 max-w-2xl text-[0.9rem] leading-relaxed text-slate-300">
          The internal company copilot for brokers and staff — policies, market knowledge, referrals, and quick
          drafts, grounded in Matin&apos;s knowledge base, listings, and agent roster.
        </p>
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
