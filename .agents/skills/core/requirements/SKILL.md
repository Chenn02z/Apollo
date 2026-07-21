---
name: requirements
description: Produces requirements packets and Accepted milestone contracts for product work. Use when gathering requirements, clarifying product direction, deciding scope, or accepting milestone direction before spec creates implementation contracts.
---

# Requirements Workflow

Use before writing implementation specs when the request is still ambiguous or
when milestone direction must be accepted before spec work starts.

Accepts Draft milestones from `$bootstrap` or `plan-next`.

## Prerequisites

1. `AGENTS.md` (one-time orientation)
2. `docs/WORKFLOWS.md` (handoff interface)
3. `docs/ARCHITECTURE.md` (approved seams and deferred architecture)

## Workflow

1. Start `$codex-agent-tracer` before substantial work.
2. Resolve the request: milestone contract and acceptance, requirements packet,
   context decision, or implementation request needing a spec first.
3. Reference `docs/ARCHITECTURE.md` to ensure milestone scope respects
   approved seams and doesn't introduce conflicting deferred work.
4. Use `$grilling` to pressure-test direction.
5. Use `spec-planner` for scope, scenarios, and acceptance criteria candidates.
6. Use `spec-griller` to challenge ambiguity, failure modes, and scope creep.
7. The main agent settles decisions with the user.
8. For milestone work: use `doc-curator` to write or update the milestone under
   `docs/milestones/`. Only mark `Accepted` after all blocking questions resolve.
   Include an `## MVP Deliverable` describing the concrete user-visible outcome.
9. If scope, terms, or boundaries change, hand off to `$context`.
10. Hand Accepted milestones to `$spec` for spec creation.

## Blocking Questions

Blocking questions must be answered by the repo or the user before milestone
acceptance. If unanswered, return Draft or blocked, not Accepted. Deferred
questions may remain only when explicitly listed as non-blocking and assigned
to child specs or later milestones.

When accepting a milestone from `plan-next`, resolve any deferred items into
concrete scope or explicit non-blocking deferrals. Cross-check deferred items
against `docs/ARCHITECTURE.md`.

## Output

Return a handoff artifact using the shared interface in `docs/WORKFLOWS.md`.
Include the resolved workflow, proposed spec path, milestone path and status,
scope boundary, MVP deliverable, scenarios, acceptance criteria candidates,
settled decisions, trace path, and blocking questions.
