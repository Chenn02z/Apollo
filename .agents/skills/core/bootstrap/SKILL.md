---
name: bootstrap
description: Bootstraps a fresh fork of the harness into a real product workspace through an adversarial founder interview and durable doc creation. Use when a developer has just forked the repo, the product docs still reflect the harness template, or the project direction is not yet coherent enough for normal requirements work.
---

# Bootstrap Workflow

Use this skill as the first serious action after forking the harness for a new
product. The goal is to turn template scaffolding into a product-specific
backbone before normal milestone and spec work begins.

## Prerequisites

1. `AGENTS.md` (one-time orientation)
2. `README.md` (workspace overview and first-run framing)
3. `docs/WORKFLOWS.md` (handoff interface and status language)
4. `docs/DOCS_POLICY.md` (durable destinations)
5. Current `docs/PRODUCT.md`, `docs/CONTEXT.md`, and `docs/ARCHITECTURE.md`
   (template state to replace)
5. Current `docs/PRODUCT.md`, `docs/CONTEXT.md`, and `docs/ARCHITECTURE.md`
   (template state to replace)

## Workflow

1. Start `$codex-agent-tracer` before substantial work.
2. Inspect whether the repo is still in harness-template state or already has
   downstream product direction.
3. Use `$grilling` to pressure-test vague product language and force
   concrete boundary decisions before docs are written.
4. Delegate repo-state reading to `explorer`.
5. Delegate ambiguity and failure-mode pressure-testing to `spec-griller`.
6. Keep interviewing the developer until the blocking fields are resolved or
   explicitly deferred as non-blocking:
   - target user
   - primary pain
   - promised outcome
   - first platform or surface
   - monetization or business model assumption
   - explicit non-goals
   - hard constraints
   - success metric
   - command and environment expectations known so far
7. **Determine the MVP boundary**: where does the MVP line sit? What must the
   user experience end-to-end in the first deliverable, and what is explicitly
   post-MVP? Use this boundary to decide how many milestones the MVP needs and
   what architectural seams are required.
8. **Derive architecture seams from the MVP boundary**: given what ships now
   and what's deferred, what lightweight boundaries (interfaces, hooks, config
   points) must exist so future features slot in without rewrites? Do NOT
   build speculative frameworks or fully design the whole product.
9. Present a concrete bootstrap summary to the developer and require explicit
   confirmation of:
   - the MVP boundary
   - the ordered MVP milestone ladder
   - the explicit post-MVP cutoff
10. If the answers are still fuzzy or contradictory, or the developer does not
    confirm that summary, stop with a Draft onboarding packet rather than
    pretending the product is ready.
11. Delegate durable doc updates to `doc-curator`:
    - rewrite `README.md` from harness-template copy into a project-specific
      public overview
    - rewrite `docs/PRODUCT.md` for the real product
    - seed `docs/ARCHITECTURE.md` with current structure and approved seams
      derived from the MVP boundary
    - update `docs/CONTEXT.md` with durable terminology only
    - add project-local commands and constraints to `docs/CONTEXT.md` when known
    - build the **MVP milestone ladder**: create as many Draft milestones as
      the MVP needs, in delivery order, from first user-visible deliverable to
      MVP-complete
    - seed **bare future milestones** (post-MVP) under `docs/milestones/` —
      title and one-line goal only. These are directional hints for
      `plan-next`, not commitments
12. Hand the resulting workspace to `$requirements` when additional milestone
    shaping is needed, or directly to `$spec` only when an Accepted milestone
    already exists.

## Blocking Questions

Bootstrap is blocked until the repo can answer, from docs or the user:

- who the product serves
- what pain it solves
- **where the MVP line lives** — what must the user experience end-to-end,
  and what is definitely post-MVP?
- which durable constraints the rest of the workflows must respect
Bootstrap is blocked until the repo can answer, from docs or the user:

- who the product serves
- what pain it solves
- **where the MVP line lives** — what must the user experience end-to-end,
  and what is definitely post-MVP?
- which durable constraints the rest of the workflows must respect

Unknown setup or verification commands are not always blockers, but they must
be written down in `docs/CONTEXT.md` as maturity gaps instead of silently ignored.

Do NOT attempt to fully design the whole product. The MVP milestone ladder is
the concrete deliverable path; bare future milestones are intentionally sparse.
`README.md` remains a public overview; detailed product reasoning belongs in
`docs/PRODUCT.md`.

## Output

Return a handoff artifact using the shared interface in `docs/WORKFLOWS.md`.
Include:

- onboarding status (`Draft` or `Accepted`)
- changed doc paths (including `docs/ARCHITECTURE.md`)
- whether the developer explicitly confirmed the MVP boundary, ordered MVP
  milestone ladder, and explicit post-MVP cutoff before durable writes
- the MVP boundary and derived architecture seams
- settled product decisions
- unresolved blockers
- MVP milestone ladder paths and statuses
- bare future milestone paths
- MVP milestone ladder paths and statuses
- bare future milestone paths
- trace path
- agent routing log, including any manual fallbacks
