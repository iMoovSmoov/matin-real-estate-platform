import { Fragment } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Dark-themed inline markdown renderer for the streamed AI output
   (CMA, agreements, listing copy). Dependency-free. Understands:
     # / ## / ###   headings
     **bold**  *italic*  `code`
     - / *          bullet list
     1.             numbered list
     > quote        blockquote
     | table |      table with header / separator / data rows
     ---            divider
     blank line     paragraph break
   ────────────────────────────────────────────────────────────────────────── */

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  // Split on **bold**, *italic*, `code` — in that priority order
  const tokens = text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
    .filter(Boolean);

  return tokens.map((tok, i) => {
    if (tok.startsWith("**") && tok.endsWith("**") && tok.length > 4) {
      return (
        <strong key={`${keyBase}-b-${i}`} className="font-semibold text-ink">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    if (tok.startsWith("`") && tok.endsWith("`") && tok.length > 2) {
      return (
        <code
          key={`${keyBase}-c-${i}`}
          className="rounded bg-ink/[0.05] px-1.5 py-0.5 font-mono text-[0.82em] text-ink"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith("*") && tok.endsWith("*") && tok.length > 2) {
      return (
        <em key={`${keyBase}-i-${i}`} className="italic">
          {tok.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={`${keyBase}-t-${i}`}>{tok}</Fragment>;
  });
}

/* ── table helpers ─────────────────────────────────────────────────────── */

function isTableRow(line: string): boolean {
  return line.trimStart().startsWith("|") && line.trimEnd().endsWith("|");
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

interface TableBlock {
  type: "table";
  header: string[];
  rows: string[][];
}

/* ── main component ────────────────────────────────────────────────────── */

export function AiMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  let ordered: string[] = [];
  let tableLines: string[] = [];

  /* flush helpers */

  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    const items = [...bullets];
    bullets = [];
    blocks.push(
      <ul key={key} className="list-none my-2 space-y-1">
        {items.map((b, i) => (
          <li key={`${key}-${i}`} className="flex gap-2 text-[0.9rem] leading-relaxed text-ink/90">
            <span aria-hidden className="mt-[0.45em] shrink-0 text-ink/40">•</span>
            <span>{renderInline(b, `${key}-${i}`)}</span>
          </li>
        ))}
      </ul>,
    );
  };

  const flushOrdered = (key: string) => {
    if (ordered.length === 0) return;
    const items = [...ordered];
    ordered = [];
    blocks.push(
      <ol key={key} className="list-decimal list-inside my-2 space-y-1 ml-1">
        {items.map((b, i) => (
          <li key={`${key}-${i}`} className="text-[0.9rem] leading-relaxed text-ink/90">
            {renderInline(b, `${key}-${i}`)}
          </li>
        ))}
      </ol>,
    );
  };

  const flushTable = (key: string) => {
    if (tableLines.length === 0) return;
    const allLines = [...tableLines];
    tableLines = [];

    // Identify header (first row), separator (second row if separator), rest = data
    let headerCells: string[] = [];
    let dataRows: string[][] = [];

    if (allLines.length === 0) return;

    headerCells = parseTableCells(allLines[0]);

    const startIdx = allLines.length > 1 && isSeparatorRow(allLines[1]) ? 2 : 1;
    for (let i = startIdx; i < allLines.length; i++) {
      dataRows.push(parseTableCells(allLines[i]));
    }

    blocks.push(
      <div key={key} className="my-3 overflow-x-auto">
        <table className="w-full text-[0.82rem] border-collapse">
          <thead>
            <tr>
              {headerCells.map((cell, ci) => (
                <th
                  key={`${key}-th-${ci}`}
                  className="border border-ink/[0.1] bg-ink/[0.03] px-2.5 py-1.5 text-left font-semibold text-ink text-[0.78rem] uppercase tracking-wide"
                >
                  {renderInline(cell, `${key}-th-${ci}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={`${key}-tr-${ri}`}>
                {row.map((cell, ci) => (
                  <td
                    key={`${key}-td-${ri}-${ci}`}
                    className="border border-ink/[0.1] px-2.5 py-1.5 text-ink/80"
                  >
                    {renderInline(cell, `${key}-td-${ri}-${ci}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
  };

  const flushLists = (key: string) => {
    flushBullets(`${key}-ul`);
    flushOrdered(`${key}-ol`);
  };

  const flushAll = (key: string) => {
    flushLists(key);
    flushTable(`${key}-tbl`);
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const key = `ln-${idx}`;

    /* blank line */
    if (line.trim() === "") {
      flushAll(key);
      return;
    }

    /* horizontal rule */
    if (/^(\-\-\-|\*\*\*|___)$/.test(line.trim())) {
      flushAll(key);
      blocks.push(<hr key={key} className="my-4 border-ink/[0.08]" />);
      return;
    }

    /* table row */
    if (isTableRow(line)) {
      flushLists(key);
      tableLines.push(line);
      return;
    } else {
      /* leaving table context */
      if (tableLines.length > 0) {
        flushTable(`${key}-tbl`);
      }
    }

    /* ### sub-heading */
    if (line.startsWith("### ")) {
      flushAll(key);
      blocks.push(
        <h3
          key={key}
          className="font-semibold text-[0.9rem] text-ink mt-4 mb-1.5"
        >
          {renderInline(line.slice(4), key)}
        </h3>,
      );
      return;
    }

    /* ## heading */
    if (line.startsWith("## ")) {
      flushAll(key);
      blocks.push(
        <h2
          key={key}
          className="font-display text-[1.05rem] text-ink mt-5 mb-2 pb-1.5 border-b border-ink/[0.07] first:mt-0"
        >
          {renderInline(line.slice(3), key)}
        </h2>,
      );
      return;
    }

    /* # top-level heading (treat same as ##) */
    if (line.startsWith("# ")) {
      flushAll(key);
      blocks.push(
        <h2
          key={key}
          className="font-display text-[1.05rem] text-ink mt-5 mb-2 pb-1.5 border-b border-ink/[0.07] first:mt-0"
        >
          {renderInline(line.slice(2), key)}
        </h2>,
      );
      return;
    }

    /* > blockquote */
    if (line.startsWith("> ")) {
      flushAll(key);
      blocks.push(
        <blockquote
          key={key}
          className="border-l-2 border-ink/20 pl-3 text-ink/60 text-[0.85rem] italic my-2"
        >
          {renderInline(line.slice(2), key)}
        </blockquote>,
      );
      return;
    }

    /* numbered list */
    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushBullets(`${key}-ul`);
      ordered.push(orderedMatch[1]);
      return;
    }

    /* bullet list: "- " or "* " but NOT "* * *" (already handled above) */
    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushOrdered(`${key}-ol`);
      bullets.push(line.slice(2));
      return;
    }

    /* paragraph */
    flushAll(key);
    blocks.push(
      <p key={key} className="mb-2.5 last:mb-0 text-ink/90 text-[0.9rem] leading-relaxed">
        {renderInline(line, key)}
      </p>,
    );
  });

  flushAll("final");
  return <div className="space-y-1">{blocks}</div>;
}
