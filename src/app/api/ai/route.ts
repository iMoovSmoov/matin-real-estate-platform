import Anthropic from "@anthropic-ai/sdk";
import { SYSTEMS, buildUserMessage, type AiTool } from "@/lib/ai/prompts";
import { fallbackFor } from "@/lib/ai/fallback";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MODEL = process.env.MATIN_AI_MODEL || "claude-opus-4-8";
const EFFORT = process.env.MATIN_AI_EFFORT || "low";

const MAX_TOKENS: Record<AiTool, number> = {
  "ask-matin": 800,
  concierge: 800,
  "lead-responder": 600,
  "listing-description": 800,
  coach: 1200,
  cma: 2500,
  agreement: 2500,
  "marketing-kit": 1400,
  "seller-intel": 1000,
  "contract-extractor": 1400,
  "cash-offer-eval": 900,
};

function textStream(text: string) {
  const encoder = new TextEncoder();
  // simulate streaming so the canned path feels live
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const words = text.split(/(\s+)/);
      for (const w of words) {
        controller.enqueue(encoder.encode(w));
        await new Promise((r) => setTimeout(r, 12));
      }
      controller.close();
    },
  });
}

export async function POST(req: Request) {
  let body: {
    tool?: AiTool;
    input?: Record<string, unknown>;
    messages?: ChatMessage[];
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid request", { status: 400 });
  }

  const tool = (body.tool || "ask-matin") as AiTool;
  const input = body.input || {};
  const incoming = Array.isArray(body.messages) ? body.messages : null;

  const messages: ChatMessage[] = incoming?.length
    ? incoming.slice(-12)
    : [{ role: "user", content: buildUserMessage(tool, input) }];

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content;
  const system = SYSTEMS[tool] || SYSTEMS["ask-matin"];

  const headers = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Accel-Buffering": "no",
  };

  // No key configured → graceful canned fallback (demo never breaks)
  if (!process.env.ANTHROPIC_API_KEY) {
    const text = fallbackFor(tool, input, lastUser);
    return new Response(textStream(text), { headers: { ...headers, "X-Matin-Ai": "fallback" } });
  }

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const mstream = client.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS[tool] ?? 800,
          system,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          output_config: { effort: EFFORT },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        mstream.on("text", (t: string) => controller.enqueue(encoder.encode(t)));
        await mstream.finalMessage();
        controller.close();
      } catch (err) {
        // API failure (bad key, rate limit, refusal) → stream the canned fallback
        console.error("[ai] falling back:", err);
        const text = fallbackFor(tool, input, lastUser);
        for (const chunk of text.split(/(\s+)/)) controller.enqueue(encoder.encode(chunk));
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { ...headers, "X-Matin-Ai": "claude" } });
}
