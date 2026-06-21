# Workflow implementation runbook

## Workflow engine expectations

Every workflow should support:

- Trigger event.
- Subject record type and ID.
- Idempotency key.
- Step logs.
- Retry policy.
- Human approval state.
- Systems Health detail view.
- Activity events on affected records.

## Workflow run status values

```txt
queued
running
waiting_for_approval
succeeded
failed
cancelled
skipped
partially_succeeded
```

## Step status values

```txt
pending
running
succeeded
failed
skipped
waiting_for_human
```

## Retry policy

- External API timeout: retry 3 times with exponential backoff.
- Validation failure: do not retry; create data quality issue.
- Missing field mapping: do not retry until mapping fixed.
- AI output schema invalid: retry once with repair prompt, then create AI review issue.
- Permission/approval blocked: mark waiting_for_approval.

## Example workflow receipt shown in UI

```txt
Workflow: New IDX Lead Intake
Subject: Sarah Mitchell
Trigger: Website lead created
Status: Waiting for human approval

Step 1 Verify webhook: success
Step 2 Normalize payload: success
Step 3 Dedupe contact: matched existing by email
Step 4 Score lead: buyer 82, seller 43
Step 5 Route: assigned to Jordan Matin by territory rule
Step 6 Draft intro text: success, waiting approval
```
