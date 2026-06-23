/**
 * Ask Matin concierge — open bus.
 *
 * The floating <AskMatin /> concierge owns its own open/closed state, but the
 * design puts an "Ask Matin" call-to-action in the site header (and pages may
 * reuse it too). Rather than lift that state into a provider, any client
 * component can call `openAskMatin()` to pop the concierge open; <AskMatin />
 * listens for this event. Keeps the concierge self-contained and unbreakable.
 */
export const ASK_MATIN_OPEN_EVENT = "matin:open-concierge";

/** Open the floating Ask Matin concierge from anywhere on the client. */
export function openAskMatin() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ASK_MATIN_OPEN_EVENT));
}
