import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — ChecklistPanel / ChecklistRow   (ref §1.10)

   Checkbox-style rows (wireframe 09 form): green-check done vs red-outline
   empty outstanding.
     done      — green check (lucide Check in success)
     issue     — red-outline empty box (border-danger)
     pending   — empty box (border-mist)
     scheduled — info dot
   Label + optional muted meta + optional inline `action` (ReactNode) on the
   right. Optional grouping by `groups`. LIGHT surface. Server-safe.
   ────────────────────────────────────────────────────────────────────────── */

export type ChecklistStatus = "done" | "pending" | "issue" | "scheduled";

export type ChecklistItem = {
  id: string;
  label: ReactNode;
  status: ChecklistStatus;
  meta?: ReactNode;
  action?: ReactNode;
  /** Group key — items render under the matching `groups[].key` header. */
  group?: string;
};

export type ChecklistGroup = { key: string; label: ReactNode };

function StatusBox({ status }: { status: ChecklistStatus }) {
  if (status === "done") {
    return (
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-success text-cloud">
        <Check className="h-3 w-3" aria-hidden strokeWidth={3} />
      </span>
    );
  }
  if (status === "issue") {
    return (
      <span
        aria-hidden
        className="flex h-[18px] w-[18px] shrink-0 rounded-[5px] border-2 border-danger"
      />
    );
  }
  if (status === "scheduled") {
    return (
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-info" />
      </span>
    );
  }
  // pending
  return (
    <span
      aria-hidden
      className="flex h-[18px] w-[18px] shrink-0 rounded-[5px] border border-mist"
    />
  );
}

export function ChecklistRow({
  item,
  className,
}: {
  item: ChecklistItem;
  className?: string;
}) {
  const muted = item.status === "done";
  return (
    <div className={cn("flex items-start gap-3 py-2.5", className)}>
      <span className="pt-0.5">
        <StatusBox status={item.status} />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[0.84rem] font-medium leading-snug",
            muted ? "text-slate line-through decoration-mist" : "text-ink",
          )}
        >
          {item.label}
        </p>
        {item.meta != null ? (
          <p className="mt-0.5 text-[0.74rem] leading-snug text-slate">{item.meta}</p>
        ) : null}
      </div>
      {item.action != null ? (
        <div className="shrink-0 pt-0.5">{item.action}</div>
      ) : null}
    </div>
  );
}

export function ChecklistPanel({
  items,
  groups,
  className,
}: {
  items: ChecklistItem[];
  groups?: ChecklistGroup[];
  className?: string;
}) {
  if (groups && groups.length > 0) {
    return (
      <div className={cn("w-full", className)}>
        {groups.map((g) => {
          const rows = items.filter((it) => it.group === g.key);
          if (rows.length === 0) return null;
          return (
            <section key={g.key} className="mt-4 first:mt-0">
              <p className="eyebrow pb-1 text-slate">{g.label}</p>
              <div className="divide-y divide-mist">
                {rows.map((it) => (
                  <ChecklistRow key={it.id} item={it} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("w-full divide-y divide-mist", className)}>
      {items.map((it) => (
        <ChecklistRow key={it.id} item={it} />
      ))}
    </div>
  );
}
