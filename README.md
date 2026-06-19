# Matin Real Estate — AI Platform & Command Center

A working build for the **AI Systems & Technology Integrator** role at [Matin Real Estate](https://www.matinrealestate.com/) (West Linn, OR).

It's two things in one app:

1. **An elevated public website** — a redesigned, faster, more premium version of Matin's marketing site, built with their **real brand, real 40-person agent roster, real communities, and real assets**.
2. **The "Matin Command Center"** — the internal platform the role is actually about: structured data, real-time dashboards, AI woven into the CRM, automation, AI contract workflows, and agent coaching.

### 🔗 Live demo → **https://matin-realestate.vercel.app**
### 🧠 Command Center → **https://matin-realestate.vercel.app/command-center**

---

## Built to the job posting — the 6 pillars

| Pillar (their words) | Where to see it |
|---|---|
| **Structured Data Systems** — replace spreadsheets & Google Forms | [`/command-center/forms`](https://matin-realestate.vercel.app/command-center/forms) — branded, editable templates for the real **OREF** forms + structured intake flows |
| **Centralized Dashboard** — real-time reporting | [`/command-center`](https://matin-realestate.vercel.app/command-center) — live KPIs, charts, leaderboard, activity feed |
| **AI Integration** — Claude in the CRM | [`/command-center/crm`](https://matin-realestate.vercel.app/command-center/crm) — one-click **AI-drafted lead replies**, lead scoring, pipeline |
| **Automation** — eliminate busy work | [`/command-center/automations`](https://matin-realestate.vercel.app/command-center/automations) — n8n-style flows (speed-to-lead < 60s, listing launch, nurture…) |
| **Contract Systems** — AI listing & buyer agreements | [`/command-center/contracts`](https://matin-realestate.vercel.app/command-center/contracts) — a 5-step **AI contract builder** with CRM auto-fill + compliance checks |
| **AI Coaching** — contract writing & scenario training | [`/command-center/coaching`](https://matin-realestate.vercel.app/command-center/coaching) — scored role-plays + an AI contract-writing coach |

The **[Playbook](https://matin-realestate.vercel.app/command-center/playbook)** page lays out the strategy, the Oregon forms research, and a competitor benchmark (Dotloop, SkySlope, Follow Up Boss, BoldTrail, Lofty…). See also [`docs/real-estate-systems-playbook.md`](docs/real-estate-systems-playbook.md).

## Highlights

- **A branded, trained AI concierge** ("Ask Matin") docked site-wide — answers buying/selling/neighborhood questions and captures leads. It runs on the same engine as the internal tools.
- **Real Claude (Opus 4.8) streaming** on every AI feature — lead replies, listing descriptions, CMAs, agreements, coaching, the concierge — through a secure serverless route, with a **graceful canned fallback so the demo never breaks** even with no API key.
- **Real Matin assets**: 40 real agents with photos + bios, the West Linn office, real communities, and the recreated **M monogram** logo.
- Public site: home, property search + 32 listing detail pages, agent directory + 40 profiles, 18 community pages, buy, sell (with a **live AI home-value tool**), about, contact, blog.

## What's real vs. demo (honesty matters)

- **Real:** the entire UI, Matin's brand/agents/assets, **live Claude streaming**, the working forms/contract/coaching workflows, client-side CSV/print export.
- **Demo data:** leads, transactions, and metrics are realistic *synthetic* records; integrations show simulated connection state. Wiring the live MLS/CRM/transaction systems is the actual day-one job.

## Tech stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS v4** · Framer Motion · Recharts · lucide-react
- **`@anthropic-ai/sdk`** — Claude streamed from a serverless route (`src/app/api/ai/route.ts`)
- Deployed on **Vercel**

## Run it locally

```bash
npm install
npm run dev      # http://localhost:3000
```

The AI features work out of the box via the built-in fallback. **For live Claude responses**, set an API key:

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
# optional overrides:
# MATIN_AI_MODEL=claude-opus-4-8
# MATIN_AI_EFFORT=low
```

On Vercel, add `ANTHROPIC_API_KEY` under **Project → Settings → Environment Variables** and redeploy.

---

*Portfolio build — not Matin Real Estate's production site.*
