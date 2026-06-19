"use client";

import { Fragment } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Professional markdown renderer for streamed AI output.
   Renders as a real business document with proper sizing and hierarchy.
   Supports: # ## ### headings, **bold**, *italic*, `code`,
             - /* bullets, 1. ordered lists, > blockquotes,
             | tables |, --- dividers, blank line paragraph breaks.
   ────────────────────────────────────────────────────────────────────────── */

/* ── inline renderer ───────────────────────────────────────────────────── */

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  // Split on **bold**, *italic*, `code` — bold checked first to avoid
  // a single * inside ** being consumed as italic.
  const tokens = text
    .split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
    .filter(Boolean);

  return tokens.map((tok, i) => {
    const k = `${keyBase}-${i}`;

    if (tok.startsWith("**") && tok.endsWith("**") && tok.length > 4) {
      return (
        <strong key={k} className="font-semibold text-ink">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    if (tok.startsWith("`") && tok.endsWith("`") && tok.length > 2) {
      return (
        <code
          key={k}
          className="rounded bg-ink/[0.06] px-1.5 py-0.5 font-mono text-[0.82em] text-ink ring-1 ring-inset ring-ink/[0.08]"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith("*") && tok.endsWith("*") && tok.length > 2) {
      return (
        <em key={k} className="italic text-ink/80">
          {tok.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={k}>{tok}</Fragment>;
  });
}

/* ── table helpers ─────────────────────────────────────────────────────── */

function isTableRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.endsWith("|");
}

function isSeparatorRow(line: string): boolean {
  return isTableRow(line) && /^\|[\s|:-]+\|$/.test(line.trim());
}

function parseTableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

/* ── block types ───────────────────────────────────────────────────────── */

type Block =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "hr" }
  | { type: "blockquote"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: Array<{ num: number; text: string }> }
  | { type: "table"; header: string[]; rows: string[][] };

/* ── main component ────────────────────────────────────────────────────── */

export function AiMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: Block[] = [];

  // Accumulators for multi-line blocks
  let bulletAcc: string[] = [];
  let orderedAcc: Array<{ num: number; text: string }> = [];
  let quoteAcc: string[] = [];
  let tableAcc: string[] = [];

  const flushBullets = () => {
    if (bulletAcc.length === 0) return;
    blocks.push({ type: "ul", items: [...bulletAcc] });
    bulletAcc = [];
  };

  const flushOrdered = () => {
    if (orderedAcc.length === 0) return;
    blocks.push({ type: "ol", items: [...orderedAcc] });
    orderedAcc = [];
  };

  const flushQuote = () => {
    if (quoteAcc.length === 0) return;
    blocks.push({ type: "blockquote", lines: [...quoteAcc] });
    quoteAcc = [];
  };

  const flushTable = () => {
    if (tableAcc.length === 0) return;
    const allLines = [...tableAcc];
    tableAcc = [];
    if (allLines.length === 0) return;

    const header = parseTableCells(allLines[0]);
    const startIdx =
      allLines.length > 1 && isSeparatorRow(allLines[1]) ? 2 : 1;
    const rows: string[][] = [];
    for (let i = startIdx; i < allLines.length; i++) {
      if (!isSeparatorRow(allLines[i])) {
        rows.push(parseTableCells(allLines[i]));
      }
    }
    blocks.push({ type: "table", header, rows });
  };

  const flushLists = () => {
    flushBullets();
    flushOrdered();
  };

  const flushAll = () => {
    flushLists();
    flushQuote();
    flushTable();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    /* blank line — flush everything */
    if (trimmed === "") {
      flushAll();
      continue;
    }

    /* horizontal rule */
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      flushAll();
      blocks.push({ type: "hr" });
      continue;
    }

    /* table row */
    if (isTableRow(line)) {
      flushLists();
      flushQuote();
      tableAcc.push(line);
      continue;
    } else if (tableAcc.length > 0) {
      flushTable();
    }

    /* blockquote */
    if (line.startsWith("> ") || line === ">") {
      flushLists();
      flushTable();
      quoteAcc.push(line.startsWith("> ") ? line.slice(2) : "");
      continue;
    } else if (quoteAcc.length > 0) {
      flushQuote();
    }

    /* # heading (treated as h2) */
    if (line.startsWith("# ") && !line.startsWith("## ")) {
      flushAll();
      blocks.push({ type: "h2", text: line.slice(2) });
      continue;
    }

    /* ## heading */
    if (line.startsWith("## ") && !line.startsWith("### ")) {
      flushAll();
      blocks.push({ type: "h2", text: line.slice(3) });
      continue;
    }

    /* ### heading */
    if (line.startsWith("### ")) {
      flushAll();
      blocks.push({ type: "h3", text: line.slice(4) });
      continue;
    }

    /* numbered list */
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      flushBullets();
      flushQuote();
      flushTable();
      orderedAcc.push({ num: parseInt(orderedMatch[1], 10), text: orderedMatch[2] });
      continue;
    }

    /* bullet list: "- " or "* " */
    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushOrdered();
      flushQuote();
      flushTable();
      bulletAcc.push(line.slice(2));
      continue;
    }

    /* paragraph */
    flushAll();
    blocks.push({ type: "p", text: line });
  }

  /* flush any remaining accumulators */
  flushAll();

  /* ── render blocks ─────────────────────────────────────────────────── */

  const rendered = blocks.map((block, bi) => {
    const key = `b-${bi}`;

    switch (block.type) {
      case "h2":
        return (
          <h2
            key={key}
            className="mb-3 mt-6 border-b border-ink/[0.1] pb-2 font-display text-[1.15rem] font-normal tracking-tight text-ink first:mt-0"
          >
            {renderInline(block.text, key)}
          </h2>
        );

      case "h3":
        return (
          <h3
            key={key}
            className="mb-2 mt-5 font-sans text-[0.95rem] font-semibold uppercase tracking-[0.08em] text-ink/70 first:mt-0"
          >
            {renderInline(block.text, key)}
          </h3>
        );

      case "p":
        return (
          <p
            key={key}
            className="mb-3 text-[0.9rem] leading-[1.75] text-ink/90 last:mb-0"
          >
            {renderInline(block.text, key)}
          </p>
        );

      case "hr":
        return <hr key={key} className="my-5 border-ink/[0.1]" />;

      case "blockquote":
        return (
          <blockquote
            key={key}
            className="my-4 border-l-[3px] border-ink/20 pl-4 text-[0.875rem] italic text-ink/60 leading-relaxed"
          >
            {block.lines.map((l, li) => (
              <Fragment key={`${key}-l-${li}`}>
                {renderInline(l, `${key}-l-${li}`)}
                {li < block.lines.length - 1 && <br />}
              </Fragment>
            ))}
          </blockquote>
        );

      case "ul":
        return (
          <ul key={key} className="my-3 space-y-1.5 pl-1">
            {block.items.map((item, ii) => (
              <li
                key={`${key}-${ii}`}
                className="flex gap-2.5 text-[0.9rem] leading-relaxed text-ink/90"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/40"
                />
                <span>{renderInline(item, `${key}-li-${ii}`)}</span>
              </li>
            ))}
          </ul>
        );

      case "ol":
        return (
          <ol key={key} className="my-3 space-y-1.5 pl-1">
            {block.items.map((item, ii) => (
              <li
                key={`${key}-${ii}`}
                className="flex gap-2.5 text-[0.9rem] leading-relaxed text-ink/90"
              >
                <span className="min-w-[1.2rem] shrink-0 text-[0.8rem] font-semibold text-ink/50">
                  {item.num}.
                </span>
                <span>{renderInline(item.text, `${key}-li-${ii}`)}</span>
              </li>
            ))}
          </ol>
        );

      case "table":
        return (
          <div
            key={key}
            className="my-4 w-full overflow-x-auto rounded-lg ring-1 ring-ink/[0.08]"
          >
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {block.header.map((cell, ci) => (
                    <th
                      key={`${key}-th-${ci}`}
                      className="border border-ink/[0.12] bg-ink/[0.03] px-3 py-2 text-left text-[0.75rem] font-semibold uppercase tracking-wide text-ink/70"
                    >
                      {renderInline(cell, `${key}-th-${ci}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={`${key}-tr-${ri}`}>
                    {row.map((cell, ci) => (
                      <td
                        key={`${key}-td-${ri}-${ci}`}
                        className="border border-ink/[0.08] px-3 py-2 text-[0.85rem] text-ink/85 leading-snug"
                      >
                        {renderInline(cell, `${key}-td-${ri}-${ci}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  });

  return <div className="space-y-0.5">{rendered}</div>;
}
