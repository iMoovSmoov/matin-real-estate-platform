import { FileText, PenLine, BadgeCheck } from "lucide-react";
import { reForms } from "@/lib/forms";
import { StatTile, SectionLabel } from "@/components/command/ui";
import { FormsLibrary } from "@/components/command/forms/FormsLibrary";

export const metadata = { title: "Forms" };

export default function FormsPage() {
  const formCount = reForms.length;
  const esignCount = reForms.filter((f) => f.esign).length;
  const orefCount = reForms.filter((f) => f.oref).length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-6 md:py-8">
      {/* Header */}
      <div>
        <SectionLabel className="mb-1.5">Forms</SectionLabel>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Forms</h1>
        <p className="mt-1 max-w-2xl text-[0.9rem] text-slate">
          Every form you need, pre-loaded and ready to fill.
        </p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label="Forms available"
          value={formCount}
          icon={<FileText className="h-4 w-4" />}
          hint="OREF + Matin library"
        />
        <StatTile
          label="E-sign ready"
          value={esignCount}
          icon={<PenLine className="h-4 w-4" />}
          hint="Send for signature in a click"
        />
        <StatTile
          label="OREF official"
          value={orefCount}
          icon={<BadgeCheck className="h-4 w-4" />}
          hint="Oregon standard forms"
        />
      </div>

      {/* Library */}
      <FormsLibrary />
    </div>
  );
}
