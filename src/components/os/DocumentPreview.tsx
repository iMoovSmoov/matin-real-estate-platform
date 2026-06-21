import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusChip, type ChipTone } from "./StatusChip";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — DocumentPreview   (ref §1.10)

   A document card: title (font-display) + optional status chip, ruled
   placeholder lines (border-mist), an optional literal boxed "Signature field"
   area, "Page X of N" paginator, and — when `missing` is provided — a small
   danger-tinted note listing exactly what's incomplete and where
   ("needs initials · page 4"). Optional `actions` slot (Preview / Download /
   Send for signature — caller provides the buttons). Server-safe.
   ────────────────────────────────────────────────────────────────────────── */

export function DocumentPreview({
  title,
  status,
  statusTone = "success",
  lines = 6,
  signatureField = false,
  page,
  pages,
  missing,
  actions,
  className,
}: {
  title: ReactNode;
  status?: ReactNode;
  statusTone?: ChipTone;
  lines?: number;
  signatureField?: boolean;
  page?: number;
  pages?: number;
  missing?: string[];
  actions?: ReactNode;
  className?: string;
}) {
  const lineCount = Math.max(0, Math.floor(lines));
  const hasMissing = Array.isArray(missing) && missing.length > 0;
  const showPager = typeof page === "number" && typeof pages === "number";

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-mist bg-cloud shadow-soft",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-mist px-4 py-3">
        <h3 className="min-w-0 truncate font-display text-[0.98rem] font-normal leading-tight text-ink">
          {title}
        </h3>
        {status != null ? (
          <span className="shrink-0">
            <StatusChip tone={statusTone}>{status}</StatusChip>
          </span>
        ) : null}
      </div>

      {/* Ruled page body */}
      <div className="flex-1 px-4 py-4">
        <div className="space-y-2.5" aria-hidden>
          {Array.from({ length: lineCount }).map((_, i) => (
            <span
              key={i}
              className="block h-px w-full bg-mist"
              style={{
                // Vary line length slightly so it reads like prose, not a grid.
                width: i % 3 === 2 ? "62%" : i % 2 === 0 ? "100%" : "88%",
              }}
            />
          ))}
        </div>

        {/* Literal boxed signature field */}
        {signatureField ? (
          <div className="mt-5 flex h-16 items-end rounded-lg border-2 border-dashed border-ink/30 px-3 py-2">
            <span className="text-[0.72rem] font-medium uppercase tracking-[0.16em] text-slate">
              Signature field
            </span>
          </div>
        ) : null}

        {/* Missing-field note */}
        {hasMissing ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2 ring-1 ring-inset ring-danger/20">
            <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0 text-danger" aria-hidden />
            <p className="text-[0.76rem] leading-snug text-danger">
              {missing!.join(" · ")}
            </p>
          </div>
        ) : null}
      </div>

      {/* Footer: paginator + actions */}
      {showPager || actions != null ? (
        <div className="flex items-center justify-between gap-3 border-t border-mist px-4 py-3">
          {showPager ? (
            <span className="text-[0.74rem] font-medium text-slate tabular-nums">
              Page {page} of {pages}
            </span>
          ) : (
            <span />
          )}
          {actions != null ? (
            <div className="flex items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
