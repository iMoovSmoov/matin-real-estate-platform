/* ──────────────────────────────────────────────────────────────────────────
   Coaching Academy — role-play scenario library.
   Each scenario seeds a live AI role-play: the `opening` line is the AI client's
   first line, used to put the model in character before the broker responds.
   Oregon / Portland-metro flavored to match Matin Real Estate's market.
   ────────────────────────────────────────────────────────────────────────── */

export type ScenarioCategory =
  | "Listing Presentation"
  | "Objection Handling"
  | "Buyer Consultation"
  | "Negotiation"
  | "Price Reduction"
  | "FSBO / Expired";

export type ScenarioDifficulty = "Starter" | "Pro" | "Elite";

export interface Scenario {
  id: string;
  title: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  summary: string;
  /** The AI client's opening line that kicks off the role-play. */
  opening: string;
}

export const scenarios: Scenario[] = [
  {
    id: "commission-objection",
    title: "The 1%-Less Competitor",
    category: "Objection Handling",
    difficulty: "Starter",
    summary:
      "A seller in Lake Oswego is shopping agents and got a discount-brokerage quote a full point under your rate.",
    opening:
      "Another agent said they'd charge a full percent less — why should I list my house with Matin and pay more for basically the same thing?",
  },
  {
    id: "fsbo-savings",
    title: "FSBO Who Wants to Save the Commission",
    category: "FSBO / Expired",
    difficulty: "Pro",
    summary:
      "A confident for-sale-by-owner in SE Portland has a sign in the yard and believes Zillow does the rest.",
    opening:
      "I've already got three people interested from the yard sign — honestly, why would I hand you six percent to do what Zillow's already doing for free?",
  },
  {
    id: "expired-listing",
    title: "Burned Expired Listing",
    category: "FSBO / Expired",
    difficulty: "Elite",
    summary:
      "A Beaverton homeowner just came off a 90-day expired listing and is angry at agents in general.",
    opening:
      "Look, I just had my house sit for ninety days with another agent and nothing happened. Why should I trust you when the last one promised the moon too?",
  },
  {
    id: "price-reduction-stubborn",
    title: "Seller Refusing a Price Drop",
    category: "Price Reduction",
    difficulty: "Pro",
    summary:
      "30 days on market in Happy Valley, zero offers, and the seller is emotionally anchored to their list price.",
    opening:
      "We've only been on the market a month — I'm not dropping the price. The buyers just haven't found us yet. Give it more time.",
  },
  {
    id: "price-reduction-emotional",
    title: "The Renovation Sunk-Cost Seller",
    category: "Price Reduction",
    difficulty: "Elite",
    summary:
      "A Tigard seller poured $80k into a remodel and refuses to accept the market won't pay it back dollar-for-dollar.",
    opening:
      "I spent eighty thousand dollars on this kitchen and these floors. There's no way I'm listing for less than I have into it — that's just losing money.",
  },
  {
    id: "listing-presentation-interview",
    title: "Three-Agent Listing Interview",
    category: "Listing Presentation",
    difficulty: "Pro",
    summary:
      "A West Linn seller is interviewing three agents back-to-back and you're second on the schedule.",
    opening:
      "Thanks for coming out. I'm being upfront — I'm talking to two other agents this week too. So, walk me through what makes you different.",
  },
  {
    id: "listing-presentation-overprice",
    title: "Seller Set on Overpricing",
    category: "Listing Presentation",
    difficulty: "Elite",
    summary:
      "Your CMA says $625k in Hillsboro; the seller wants to launch at $699k 'to leave room to negotiate.'",
    opening:
      "I hear what your comps say, but I want to list at six-ninety-nine. We can always come down later — buyers always lowball anyway, right?",
  },
  {
    id: "buyer-consultation-firsttime",
    title: "Nervous First-Time Buyer",
    category: "Buyer Consultation",
    difficulty: "Starter",
    summary:
      "A young couple pre-approved for $450k in Gresham is overwhelmed and afraid of overpaying in a shifting market.",
    opening:
      "Honestly we're a little freaked out. Everyone says prices might drop — are we crazy to buy right now instead of waiting it out?",
  },
  {
    id: "buyer-cold-feet",
    title: "Buyer Cold Feet at the Offer",
    category: "Buyer Consultation",
    difficulty: "Pro",
    summary:
      "Your buyers love a Sellwood bungalow but are freezing the night before you submit the offer.",
    opening:
      "I know we said we loved it, but… it's so much money. Maybe we should sleep on it a few more days before we put in an offer?",
  },
  {
    id: "negotiation-inspection",
    title: "Post-Inspection Repair Standoff",
    category: "Negotiation",
    difficulty: "Pro",
    summary:
      "Inspection turned up a $12k roof issue on a Milwaukie home; the listing agent says the seller won't budge.",
    opening:
      "My seller priced this home fairly and we already have backup interest. They're not fixing the roof and they're not crediting a dime — take it or leave it.",
  },
  {
    id: "negotiation-multiple-offers",
    title: "Multiple-Offer Pressure",
    category: "Negotiation",
    difficulty: "Elite",
    summary:
      "Your buyer is one of five offers on a hot Northeast Portland listing and wants to win without overpaying.",
    opening:
      "I really want this house but I'm not going to throw away forty grand over asking. There are five offers — how do we actually win this without getting destroyed?",
  },
];
