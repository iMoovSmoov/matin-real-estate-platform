"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";

export function AiHubRecentStrip({ toolKey }: { toolKey: string }) {
  const [output, setOutput] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("matin_ai_last_" + toolKey);
      setOutput(stored ?? "");
    } catch {
      // localStorage unavailable (SSR safety)
    }
  }, [toolKey]);

  function handleCopy() {
    if (!output) return;
    try {
      navigator.clipboard.writeText(output).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      });
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="mt-3 flex min-h-[52px] items-start gap-2 rounded-lg border border-ink/[0.04] bg-[#f4f4f3] px-3 py-2">
      <div className="min-w-0 flex-1">
        {output ? (
          <p className="line-clamp-2 text-[0.72rem] italic text-ink/60">{output}</p>
        ) : (
          <p className="text-[0.72rem] italic text-slate/35">
            No recent output — launch to generate
          </p>
        )}
      </div>
      {output && (
        <button
          onClick={handleCopy}
          aria-label="Copy recent output"
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-ink/40 transition-colors hover:bg-ink/[0.06] hover:text-ink/70"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
