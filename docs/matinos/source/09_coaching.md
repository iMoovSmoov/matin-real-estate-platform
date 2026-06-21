# 09. AI Coaching & Scenario Training

**Navigation label:** Coaching  
**Primary roles:** Agent, broker, team lead, trainer, leadership

## Purpose

Use AI roleplay and scorecards to train agents on real estate conversations and tie coaching assignments to CRM performance gaps.

## Frontend layout

- Left: scenario library and assigned training.
- Center: chat/voice roleplay transcript.
- Right: scorecard, feedback, suggested phrasing, manager notes, next coaching tasks.
- Top: agent performance context and coaching goal.

## Frontend component build

Use these reusable components and compose them inside the global app shell:

- `ScenarioLibrary`
- `RoleplayChat`
- `VoiceTranscriptPanel`
- `Scorecard`
- `RubricBreakdown`
- `SuggestedPhrasing`
- `ManagerReviewPanel`
- `TrainingAssignmentList`
- `PerformanceGapCard`

## User actions

- Start roleplay
- Choose scenario
- Submit response
- Review score
- Assign coaching
- Manager comments
- Create follow-up training task
- Compare attempts

## AI functionality

- Play buyer/seller persona
- Escalate objections
- Score response
- Suggest stronger phrasing
- Generate coaching plan
- Connect training to CRM weakness

## Automation workflows

- Low appointment conversion → recommend appointment-closing scenario
- Manager assigns training → agent sees task in Today
- Completed scenario → score stored and reported

## Backend data objects

- `coaching_scenarios`
- `coaching_sessions`
- `roleplay_messages`
- `scorecards`
- `scorecard_rubrics`
- `coaching_tasks`
- `manager_reviews`
- `agent_goals`
- `crm_performance_metrics`

## API contracts to implement

- `GET /api/coaching/scenarios`
- `POST /api/coaching/sessions`
- `POST /api/coaching/sessions/:id/messages`
- `POST /api/coaching/sessions/:id/score`
- `POST /api/coaching/tasks`

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

- AI roleplay follows selected persona and objection style
- Scorecard is rubric-based
- Manager can review attempts
- Coaching tasks appear in Today
- Reports show coaching completion/performance trend


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
