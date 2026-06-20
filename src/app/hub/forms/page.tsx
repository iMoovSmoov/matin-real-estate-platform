import { FileText, PenLine, BadgeCheck } from "lucide-react";
import { reForms } from "@/lib/forms";
import { StatTile } from "@/components/command/ui";
import { FormsLibrary } from "@/components/command/forms/FormsLibrary";

export const metadata = { title: "Forms" };

export default function FormsPage() {
  const formCount = reForms.length;
  const esignCount = reForms.filter((f) => f.esign).length;
  const orefCount = reForms.filter((f) => f.oref).length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 px-4 pt-3 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
        <h1 className="font-display text-[1.05rem] font-semibold text-ink">Forms</h1>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
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
