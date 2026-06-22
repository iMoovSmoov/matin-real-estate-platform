"use client";

import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { downloadTextFile } from "@/lib/download";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Coaching · shared Copy + Download bar

   Every generated coaching artifact (the auto-created plan, the roleplay
   transcript, the AI grade) is a real, portable file — never a dead-end the
   viewer can only look at. Text is assembled lazily at click-time via getText()
   so live-streaming content is always current.

   • Copy   → navigator.clipboard.writeText + an inline "Copied" confirmation
   • Download → downloadTextFile (a real .txt the demo viewer keeps)

   `iconOnly` renders compact, aria-labeled square buttons for dense headers.
   ────────────────────────────────────────────────────────────────────────── */

export function OutputActions({
  getText,
  filename,
  copyLabel = "Copy",
  downloadLabel = "Download",
  iconOnly = false,
  className,
}: {
  getText: () => string;
  filename: string;
  copyLabel?: string;
  downloadLabel?: string;
  iconOnly?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = getText().trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  function download() {
    const text = getText().trim();
    if (!text) return;
    downloadTextFile(filename, text);
  }

  const btn =
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-mist bg-cloud font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink";
  const sizing = iconOnly
    ? "min-h-[40px] min-w-[40px] px-2 py-1.5"
    : "min-h-[40px] px-2.5 py-1.5 text-[0.74rem]";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <button
        type="button"
        onClick={copy}
        aria-label={iconOnly ? (copied ? "Copied" : copyLabel) : undefined}
        className={cn(btn, sizing)}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-success" aria-hidden />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden />
        )}
        {!iconOnly ? (copied ? "Copied" : copyLabel) : null}
      </button>
      <button
        type="button"
        onClick={download}
        aria-label={iconOnly ? downloadLabel : undefined}
        className={cn(btn, sizing)}
      >
        <Download className="h-3.5 w-3.5" aria-hidden />
        {!iconOnly ? downloadLabel : null}
      </button>
    </div>
  );
}
