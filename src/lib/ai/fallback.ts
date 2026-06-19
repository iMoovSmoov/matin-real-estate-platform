import type { AiTool } from "./prompts";
import { company } from "@/lib/data";

const phone = company.phone;

/** High-quality canned responses used when no ANTHROPIC_API_KEY is configured,
 *  so the live demo always works. Lightly templated from the input. */
export function fallbackFor(
  tool: AiTool,
  input: Record<string, unknown>,
  lastUserMessage?: string,
): string {
  const s = (v: unknown, d = "") => (v == null || v === "" ? d : String(v));

  switch (tool) {
    case "ask-matin":
    case "concierge": {
      const msg = (lastUserMessage || "").toLowerCase();
      if (/sell|valuation|worth|list my/.test(msg))
        return `Great — selling with Matin starts with a free, no-pressure home valuation. We'll pull live comps for your neighborhood, recommend a pricing strategy, and you'll also have the option of a guaranteed cash offer through Cash Is King if you want speed and certainty. Want me to have a listing specialist prepare your valuation? Drop your name, email, or the best number and I'll set it up.`;
      if (/buy|home|house|listing|tour|see/.test(msg))
        return `Happy to help you buy! Matin agents do free buyer consults, on-demand showings, and sharp data-driven offers in this market. Which area are you focused on — West Linn, Lake Oswego, Portland, or somewhere else — and what's your price range and timeline? I can line up matching homes and connect you with the right broker.`;
      if (/agent|broker|talk|call|contact|reach/.test(msg))
        return `Absolutely — I can connect you with one of our ${"40"}+ brokers. What's the best name and email or phone, and are you looking to buy, sell, or both? You can also reach the office anytime at ${phone}.`;
      if (/finance|mortgage|loan|pre-?approv|afford/.test(msg))
        return `Smart to start with financing. We'll connect you with trusted local lenders for a fast pre-approval, then build a budget that keeps your offers competitive. Want me to send our mortgage calculator and a pre-approval intro? Share your email and I'll get it over.`;
      return `Thanks for reaching out to ${company.name}! I can help with buying, selling, neighborhoods, financing, or connecting you with the right broker. What are you working on — and what area are you focused on? You can also call us at ${phone}.`;
    }

    case "lead-responder":
      return `Hi ${s(input.name, "there")} — thanks for reaching out about ${s(input.area, "the area")}! I pulled a few options that fit your ${s(
        input.budget,
        "budget",
      )} range and ${s(input.timeline, "timeline")}. A couple just hit that aren't getting the attention they deserve yet, so there's room to negotiate. Are you free for a quick 10-minute call tomorrow morning or early afternoon? I'll have a tailored list ready and can set up tours this week. Either way, I'm here whenever you're ready.\n\n— The Matin Real Estate Team · ${phone}`;

    case "listing-description":
      return `Welcome to ${s(input.address, "this exceptional home")} in ${s(
        input.city,
        "one of the area's most-wanted enclaves",
      )} — where ${s(input.beds, "spacious")}-bedroom comfort meets elevated Pacific Northwest design. Light pours through walls of glass into an open great room that flows effortlessly to the outdoors, while the chef's kitchen anchors a main level built for both quiet mornings and unforgettable gatherings. The primary retreat delivers a spa-style bath and generous closet, and every detail — ${s(
        input.features,
        "designer finishes throughout",
      )} — has been thoughtfully considered. Minutes to top schools, parks, and dining, this is a rare offering in a market that rewards the decisive. Come see why this one won't last. Offered at ${s(input.price, "an exceptional value")}.`;

    case "coach":
      return `Good — let's run it. I'll play the on-the-fence seller:\n\n"We love your marketing, but another agent said they'd list us 3% higher. Why should we go with Matin?"\n\nYour move. Remember: don't defend the number — reframe to net proceeds, days-on-market risk, and our data. Hit me with your response and I'll coach the delivery.`;

    case "cma":
      return `## Pricing Opinion — ${s(input.address, "Subject Property")}\n\n**Suggested list range:** strong demand in ${s(
        input.city,
        "this market",
      )} supports a competitive list with room for multiple offers. Price to invite activity in the first 10 days rather than chase the market down.\n\n**Comparable signals**\n- Recent nearby sales are closing at or above list with short days-on-market.\n- Updated kitchens/baths and outdoor living are commanding premiums.\n- Inventory remains tight in this price band.\n\n**Market posture:** seller-favorable but price-sensitive — overpricing stalls; sharp pricing wins.\n\n**Recommendation:** list strategically, launch with pro media + a coordinated first-week push, and leverage the Matin buyer database. _(Connect ANTHROPIC_API_KEY for a fully AI-generated, comp-specific CMA.)_`;

    case "agreement":
      return `## ${s(input.docType, "Representation Agreement")} — Draft Summary\n\n**Parties:** ${s(
        input.party,
        "[Client]",
      )} and ${company.name}.\n\n**Scope & Term:** Engagement for ${s(input.property, "[property/area]")} for a term of ${s(
        input.term,
        "[term]",
      )}.\n\n**Compensation:** ${s(input.price, "[price]")} / ${s(input.commission, "[commission]")} as agreed.\n\n**Key Clauses:** duties of the broker, exclusivity, agency disclosures, dispute resolution, and termination rights.\n\n**Special Terms:** ${s(input.special, "None specified.")}\n\n> ⚠️ Drafting aid only — not legal advice. Final agreement must be reviewed by a Matin principal broker on the current Oregon REALTORS® forms before signature. _(Connect ANTHROPIC_API_KEY for full AI-drafted clause language.)_`;

    default:
      return `Thanks — connect an ANTHROPIC_API_KEY to enable live AI responses. ${phone}`;
  }
}
