# Project Workflows

Shared contracts and status language. Per-skill workflow details live in the
individual `SKILL.md` files under `.agents/skills/`.

## Core Model

Specs define truth. Skills define process. Agents execute roles. Model choices
are capacity decisions.

Workflow skills leave explicit handoff artifacts for the next skill.

## Incremental Delivery Model

The harness supports phase-based incremental delivery:

1. `$bootstrap` establishes the MVP boundary, derives architecture seams,
   builds the MVP milestone ladder, presents a concrete summary for explicit
   developer confirmation before durable writes, and rewrites `README.md`
   into a project-specific public overview.
2. Milestones are shaped and accepted through `$requirements`, then turned
   into specs and implemented through `$spec` and `$dev-loop`.
3. When a phase is complete, the developer manually triggers `plan-next` to
   propose the next phase's Draft milestones based on what shipped.
4. `$context` auto-triggers after settled decisions to keep docs, terminology,
   and architecture aligned.
5. Repeat.

## Non-Trivial Work

Use the full workflow for non-trivial product, code, workflow, or context
changes:

1. Bootstrap the workspace when the fork still reflects the harness template.
2. Gather requirements.
3. Draft or update an Accepted milestone when the work is milestone-sized.
4. Create or update specs from Accepted milestones.
5. Grill the spec for ambiguity and missing failure modes.
6. Mark the spec Accepted before implementation.
7. Implement only what the spec requires, respecting architecture seams.
8. Verify and review against the spec.
9. When a phase ships, run `plan-next` to propose the next increment.
10. Update docs and spec status when decisions settle.

Current milestone status: `0001-adaptive-carousel-content` is Verified,
including bounded content review and revision;
`0002-deterministic-fixed-shell-rendering-baseline` is Verified; and
`0003-template-archive-and-carousel-art-direction` is Verified; and
`0004-constrained-slide-composition` remains Draft.

Small documentation or cleanup tasks may skip a formal spec when the user makes
that explicit or when the change is obviously local and reversible.

## Bootstrap Rule

Use `$bootstrap` when a newly forked repo still carries harness-template
product language or has no coherent product backbone yet. Bootstrap establishes
the MVP boundary, derives architecture seams, builds the MVP milestone ladder,
rewrites `README.md` into a project-specific public overview, and seeds bare
future milestones. Before durable docs are written, bootstrap presents a
concrete summary and gets explicit developer confirmation of the MVP boundary,
ordered MVP milestone ladder, and explicit post-MVP cutoff. It may leave a
Draft onboarding packet if blocking product questions remain unresolved.

Do NOT attempt to fully design the whole product during bootstrap. Bare future
milestones are intentionally sparse directional hints.

## Plan-Next Rule

Use `plan-next` manually when a phase is complete (all its milestones are
shipped). Plan-next reads completed milestones, product direction, architecture
seams, and bare future milestones to propose the next phase. It produces Draft
milestones only — `$requirements` owns acceptance.

The main agent should suggest running `plan-next` when a phase boundary is
reached, but does not auto-trigger it.

## Handoff Artifact Interface

Every non-trivial project workflow handoff must include these shared fields:

- producer skill
- intended consumer skill
- artifact path or packet contents
- status
- settled decisions
- unresolved blockers
- docs, specs, or milestones the next skill must read
- agent routing log
- trace path

For each required agent gate, the routing log says one of:

- used
- unavailable; manual fallback approved
- not applicable for this scoped pass

The `.agent-trace/<workflow-id>/` folder is the canonical evidence log. The
handoff artifact is the canonical summary and should include the trace path plus
any missing-event risks from the tracer's audit pass.

## Agent Routing Log

Any non-trivial workflow using a project workflow skill should include an agent
routing log in its final handoff.

A required subagent named by the selected skill is a gate, not a suggestion.
If the agent is skipped, the final handoff should say whether the workflow
remains Draft, blocked, or approved for manual fallback.

## Spec Status Contract

`docs/WORKFLOWS.md` is the canonical source for spec and milestone status
language.

Status values:

- `Draft`: requirements are still being shaped.
- `Accepted`: for specs, implementation can start; for milestones, spec
  authoring can start but implementation is not authorized.
- `Implemented`: code or docs have been changed but final verification may
  remain.
- `Verified`: acceptance criteria have passed or documented exceptions exist.

Header status, downstream handoff status, and skill output status must agree.
Do not leave a spec header at `Implemented` while a handoff still says
`Accepted`, or vice versa.

When a spec is ready for implementation, `spec` should leave an explicit
handoff for `dev-loop` using the shared handoff artifact interface.
