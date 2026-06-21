# 03. Seller / Cash Offer Opportunity Desk

**Navigation label:** Seller / Cash Offers  
**Primary roles:** Agent, ISA, broker, leadership, marketing

## Purpose

Mine the database and website activity for likely sellers, then manage seller/cash-offer opportunities from signal to listing won.

## Frontend layout

- Top: seller pipeline KPIs, high-equity signals, home-value requests, cash-offer requests, appointments set, listings won.
- Center: kanban pipeline from Signal Detected to Listing Won/Lost.
- Right: opportunity drawer with property estimate, signal explanation, owner profile, outreach history, AI recommended next action.
- Filter bar by source, ZIP, price band, signal type, agent, age, score.

## Frontend component build

Use these reusable components and compose them inside the global app shell:

- `SellerPipelineKanban`
- `OpportunityCard`
- `SellerSignalBadge`
- `PropertyValuePanel`
- `EquityEstimatePanel`
- `SignalExplanation`
- `OutreachHistory`
- `AISellerActionCard`
- `AppointmentScheduler`

## User actions

- Assign opportunity
- Create appointment
- Draft seller outreach
- Send market report
- Create listing launch record
- Mark lost/nurture
- Add property note
- Request CMA

## AI functionality

- Explain seller score
- Draft seller call script
- Draft cash-offer response
- Suggest next nurture campaign
- Generate seller report summary
- Detect stale high-intent seller

## Automation workflows

- Home value request → seller opportunity + score + assignment + task + AI draft
- Cash offer request → high-priority alert + appointment task
- Past client owns home 5+ years and opens report → seller signal created

## Backend data objects

- `seller_opportunities`
- `cash_offer_requests`
- `seller_signals`
- `contacts`
- `properties`
- `valuations`
- `appointments`
- `campaign_enrollments`
- `tasks`
- `lead_events`
- `ai_actions`

## API contracts to implement

- `GET /api/seller-opportunities`
- `POST /api/seller-opportunities/:id/stage`
- `POST /api/seller-opportunities/:id/appointment`
- `POST /api/seller-opportunities/:id/convert-listing`
- `POST /api/seller-opportunities/:id/ai/draft-outreach`

## Required states

- Empty state: explain what this module does and provide the first action.
- Loading state: skeleton rows/cards that preserve layout stability.
- Error state: human-readable error, retry button, and Systems Health link when relevant.
- Permission state: explain access limitation without exposing restricted data.
- Audit state: every status-changing action writes an activity/audit event.

## Backend implementation notes

- Use server-side authorization on every endpoint, not just hidden UI buttons.
- Write module-specific activity events so the record timeline stays complete.
- Keep computed status fields reproducible from underlying records where possible.
- Store external IDs and raw integration references for future sync/debugging.
- Use optimistic UI only for reversible actions; wait for server confirmation for legal/compliance/send actions.

## Acceptance criteria

- Each seller score has visible reasons
- Pipeline cards show next action and blocker
- Creating listing preserves contact/property relationship
- Lost reasons are reportable
- Cash-offer requests bypass normal priority


## Shared UI rules

- Keep one global shell: fixed left sidebar, top command bar, content workspace, optional right drawer.
- Use the same table, kanban, timeline, drawer, AI card, and approval components everywhere.
- Every record should have a visible status, owner, next action, due date, last activity, and source.
- Avoid weak dashboard-only design. Each screen should let the user do work immediately.
- Put AI inside workflows, not as a random chatbot. AI should summarize, draft, validate, score, explain, and create proposed actions.
- Every AI output should have a source record, confidence/quality signal, approval state, and audit trail.
- Human approval is required for client-facing messages, legal documents, broker/compliance changes, and irreversible workflow changes.

## Shared backend rules

- Everything important is a record.
- Everything that happens becomes an `activity_event`.
- All automation runs write to `workflow_runs` and `workflow_steps`.
- All AI actions write to `ai_actions` with model, prompt version, input refs, output, approval status, and cost estimate.
- All admin/system changes write to `audit_logs`.
- External systems are hidden behind integration adapters so the frontend never depends directly on vendor payload shapes.
- Use idempotency keys for webhook-driven automations to avoid duplicate contacts/tasks/doc packets.
