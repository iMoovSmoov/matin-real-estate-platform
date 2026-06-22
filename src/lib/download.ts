/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — browser download helpers

   Dependency-free, SSR-safe helpers that turn a hub "Download / Export" action
   into a REAL file the demo viewer can keep — never a dead end:

     • downloadTextFile — any text → a real <a download> Blob click
     • downloadCsv      — rows → RFC-4180-escaped .csv download
     • printElementById — scoped print dialog so a viewer can "Save as PDF"

   Every helper guards `typeof window/document`, so importing them in a Server
   Component or calling during SSR is a safe no-op (returns false) rather than a
   crash.
   ────────────────────────────────────────────────────────────────────────── */

/** True only in a real browser with a live DOM. */
function hasDom(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Build a Blob from `text`, trigger a real `<a download>` click, then revoke the
 * object URL on the next tick. Returns `true` when the download was triggered,
 * `false` during SSR (no-op).
 *
 * @param filename  Suggested file name, e.g. "buyer-agreement.txt".
 * @param text      The file contents.
 * @param mime      MIME type (default "text/plain"); a charset is appended when absent.
 */
export function downloadTextFile(
  filename: string,
  text: string,
  mime = "text/plain",
): boolean {
  if (!hasDom()) return false;
  // Always carry a charset so accented characters survive in text/CSV files.
  const type = /charset=/i.test(mime) ? mime : `${mime};charset=utf-8`;
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after the click has had a chance to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}

/**
 * Quote a single CSV field per RFC 4180: wrap in double-quotes when it contains
 * a comma, double-quote, CR, or LF, and double any internal quotes.
 */
function csvField(value: string | number): string {
  const s = value == null ? "" : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Join `rows` into RFC-4180 CSV (CRLF line breaks, internal quotes doubled,
 * fields containing comma/quote/newline quoted) and download it as a real
 * `.csv`. The first row is conventionally the header. Returns `false` during SSR.
 *
 * A leading UTF-8 BOM is prepended so Excel reads accented characters correctly.
 *
 * @param filename  Suggested file name, e.g. "matin-report-2026.csv".
 * @param rows      Array of rows; each row is an array of string/number cells.
 */
export function downloadCsv(
  filename: string,
  rows: (string | number)[][],
): boolean {
  const csv = rows.map((row) => row.map(csvField).join(",")).join("\r\n");
  const BOM = "﻿"; // UTF-8 BOM so Excel reads accented characters correctly
  return downloadTextFile(filename, `${BOM}${csv}`, "text/csv");
}

/**
 * Open the browser print dialog scoped to ONE element so a viewer can choose
 * "Save as PDF" and get just that artifact (the same print-isolation approach
 * `BrandedDocument` uses for `.matindoc-print`). Injects a temporary scoped
 * `@media print` stylesheet that hides everything except `#id` and its
 * descendants, strips app chrome, prints, then cleans up (restoring the page
 * title). Falls back to a plain `window.print()` if the element isn't found.
 * Returns `false` during SSR.
 *
 * @param id             The id of the element to print in isolation.
 * @param documentTitle  Optional title used as the suggested PDF file name.
 */
export function printElementById(id: string, documentTitle?: string): boolean {
  if (!hasDom()) return false;

  const el = document.getElementById(id);
  if (!el) {
    window.print();
    return true;
  }

  // Escape the id for safe use inside a CSS selector (CSS.escape where available).
  const sel =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? `#${CSS.escape(id)}`
      : `[id="${id.replace(/["\\]/g, "\\$&")}"]`;

  const style = document.createElement("style");
  style.setAttribute("data-matin-print", "");
  style.textContent = `
@media print {
  @page { size: letter portrait; margin: 0.5in; }
  html, body { background: #fff !important; }
  body * { visibility: hidden !important; }
  ${sel}, ${sel} * { visibility: visible !important; }
  ${sel} {
    position: fixed !important; left: 0 !important; top: 0 !important; right: 0 !important;
    width: 100% !important; max-width: none !important; min-height: 0 !important;
    margin: 0 !important; aspect-ratio: auto !important; transform: none !important;
    box-shadow: none !important; border: none !important; border-radius: 0 !important;
    overflow: visible !important;
  }
  .matindoc-toolbar { display: none !important; }
}
`;
  document.head.appendChild(style);

  const prevTitle = document.title;
  if (documentTitle) document.title = documentTitle;

  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    style.remove();
    if (documentTitle) document.title = prevTitle;
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  // Fallback only for browsers without afterprint support.
  if (!("onafterprint" in window)) setTimeout(cleanup, 1000);

  window.print();
  return true;
}
