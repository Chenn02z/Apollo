---
name: plan-next
description: Runs after a phase ships to propose the next phase's Draft milestones. Reads completed work, product direction, architecture seams, and backlog to recommend the next concrete increment. Hands Draft milestones to $requirements only.
---

# Plan-Next Workflow

Use this skill manually after a phase is complete (all its milestones are
shipped). Reads everything that's shipped, along with current product
direction and architecture, to propose the next phase.

Does NOT implement code or write specs. Produces Draft milestones only.

## Prerequisites

1. `AGENTS.md` (one-time orientation)
2. `docs/WORKFLOWS.md` (handoff interface)
3. `docs/PRODUCT.md` (product intent, scope, roadmap)
4. `docs/CONTEXT.md` (canonical terminology)
5. `docs/ARCHITECTURE.md` (approved seams and deferred architecture)
6. All completed milestones under `docs/milestones/`
7. Any bare future milestones under `docs/milestones/`

## Workflow

1. Start `$codex-agent-tracer` before substantial work.
2. Delegate repo-state reading to `explorer`. Gather:
   - all completed milestones and their statuses
   - all bare (Draft) future milestones
   - current `docs/PRODUCT.md` direction and roadmap
   - current `docs/ARCHITECTURE.md` seams and deferred entries
3. Assess what has shipped. For each completed milestone in the phase, note:
   - what was delivered (MVP deliverable)
   - what seams were opened or populated
   - what was deferred
4. Use `spec-planner` to propose a **next phase**: how many milestones are
   recommended, at what granularity, and what each delivers.
5. For each milestone in the proposed phase, produce a Draft milestone with:
   - `## Goal`: one-line deliverable summary
   - `## MVP Deliverable`: concrete user-visible outcome
   - `## In Scope`: what's included
   - `## Out Of Scope`: what's intentionally deferred
   - `## Architecture Seams`: boundaries to establish or respect
   - `## Deferred`: what this milestone leaves for later
6. May also prune or reshape bare future milestones based on what has shipped.
   Discarded milestones should be noted in the handoff.
7. Use `spec-griller` to challenge the proposed phase for scope creep,
   ambiguity, and seam consistency.
8. Use `$grill-with-docs` as an adversarial pass.
9. The main agent presents the proposed phase to the developer for approval.
10. Delegate milestone creation to `doc-curator`. Write Draft milestones to
    `docs/milestones/`. Do NOT mark them Accepted.
11. Hand Draft milestones to `$requirements` only. Do NOT hand to `$spec`.

## Blocking Questions

Plan-next is blocked when:
- No completed milestones exist to assess
- `docs/ARCHITECTURE.md` has not been seeded (run bootstrap)
- The developer cannot commit to the proposed phase direction

## Guardrails

- Produce Draft milestones only. `$requirements` owns acceptance.
- Do not rewrite `docs/PRODUCT.md` or `docs/ARCHITECTURE.md` — hand any
  needed changes to `$context`.
- Do not implement code or write specs.
- Bare future milestones are directional hints; reshape freely.
- Each proposed milestone must be user-visible and concrete — reduce breadth,
  not reality.

## Output

Return a handoff artifact using the shared interface in `docs/WORKFLOWS.md`.
Include:

- completed milestones assessed
- proposed phase: recommended milestone count and rationale
- Draft milestone paths created
- bare future milestones reshaped or discarded
- architecture seams to open or populate
- settled decisions and blockers
- trace path
- agent routing log
