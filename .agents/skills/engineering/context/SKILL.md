---
name: context
description: Keeps repo context aligned across AGENTS.md, README, durable docs, specs, skills, and agents. Use whenever terminology, workflow boundaries, project direction, or agent and skill setup changes.
---

# Context Workflow

Use when settled work changes terminology, workflow boundaries, product
direction, role definitions, or agent and skill usage.

Auto-triggered by `AGENTS.md` after any milestone is marked completed, any
spec is marked Verified, any architecture seam is opened or closed, or any
settled terminology decision emerges from a workflow.

## Prerequisites

1. `AGENTS.md` (one-time orientation)
2. The handoff artifact that triggered the context update

## Canonical Files

- `README.md`, `AGENTS.md`
- `user-journeys.html`
- `docs/PRODUCT.md`, `docs/CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/WORKFLOWS.md`
- `docs/AGENT_ROLES.md`, `docs/DOCS_POLICY.md`
- `docs/specs/`, `docs/milestones/`
- `.agents/skills/`, `.codex/agents/`

## Workflow

1. Start `$codex-agent-tracer` before substantial work.
2. Use `explorer` to inspect current docs, skills, and `user-journeys.html`.
3. Use `doc-curator` for surgical updates to context docs, `README.md`,
   `user-journeys.html`, `docs/ARCHITECTURE.md`, and skill or agent rules.
   When architecture seams are opened or closed, update
   `docs/ARCHITECTURE.md` accordingly. When workflow paths or skill names
   change, update `user-journeys.html` to reflect the current journey map.
4. Apply a pruning audit across skills and agents:
   - skills should avoid duplicated terminology and should reference canonical docs
   - agent instructions should avoid unnecessary full-doc-stack pre-reads
   - traces should be kept local unless a spec says otherwise
   - cross-references and paths should remain live
5. Use `spec-griller` when changes affect scope, terminology, or workflow.
6. Use `$grill-with-docs` as an adversarial pass.
7. Keep implementation details out of `docs/CONTEXT.md`.

## Output

Return a handoff artifact using the shared interface in `docs/WORKFLOWS.md`.
Include changed docs, settled terms and decisions, removed contradictions,
architecture seams opened or closed, trace path, before and after size summary
when pruning occurred, and any follow-up updates needed.
