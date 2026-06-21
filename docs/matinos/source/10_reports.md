# 10. Leadership Reports

**Navigation label:** Reports  
**Primary roles:** Leadership, broker, team lead, marketing, admin

## Purpose

Real-time executive reporting for lead funnel, source ROI, agent accountability, listing pipeline, transaction risk, marketing performance, and automation impact.

## Frontend layout

- Top: executive KPI strip and date/team/source filters.
- Sections: Lead Funnel, Source ROI, Agent Accountability, Listings, Transactions, Marketing, Coaching, Automation Impact.
- Right: AI reporting analyst with insight cards and recommended actions.
- Drilldown tables under each chart.

## Frontend component build

Use these reusable components and compose them inside the global app shell:

- `ExecutiveKpiStrip`
- `DateRangeFilter`
- `SourceRoiChart`
- `FunnelChart`
- `AgentLeaderboard`
- `ListingPipelineChart`
- `TransactionRiskTable`
- `MarketingPerformanceTable`
- `AutomationImpactPanel`
- `AIInsightCard`

## User actions

- Filter reports
- Drill into metric
- Export CSV
- Save report snapshot
- Ask AI why metric changed
- Create action item from insight
- Compare sources/agents

## AI functionality

- Explain performance changes
- Find source ROI anomalies
- Suggest budget shifts
- Summarize agent accountability
- Identify bottlenecks
- Generate weekly leadership memo

## Automation workflows

- Nightly metric snapshots
- Weekly AI leadership summary
- Source underperformance alert
- Agent stale leads alert
- Transaction risk rollup

## Backend data objects

- `report_snapshots`
- `metrics_daily`
- `lead_sources`
- `lead_events`
- `appointments`
- `listings`
- `transactions`
- `campaign_events`
- `agent_activity`
- `workflow_runs`
- `ai_actions`
- `coaching_sessions`

## API contracts to implement

- `GET /api/reports/executive`
- `GET /api/reports/source-roi`
- `GET /api/reports/agents`
- `GET /api/reports/automation-impact`
- `POST /api/reports/insights/generate`

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

- Metrics are defined and reproducible
- KPI cards drill into source records
- AI insights cite underlying data points
- CSV export works for major tables
- Leadership can compare date ranges and teams


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
