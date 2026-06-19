import { Fragment } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Dark-themed inline markdown renderer for the streamed AI output
   (CMA, agreements, listing copy). Dependency-free. Understands:
     # / ## / ###   headings
     **bold**  _italic_  `code`
     - / *          bullet list
     1.             numbered list
     > quote        callout
     ---            divider
     blank line     paragraph break
   ────────────────────────────────────────────────────────────────────────── */

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g).filter(Boolean);
  return tokens.map((tok, i) => {
    if (tok.startsWith("**") && tok.endsWith("**")) {
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
          className="rounded bg-paper px-1.5 py-0.5 font-mono text-[0.82em] text-ink/80"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith("_") && tok.endsWith("_") && tok.length > 2) {
      return (
        <em key={`${keyBase}-i-${i}`} className="text-slate">
          {tok.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={`${keyBase}-t-${i}`}>{tok}</Fragment>;
  });
}

export function AiMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  let ordered: string[] = [];

  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    const items = bullets;
    bullets = [];
    blocks.push(
      <ul key={key} className="my-2 space-y-1.5">
        {items.map((b, i) => (
          <li key={`${key}-${i}`} className="flex gap-2.5 text-[0.9rem] leading-relaxed text-slate">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
            <span>{renderInline(b, `${key}-${i}`)}</span>
          </li>
        ))}
      </ul>,
    );
  };

  const flushOrdered = (key: string) => {
    if (ordered.length === 0) return;
    const items = ordered;
    ordered = [];
    blocks.push(
      <ol key={key} className="my-2 space-y-1.5">
        {items.map((b, i) => (
          <li key={`${key}-${i}`} className="flex gap-2.5 text-[0.9rem] leading-relaxed text-slate">
            <span
              aria-hidden
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-ink/[0.06] text-[0.68rem] font-semibold text-ink ring-1 ring-inset ring-ink/[0.06]"
            >
              {i + 1}
            </span>
            <span className="pt-px">{renderInline(b, `${key}-${i}`)}</span>
          </li>
        ))}
      </ol>,
    );
  };

  const flushLists = (key: string) => {
    flushBullets(`${key}-ul`);
    flushOrdered(`${key}-ol`);
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const key = `ln-${idx}`;

    if (line.trim() === "") {
      flushLists(key);
      return;
    }
    if (line.trim() === "---" || line.trim() === "***") {
      flushLists(key);
      blocks.push(<hr key={key} className="my-4 border-ink/[0.08]" />);
      return;
    }
    if (line.startsWith("### ")) {
      flushLists(key);
      blocks.push(
        <h4 key={key} className="mt-4 font-sans text-[0.82rem] font-semibold uppercase tracking-wider text-ink/80">
          {renderInline(line.slice(4), key)}
        </h4>,
      );
      return;
    }
    if (line.startsWith("## ")) {
      flushLists(key);
      blocks.push(
        <h3 key={key} className="mt-5 font-display text-lg text-ink first:mt-0">
          {renderInline(line.slice(3), key)}
        </h3>,
      );
      return;
    }
    if (line.startsWith("# ")) {
      flushLists(key);
      blocks.push(
        <h2 key={key} className="mt-5 font-display text-xl text-ink first:mt-0">
          {renderInline(line.slice(2), key)}
        </h2>,
      );
      return;
    }
    if (line.startsWith("> ")) {
      flushLists(key);
      blocks.push(
        <blockquote
          key={key}
          className="my-3 rounded-r-xl border-l-2 border-azure bg-azure/[0.08] px-4 py-2.5 text-[0.86rem] leading-relaxed text-slate"
        >
          {renderInline(line.slice(2), key)}
        </blockquote>,
      );
      return;
    }
    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushBullets(`${key}-ul`);
      ordered.push(orderedMatch[1]);
      return;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushOrdered(`${key}-ol`);
      bullets.push(line.slice(2));
      return;
    }
    flushLists(key);
    blocks.push(
      <p key={key} className="text-[0.9rem] leading-relaxed text-slate">
        {renderInline(line, key)}
      </p>,
    );
  });

  flushLists("final");
  return <div className="space-y-1">{blocks}</div>;
}
