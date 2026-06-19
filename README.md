# Matin Real Estate — Website + Matin Hub

A working build for the **AI Systems & Technology Integrator** role at [Matin Real Estate](https://www.matinrealestate.com/) (West Linn, OR).

Two things in one app, built on Matin's **real brand, real 40-person agent roster, real communities, and real assets**:

1. **An elevated public website** — a faster, more premium take on Matin's marketing site (home, search, 32 listing pages, 40 agent profiles, 18 communities, buy, sell, blog, contact) plus an animated **Cash Is King** cash-offer page for their home-buying arm.
2. **The "Matin Hub"** — the internal platform the role is about: structured data, real-time dashboards, AI woven into the CRM, automation, AI contract workflows, and agent coaching.

### 🔗 Live site → **https://matin-realestate.vercel.app**
### 🧠 Matin Hub → **https://matin-realestate.vercel.app/hub**

---

## What it covers (straight from the posting)

| Capability | Where to see it |
|---|---|
| **Structured data** — replace spreadsheets & Google Forms | [`/hub/forms`](https://matin-realestate.vercel.app/hub/forms) — branded, editable templates for the real **OREF** forms + structured intake flows |
| **Centralized dashboard** — real-time reporting | [`/hub`](https://matin-realestate.vercel.app/hub) — live KPIs, charts, leaderboard, activity feed, working notifications |
| **AI in the CRM** | [`/hub/crm`](https://matin-realestate.vercel.app/hub/crm) — scored leads, table ⇄ pipeline, one-click **AI-drafted replies** |
| **Automation** | [`/hub/automations`](https://matin-realestate.vercel.app/hub/automations) — business-outcome workflows (speed-to-lead < 60s, listing launch, nurture…) |
| **Contract systems** | [`/hub/contracts`](https://matin-realestate.vercel.app/hub/contracts) — a 5-step **AI contract builder** with CRM auto-fill + Oregon compliance checks |
| **AI coaching** | [`/hub/coaching`](https://matin-realestate.vercel.app/hub/coaching) — scored scenario role-plays + a contract-writing coach |

## Highlights

- **A branded AI concierge** ("Ask Matin") docked site-wide, trained on Matin's info — answers buying/selling/neighborhood questions and captures leads.
- **Live, streaming AI** on every tool — lead replies, listing copy, CMAs, agreements, coaching — through a secure serverless route, with a graceful fallback so the demo always works even with no API key.
- **Real Matin assets**: 40 real agents (photos + bios), the West Linn office, real communities, and a recreated **M-monogram** logo. Built to fit the wider **Matin network** (PortlandRealEstate.com, PortlandLuxuryRealEstate.com, Oregon/WashingtonRealEstate.com).
- **Premium "monochrome-luxe" design** — warm charcoal, ivory, and a restrained brass accent, grounded in Matin's real brand.

## What's real vs. demo

- **Real:** the entire UI, Matin's brand/agents/assets, **live streaming AI**, the working forms/contract/coaching workflows, client-side CSV/print export.
- **Demo data:** leads, transactions, and metrics are realistic *synthetic* records; integrations show a simulated connection state. Wiring the live MLS/CRM/transaction systems is the actual day-one job.

## Tech stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS v4** · Framer Motion · Recharts · lucide-react
- AI via **`@anthropic-ai/sdk`** (Claude) streamed from `src/app/api/ai/route.ts`
- Deployed on **Vercel**

## Run it locally

```bash
npm install
npm run dev      # http://localhost:3000
```

AI works out of the box via the built-in fallback. For live model responses, add an API key:

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
# optional: MATIN_AI_MODEL=claude-opus-4-8   MATIN_AI_EFFORT=low
```

On Vercel, add `ANTHROPIC_API_KEY` under **Project → Settings → Environment Variables** and redeploy.

---

*Portfolio build for the AI Systems & Technology Integrator role — not Matin's production site.*
