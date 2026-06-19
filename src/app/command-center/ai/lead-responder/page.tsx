import { leads } from "@/lib/data";
import { AiToolPanel, type Preset } from "@/components/command/AiToolPanel";

function leadPreset(id: string, label: string): Preset | null {
  const l = leads.find((x) => x.id === id) ?? leads.find((x) => x.firstName === label);
  if (!l) return null;
  return {
    label: l.firstName,
    hint: l.aiSummary,
    values: {
      name: l.name,
      intent: l.intent,
      area: l.community,
      budget: `$${Math.round(l.budgetMin / 1000)}k–$${Math.round(l.budgetMax / 1000)}k`,
      timeline: l.tags.includes("Urgent") ? "ASAP" : "Next 60–90 days",
      source: l.source,
      message: l.aiSummary,
    },
  };
}

const presets = [
  leadPreset(leads[0]?.id ?? "", "Mason"),
  leadPreset(leads.find((l) => l.stage === "New")?.id ?? "", "New lead"),
  leadPreset(leads.find((l) => l.intent.toLowerCase().includes("sell"))?.id ?? "", "Seller"),
].filter(Boolean) as Preset[];

export default function LeadResponderPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <AiToolPanel
        tool="lead-responder"
        title="Lead Responder"
        pillar="Pillar 3 · AI Integration"
        description="Speed-to-lead wins deals. Draft a personalized, ready-to-send first reply that references the lead's area, price point, and intent — under 130 words, signed by the Matin team."
        submitLabel="Draft reply"
        outputTitle="Drafted reply"
        presets={presets}
        presetLabel="Load a real lead"
        fields={[
          { name: "name", label: "Lead name", placeholder: "Priya Reyes" },
          { name: "source", label: "Source", placeholder: "Zillow, Call-In, Open House…" },
          { name: "intent", label: "Intent", placeholder: "Buying / Selling / Both" },
          { name: "area", label: "Area / community", placeholder: "Ridgefield" },
          { name: "budget", label: "Budget", placeholder: "$805k–$980k" },
          { name: "timeline", label: "Timeline", placeholder: "Next 60–90 days" },
          { name: "message", label: "Their message / context", type: "textarea", placeholder: "What did they say or ask for?", full: true },
        ]}
      />
    </div>
  );
}
