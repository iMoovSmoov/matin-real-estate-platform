import { Fragment } from "react";

/**
 * Tiny, dependency-free markdown renderer tuned for the short CMA / pricing
 * opinions the `cma` AI tool streams back. It understands:
 *   `## Heading`        → section heading
 *   `**bold**` segments → <strong>
 *   `_italic_` segments → <em>
 *   `- bullet`          → bullet list
 *   `> blockquote`      → callout
 *   everything else     → paragraph
 * It intentionally stays small and readable rather than pulling a full parser.
 */

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  // Split on **bold** and _italic_ while keeping the delimiters.
  const tokens = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean);
  return tokens.map((tok, i) => {
    if (tok.startsWith("**") && tok.endsWith("**")) {
      return (
        <strong key={`${keyBase}-b-${i}`} className="font-semibold text-ink">
          {tok.slice(2, -2)}
        </strong>
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

  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    const items = bullets;
    bullets = [];
    blocks.push(
      <ul key={key} className="my-2 space-y-1.5">
        {items.map((b, i) => (
          <li key={`${key}-${i}`} className="flex gap-2.5 text-[0.95rem] leading-relaxed text-ink/80">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-azure" />
            <span>{renderInline(b, `${key}-${i}`)}</span>
          </li>
        ))}
      </ul>,
    );
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const key = `ln-${idx}`;

    if (line.trim() === "") {
      flushBullets(`ul-${idx}`);
      return;
    }
    if (line.startsWith("### ")) {
      flushBullets(`ul-${idx}`);
      blocks.push(
        <h4 key={key} className="mt-4 font-display text-base text-ink">
          {renderInline(line.slice(4), key)}
        </h4>,
      );
      return;
    }
    if (line.startsWith("## ")) {
      flushBullets(`ul-${idx}`);
      blocks.push(
        <h3 key={key} className="mt-5 font-display text-xl text-ink first:mt-0">
          {renderInline(line.slice(3), key)}
        </h3>,
      );
      return;
    }
    if (line.startsWith("# ")) {
      flushBullets(`ul-${idx}`);
      blocks.push(
        <h3 key={key} className="mt-5 font-display text-2xl text-ink first:mt-0">
          {renderInline(line.slice(2), key)}
        </h3>,
      );
      return;
    }
    if (line.startsWith("> ")) {
      flushBullets(`ul-${idx}`);
      blocks.push(
        <blockquote
          key={key}
          className="my-3 rounded-r-xl border-l-2 border-azure bg-azure/[0.06] px-4 py-3 text-[0.9rem] leading-relaxed text-ink/80"
        >
          {renderInline(line.slice(2), key)}
        </blockquote>,
      );
      return;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      bullets.push(line.slice(2));
      return;
    }
    flushBullets(`ul-${idx}`);
    blocks.push(
      <p key={key} className="text-[0.95rem] leading-relaxed text-ink/80">
        {renderInline(line, key)}
      </p>,
    );
  });

  flushBullets("ul-final");
  return <div className="space-y-1.5">{blocks}</div>;
}
