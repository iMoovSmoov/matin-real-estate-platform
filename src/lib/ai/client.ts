export type AiRequest = {
  tool: string;
  input?: Record<string, unknown>;
  messages?: { role: "user" | "assistant"; content: string }[];
};

/** Whether a response came from a real model ("live") or the grounded canned
 *  sample fallback ("sample"). Surfaced from the `X-Matin-Ai-Mode` header so the
 *  UI can show a "Matin AI · sample" pill without blocking on the key. */
export type AiMode = "live" | "sample";

/** Optional metadata callback signature (3rd arg of {@link streamAi}). */
export type AiMetaCallback = (meta: { mode: AiMode; provider: string }) => void;

/** Last observed AI mode, for components that read it lazily instead of via the
 *  per-call callback. Defaults to "sample" until a request resolves. */
let lastAiMode: AiMode = "sample";
/** Read the mode of the most recent {@link streamAi} response. */
export function getLastAiMode(): AiMode {
  return lastAiMode;
}

/**
 * POST to /api/ai and stream the plain-text response token-by-token.
 *
 * Contract is unchanged for existing callers: `streamAi(req, onToken)` resolves
 * to the full string. The optional third `onMeta` callback receives live-vs-
 * sample mode (read from the `X-Matin-Ai-Mode` header) so a UI can render a
 * "Matin AI · sample" pill — passing it is never required.
 */
export async function streamAi(
  req: AiRequest,
  onToken: (chunk: string, full: string) => void,
  onMeta?: AiMetaCallback,
): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  // Live-vs-sample signal (header set by the route; defaults to "sample").
  const mode: AiMode = res.headers.get("X-Matin-Ai-Mode") === "live" ? "live" : "sample";
  const provider = res.headers.get("X-Matin-Ai") || "fallback";
  lastAiMode = mode;
  onMeta?.({ mode, provider });

  if (!res.ok || !res.body) {
    const msg = "Sorry — something went wrong. Please call us at (503) 622-9624.";
    onToken(msg, msg);
    return msg;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onToken(chunk, full);
  }
  return full;
}
