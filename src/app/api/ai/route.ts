import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import { SYSTEMS, buildUserMessage, type AiTool } from "@/lib/ai/prompts";
import { fallbackFor } from "@/lib/ai/fallback";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

const ANTHROPIC_MODEL = process.env.MATIN_AI_MODEL || "claude-haiku-4-5-20251001";
const GROQ_MODEL = process.env.MATIN_GROQ_MODEL || "llama-3.3-70b-versatile";

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
  "form-suggest": 400,
  "doc-generate": 800,
  "doc-ai-complete": 300,
  "buyer-agreement-summary": 400,
  task_coach: 200,
  sms_draft: 80,
  lead_reply: 150,
  deal_brief: 200,
  appt_prep: 250,
  general: 600,
  report_agent_coach: 200,
  integration_setup_guide: 400,
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

  const encoder = new TextEncoder();

  // ── Groq (free tier — preferred when GROQ_API_KEY set) ─────────────────────
  if (process.env.GROQ_API_KEY) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const completion = await groq.chat.completions.create({
            model: GROQ_MODEL,
            max_tokens: MAX_TOKENS[tool] ?? 800,
            messages: [
              { role: "system", content: system },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
            ],
            stream: true,
          });
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          console.error("[ai/groq] falling back:", err);
          const text = fallbackFor(tool, input, lastUser);
          for (const chunk of text.split(/(\s+)/)) controller.enqueue(encoder.encode(chunk));
          controller.close();
        }
      },
    });
    return new Response(stream, { headers: { ...headers, "X-Matin-Ai": "groq" } });
  }

  // ── Anthropic (when ANTHROPIC_API_KEY set) ──────────────────────────────────
  if (process.env.ANTHROPIC_API_KEY) {
    const client = new Anthropic();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const mstream = client.messages.stream({
            model: ANTHROPIC_MODEL,
            max_tokens: MAX_TOKENS[tool] ?? 800,
            system,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          });
          mstream.on("text", (t: string) => controller.enqueue(encoder.encode(t)));
          await mstream.finalMessage();
          controller.close();
        } catch (err) {
          console.error("[ai/anthropic] falling back:", err);
          const text = fallbackFor(tool, input, lastUser);
          for (const chunk of text.split(/(\s+)/)) controller.enqueue(encoder.encode(chunk));
          controller.close();
        }
      },
    });
    return new Response(stream, { headers: { ...headers, "X-Matin-Ai": "claude" } });
  }

  // ── No key configured → canned fallback (demo never breaks) ────────────────
  const text = fallbackFor(tool, input, lastUser);
  return new Response(textStream(text), { headers: { ...headers, "X-Matin-Ai": "fallback" } });
}
