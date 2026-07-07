# Documentation Policy

This document defines where durable project information belongs.

## Canonical Destinations

- `README.md`: public overview.
- `user-journeys.html`: human-facing map of first-run paths and current product
  capabilities.
- `docs/PRODUCT.md`: product intent, audience, scope, principles, and roadmap.
- `docs/ARCHITECTURE.md`: current code structure, approved seams, and deferred
  architecture. Seeded by bootstrap, updated by context. Lightweight — no
  speculative blueprints or unused frameworks.
- `docs/CONTEXT.md`: canonical terminology and workflow boundaries.
- `docs/WORKFLOWS.md`: skill workflow rules and handoff expectations.
- `docs/AGENT_ROLES.md`: subagent roles, edit permissions, and routing
  principles.
- `docs/DOCS_POLICY.md`: documentation destinations and status rules.
- `docs/specs/`: implementation-ready contracts.
- `docs/milestones/`: larger deliverable slices.
- `docs/techdebt/`: durable architecture and tech-debt candidate tickets.
- `.agents/skills/`: reusable Codex workflows.
- `.codex/agents/`: project-scoped role, model, and permission presets.
- `.agent-trace/`: local generated trace logs for workflow audit. Do not commit
  by default; include only trace paths and summaries in durable handoffs unless
  a spec explicitly requires preserving a sanitized trace.

## Spec And Milestone Docs

Use `docs/specs/` for executable contracts with goal, scope, contracts, failure
modes, acceptance criteria, verification, and open questions. `spec` creates or
updates these contracts from Accepted milestones.

Use `docs/milestones/` for larger deliverable slices that may produce or group
multiple specs. `requirements` owns milestone drafting, blocker resolution, and
milestone acceptance.

Use `docs/techdebt/` for durable candidate tickets that come out of accepted
architecture or workflow reviews. Keep one markdown file per candidate.

Tech-debt ticket status describes candidate disposition; it does not replace
spec or milestone status under `docs/WORKFLOWS.md`.

- `proposed`: captured from a review and not yet settled through follow-up work.
- `accepted`: the repo has accepted the direction, but implementation still
  needs a spec, a dev-loop pass, or both.
- `implemented`: the accepted recommendation has been completed.
- `rejected`: the candidate was documented, reviewed, and intentionally not
  pursued.

Use `docs/adr/NNNN-slug.md` only for durable, hard-to-reverse decisions with
real trade-offs. Do not create an ADR for ordinary cleanup, obvious routing, or
small reversible documentation changes.

## Context Maintenance

Use `context` to update docs when a term, boundary, workflow, product decision,
role definition, or agent/skill usage becomes settled. Context is auto-triggered
by AGENTS.md after settled decisions and may also be invoked by skill handoffs.

Keep implementation details out of `docs/CONTEXT.md`. Put executable behavior
in specs, product direction in `docs/PRODUCT.md`, architecture in
`docs/ARCHITECTURE.md`, and operating workflow detail in `docs/WORKFLOWS.md`.

For downstream forks, keep the harness-wide operating contract in `AGENTS.md`
and add project-local commands, constraints, and environment notes surgically
rather than replacing the whole file by default.

## Documentation Changes

- Keep changes surgical and tied to the current spec or explicit task.
- Prefer repo docs over general assumptions.
- Do not batch unrelated terminology changes.
- Preserve handoff artifacts when one skill expects another skill to continue.
- Report missing commands or missing tooling as repo maturity gaps.
