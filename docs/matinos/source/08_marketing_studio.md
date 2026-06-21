# 08. Marketing Studio

**Navigation label:** Marketing Studio  
**Primary roles:** Marketing, agent, listing coordinator, leadership

## Purpose

Turn listing/client/campaign records into branded Matin marketing assets and track campaign performance back into CRM and reports.

## Frontend layout

- Top: campaign/listing selector and brand kit state.
- Tabs: Email, Social, Ads, Flyer, Video Script, Open House Kit, Seller Report.
- Center: editable asset preview.
- Right: AI producer, approval workflow, schedule state, performance snapshot.

## Frontend component build

Use these reusable components and compose them inside the global app shell:

- `CampaignSelector`
- `AssetTypeTabs`
- `AssetEditor`
- `VisualPreviewCard`
- `AIProducerPanel`
- `BrandVoiceSelector`
- `ApprovalQueue`
- `SchedulePanel`
- `PerformanceMiniChart`
- `AssetVersionHistory`

## User actions

- Generate launch kit
- Edit copy
- Approve asset
- Schedule campaign
- Duplicate version
- Export/download
- Send seller update
- View performance

## AI functionality

- Generate listing description
- Generate email blast
- Generate social captions
- Generate ad copy
- Generate flyer headline
- Generate video script
- Generate open house talking points
- Generate neighborhood blurb

## Automation workflows

- Listing ready → create marketing kit draft
- Asset approved → schedule or export
- Campaign events → sync opens/clicks/leads to CRM and reports
- Low performance → AI suggests copy/test changes

## Backend data objects

- `marketing_templates`
- `marketing_assets`
- `campaigns`
- `campaign_channels`
- `campaign_events`
- `brand_kits`
- `listings`
- `properties`
- `contacts`
- `audiences`
- `approval_requests`
- `ai_actions`
- `activity_events`

## API contracts to implement

- `GET /api/campaigns`
- `POST /api/campaigns`
- `POST /api/campaigns/:id/generate-assets`
- `POST /api/marketing-assets/:id/approve`
- `POST /api/campaigns/:id/schedule`

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

- One listing can generate 10+ asset drafts
- Assets show approval and version state
- Brand kit is applied to every output
- Performance metrics connect to source ROI
- Seller-facing messages require approval


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
