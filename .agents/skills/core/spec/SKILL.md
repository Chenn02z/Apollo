---
name: spec
description: Converts Accepted milestone contracts into implementation specs under docs/specs. Reject Draft or non-Accepted milestones; do not update milestone contracts.
---

# Spec Workflow

Use when an Accepted milestone needs one or more executable implementation
specs under `docs/specs/`. Consume Accepted milestone contracts from
`$requirements`. Reject Draft, blocked, or non-Accepted milestones.

## Prerequisites

1. `AGENTS.md` (one-time orientation)
2. `docs/WORKFLOWS.md` (handoff interface and spec status contract)
3. `docs/ARCHITECTURE.md` (approved seams and deferred architecture)
4. The Accepted milestone under `docs/milestones/`

## Spec Template

```md
# Spec: Title

## Status
Draft

## Goal

## Scenario

## Architecture Reference

## In Scope

## Out Of Scope

## Architecture Seams

## Contracts

## Failure Modes

## Acceptance Criteria

## Verification

## Open Questions
```

## Workflow

1. Start `$codex-agent-tracer` before substantial work.
2. Use `explorer` if repo state is unclear. Confirm the milestone is `Accepted`.
3. Reference `docs/ARCHITECTURE.md` to populate `## Architecture Reference`
   and `## Architecture Seams` in each spec. Every spec must declare which
   seams it touches and what it must honor.
4. Use `spec-planner` to draft or revise specs from the Accepted milestone.
5. For multi-spec milestones: name child spec paths and Draft or Accepted targets.
6. Use `spec-griller` before marking any spec Accepted. The griller must
   verify seam compliance against `docs/ARCHITECTURE.md`.
7. If code reveals the milestone is wrong, hand back to `$requirements`.
8. If the spec settles context changes, hand off to `$context`.
9. Leave an explicit handoff artifact for `$dev-loop` when ready.

## Required Agent Gates

1. `spec-planner` must draft or revise the spec.
2. `spec-griller` must review before Accepted, including seam compliance.

## Output

Return a handoff artifact. Include the source milestone path, created or
revised spec path, architecture seams referenced, key contracts and acceptance
criteria, settled decisions, open questions, trace path, and verification
expectations.
