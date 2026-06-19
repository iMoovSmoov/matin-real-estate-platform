import { FileText, Workflow, Inbox, TableProperties } from "lucide-react";
import { reForms, intakeFlows } from "@/lib/forms";
import { StatTile, SectionLabel, LiveDot } from "@/components/command/ui";
import { FormsLibrary } from "@/components/command/forms/FormsLibrary";
import { IntakeFlows } from "@/components/command/forms/IntakeFlows";

export const metadata = { title: "Forms & Data Flows" };

export default function FormsPage() {
  const formCount = reForms.length;
  const flowCount = intakeFlows.length;
  const submissions = intakeFlows.reduce((s, f) => s + f.submissionsThisMonth, 0);
  // Believable count of legacy spreadsheets/Google Forms retired by this module:
  // one per intake flow + roughly one tracker per form in the library.
  const retired = flowCount + reForms.length + 12;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-6 md:py-8">
      {/* Header */}
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <LiveDot tone="azure" />
          <SectionLabel>Pillar 1 · Structured Data Systems</SectionLabel>
        </div>
        <h1 className="font-display text-3xl text-white">Forms &amp; Data Flows</h1>
        <p className="mt-1 max-w-2xl text-[0.9rem] text-slate-300">
          Spreadsheets &amp; Google Forms → structured, branded, AI-assisted data flows. Every form an
          agent reaches for — fully branded, fully editable, with Claude auto-filling fields and drafting
          the language. The end of duplicate data entry.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Forms in library"
          value={formCount}
          icon={<FileText className="h-4 w-4" />}
          hint="OREF + Matin templates"
        />
        <StatTile
          label="Intake flows"
          value={flowCount}
          icon={<Workflow className="h-4 w-4" />}
          hint="Structured capture pipelines"
          accent
        />
        <StatTile
          label="Submissions / mo"
          value={submissions.toLocaleString("en-US")}
          delta={{ value: "live capture", dir: "up" }}
          icon={<Inbox className="h-4 w-4" />}
        />
        <StatTile
          label="Spreadsheets retired"
          value={retired}
          delta={{ value: "no more tabs", dir: "up" }}
          icon={<TableProperties className="h-4 w-4" />}
        />
      </div>

      {/* Sections */}
      <FormsLibrary />
      <IntakeFlows />
    </div>
  );
}
