---
name: grill-with-docs
description: Pressure-test workspace plans, specs, milestones, and terminology against README, AGENTS.md, product docs, context docs, architecture doc, and current repo state.
---

# Grill With Docs

Use this skill when a plan, spec, milestone, or terminology decision needs
pressure-testing against the repo's documented intent and current files.

Prefer `$spec` for writing specs and `$requirements` for shaping vague ideas.
Use this skill as a focused adversarial review pass.

This is a support skill, not the owner of a workflow. `$requirements`, `$spec`,
and `$context` may use it to challenge proposed requirements packets, formal
specs, milestone changes, and context updates against the repo's documented
boundaries.

## Read First

1. `AGENTS.md`
2. `README.md`
3. `docs/PRODUCT.md`
4. `docs/CONTEXT.md`
5. `docs/ARCHITECTURE.md`
6. `docs/WORKFLOWS.md`
7. Relevant files under `docs/specs/` or `docs/milestones/`
8. Touched code or skill files, if any

## Workflow

1. Start `$codex-agent-tracer` before substantial work.
2. Resolve the user's actual goal in workspace terms.
3. Read the repo before asking anything the repo can answer.
4. Challenge fuzzy, overloaded, or conflicting terms immediately.
5. Use concrete developer workflows to force boundary decisions.
6. Separate settled decisions from open questions.
7. Recommend the smallest doc or spec update that removes ambiguity.
8. Create an ADR only when the decision is hard to reverse, surprising, and a
   real trade-off.

## Review Targets

- `docs/CONTEXT.md` for canonical terminology and workflow boundaries
- `docs/PRODUCT.md` for product intent, scope, and roadmap
- `docs/ARCHITECTURE.md` for approved seams and deferred architecture
- `docs/WORKFLOWS.md` for workflow rules and handoff expectations
- `docs/AGENT_ROLES.md` for subagent roles, edit permissions, and routing
- `docs/DOCS_POLICY.md` for documentation destinations and status rules
- `docs/specs/` for executable contracts
- `docs/milestones/` for larger deliverable slices
- `docs/adr/NNNN-slug.md` for durable architecture decisions

## Output Discipline

- Lead with contradictions, missing decisions, and scope risks.
- Challenge specs that violate `docs/ARCHITECTURE.md` seams or silently
  introduce conflicting deferred work.
- Keep findings grounded in file references where possible.
- Do not write implementation details into `docs/CONTEXT.md`.
- Do not batch unrelated terminology changes.
- Include the trace path in the output.
