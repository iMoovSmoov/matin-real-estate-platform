"use client";

import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { downloadTextFile } from "@/lib/download";

/* ──────────────────────────────────────────────────────────────────────────
   Systems Health — AiDraftResult

   A streamed AI answer (root-cause explanation, fix plan, restart plan, Ask-
   Matin reply) rendered INSIDE the dark AIActionCard / AiPanel result slot.
   Once the stream finishes it exposes a REAL Copy (clipboard + inline "Copied")
   and a REAL Download (downloadTextFile → .txt) so the generated text is never
   a dead end — the operator can keep or paste it. Styled for the dark surface.
   ────────────────────────────────────────────────────────────────────────── */

export function AiDraftResult({
  text,
  running,
  filename,
}: {
  text: string;
  running: boolean;
  filename: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!text || typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-2.5">
      <p className="whitespace-pre-wrap break-words text-[0.8rem] leading-relaxed text-slate-300">
        {text}
      </p>
      {!running && text ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-ink-700 pt-2.5">
          <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.74rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile(filename, text)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.74rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
          <span className="ml-auto text-[0.64rem] text-slate-300/50">
            Matin AI draft — review before acting.
          </span>
        </div>
      ) : null}
    </div>
  );
}
