export type AiRequest = {
  tool: string;
  input?: Record<string, unknown>;
  messages?: { role: "user" | "assistant"; content: string }[];
};

/** POST to /api/ai and stream the plain-text response token-by-token. */
export async function streamAi(
  req: AiRequest,
  onToken: (chunk: string, full: string) => void,
): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
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
