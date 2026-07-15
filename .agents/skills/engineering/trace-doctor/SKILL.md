---
name: trace-doctor
description: Audits .agent-trace execution traces from the main workflow skills to surface delegation failures, completeness gaps, and harness friction, then produces a prioritized improvement report and cleanup recommendation.
---

# Trace Doctor

Ingest main-workflow traces under `.agent-trace/`, run cross-trace analysis,
produce a concrete improvement report naming target files and suggested
changes, then prompt before deleting analyzed trace folders.

This is a main-agent skill. The orchestrator owns ingestion, analysis,
judgment, and reporting. Use `explorer` for bulk `.agent-trace/` reads only
when trace volume justifies delegation. Use `implementer` to write the report.
Do not modify skills, agents, or config during analysis. Produce
recommendations only.

## Scope

Only main workflow traces: folders whose name contains `dev-loop`, `spec`,
`requirements`, or `context`. Skip standalone review passes, `grill-with-docs`
traces, and `test` traces unless the user explicitly widens scope.

## Workflow

### 1. Ingest

Walk `.agent-trace/`. For every in-scope folder with a `trace.jsonl`:

- workflow type
- event count, first event kind, and last event kind
- whether `trace_start` is first and `trace_end` is last
- every `agent_delegation` to `delegate_result` pair
- every `missing_event` entry
- `context_read` count
- every `contradiction_found` and `recommendation` entry

Also flag orphan folders and in-progress traces.

See [ANALYSIS-PATTERNS.md](ANALYSIS-PATTERNS.md) for the pattern catalog.

### 2. Analyze

Group findings into:

- completeness violations
- delegation failures
- orchestrator bloat
- workflow fragmentation
- agent gate gaps

### 3. Report

Write to `docs/techdebt/trace-doctor-<timestamp>.md`. Follow
[REPORT-TEMPLATE.md](REPORT-TEMPLATE.md). Include a summary line, per-trace
table, cross-trace patterns, and 2 to 4 actionable recommendations.

### 4. Cleanup

After the user reviews the report, list the folders that would be deleted and
ask for confirmation before deleting them.

## Guardrails

- Never auto-delete.
- Preserve in-progress traces by default.
- Do not modify skills, agents, or `AGENTS.md` during analysis.
- If `explorer` or `implementer` are unavailable, the main agent may perform
  reads and writes directly because this meta-workflow is self-diagnostic.

