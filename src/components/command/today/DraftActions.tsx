"use client";

import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { downloadTextFile } from "@/lib/download";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — DraftActions  (shared Copy + Save-.txt control for AI outputs)

   Every AI-generated draft (a lead reply, a first text, MLS remarks, a seller
   email body) must be something the operator can ACT on — not a view-only dead
   end. This renders a real "Copy" (navigator.clipboard + inline "Copied"
   confirmation) and a real "Save .txt" (downloadTextFile → a kept file).

   `tone="dark"` styles for the ink AIActionCard surface; `tone="light"` for the
   cloud drawer/letterhead surface. Used by both the Today queue and the CRM
   lead-detail drafts (the CRM folder imports this one, the way it already
   imports today/matchedListings).
   ────────────────────────────────────────────────────────────────────────── */

/** Filesystem-safe slug for a download file name (e.g. a lead name / subject). */
export function slugify(s: string): string {
  return (
    (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "draft"
  );
}

export function DraftActions({
  text,
  fileName,
  tone = "dark",
  copyLabel = "Copy",
  className,
}: {
  /** The exact text the user keeps — clipboard payload + .txt body. */
  text: string;
  /** Suggested download file name, e.g. "matin-draft-daniel-cho.txt". */
  fileName: string;
  tone?: "dark" | "light";
  copyLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const value = text ?? "";
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for clipboard-blocked contexts so Copy is never a no-op.
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* swallow — still show confirmation so the action isn't silent */
      }
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function save() {
    downloadTextFile(fileName, text ?? "");
  }

  const base =
    "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.74rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2";
  const dark =
    "border border-ink-700 bg-ink-900 text-slate-300 hover:text-cloud focus-visible:ring-gold/30";
  const light =
    "border border-mist bg-cloud text-slate hover:border-ink/20 hover:text-ink focus-visible:ring-ink/20";
  const btn = cn(base, tone === "dark" ? dark : light);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={copy}
        className={btn}
        aria-label={copied ? "Copied to clipboard" : copyLabel}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-success" aria-hidden />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden />
        )}
        {copied ? "Copied" : copyLabel}
      </button>
      <button
        type="button"
        onClick={save}
        className={btn}
        aria-label="Save as a text file"
      >
        <Download className="h-3.5 w-3.5" aria-hidden />
        Save .txt
      </button>
    </div>
  );
}
