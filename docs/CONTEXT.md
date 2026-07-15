# Workspace Context

Canonical terminology and workflow boundaries. Keep implementation details out.

## Canonical Terms

- `workspace`: this repo and its docs, skills, specs, and agent presets.
- `developer`: the human using this repo for specs-driven agentic work.
- `main agent`: the Codex thread owning judgment, delegation, reconciliation,
  user interaction, and final reporting.
- `subagent`: a delegated Codex development agent with a narrow role, model,
  reasoning, and permission profile.
- `skill`: a reusable workflow under `.agents/skills/`.
- `agent preset`: a `.codex/agents/*.toml` role/model/permission default.
- `requirements packet`: pre-spec output of `$requirements` with resolved
- `requirements packet`: pre-spec output of `$requirements` with resolved
  workflow, proposed spec path, scope, scenarios, criteria, and blockers.
- `Accepted milestone`: a `docs/milestones/` contract with all blocking
  questions resolved. Eligible for `$spec`; does not authorize implementation
  questions resolved. Eligible for `$spec`; does not authorize implementation
  without an Accepted child spec.
- `handoff artifact`: explicit producer-to-consumer artifact naming the
  producing skill, intended consumer, path, status, decisions, blockers, and
  agent routing log.
- `spec`: executable contract under `docs/specs/` with goal, scope, contracts,
  failure modes, acceptance criteria, verification, and open questions.
- `milestone`: larger deliverable slice under `docs/milestones/`.
- `phase`: a group of related milestones delivered together as a coherent
  increment. `plan-next` runs at phase boundaries.
- `MVP boundary`: the line between what ships in the first real product loop
  and what is post-MVP. Drives architecture seams.
- `MVP milestone ladder`: the ordered set of milestones needed to reach the
  MVP boundary, from first user-visible deliverable to MVP-complete.
- `MVP deliverable`: concrete user-visible outcome a milestone produces.
- `architecture doc`: `docs/ARCHITECTURE.md` — current structure, approved
  seams, and deferred architecture.
- `approved seam`: a lightweight boundary in the code (interface, hook, config
  entry point) that exists now so a future feature can be added without
  rewrites. Listed in ARCHITECTURE.md.
- `deferred architecture`: features or structural changes intentionally left
  for later milestones, with an optional seam left open.
- `plan-next`: phase-level replanning skill triggered manually after a phase
  ships.
- `phase`: a group of related milestones delivered together as a coherent
  increment. `plan-next` runs at phase boundaries.
- `MVP boundary`: the line between what ships in the first real product loop
  and what is post-MVP. Drives architecture seams.
- `MVP milestone ladder`: the ordered set of milestones needed to reach the
  MVP boundary, from first user-visible deliverable to MVP-complete.
- `MVP deliverable`: concrete user-visible outcome a milestone produces.
- `architecture doc`: `docs/ARCHITECTURE.md` — current structure, approved
  seams, and deferred architecture.
- `approved seam`: a lightweight boundary in the code (interface, hook, config
  entry point) that exists now so a future feature can be added without
  rewrites. Listed in ARCHITECTURE.md.
- `deferred architecture`: features or structural changes intentionally left
  for later milestones, with an optional seam left open.
- `plan-next`: phase-level replanning skill triggered manually after a phase
  ships.
- `requirement gathering`: vague intent to requirements packet or Accepted
  milestone.
- `bootstrap`: first-run workflow that interrogates the developer, derives
  architecture seams from the MVP boundary, tailors `README.md` into a
  project-specific public overview, and requires explicit developer
  confirmation before durable bootstrap writes. The detailed confirmation
  contract lives in `docs/WORKFLOWS.md`.
- `spec grilling`: adversarial review before implementation.
- `dev loop`: Accepted spec to verified, reviewed diff.
- `context maintenance`: keeping docs, specs, skills, and agents aligned after
  decisions settle. Auto-triggered by AGENTS.md after settled decisions.
  decisions settle. Auto-triggered by AGENTS.md after settled decisions.
- `trace`: workflow evidence under `.agent-trace/<workflow-id>/`.

## Reference Documents

- `AGENTS.md`: Codex orientation and operating contract.
- `docs/PRODUCT.md`: product intent, scope, principles, and roadmap.
- `docs/ARCHITECTURE.md`: current structure, approved seams, and deferred
  architecture.
- `docs/ARCHITECTURE.md`: current structure, approved seams, and deferred
  architecture.
- `docs/WORKFLOWS.md`: handoff interface and status contract.
- `docs/AGENT_ROLES.md`: subagent roles, permissions, and routing principles.
- `docs/DOCS_POLICY.md`: documentation destinations and status rules.

## Workflow Boundaries

- Bootstrap: first serious workflow after forking when the repo still reflects
  the harness template. It sets the MVP boundary, initial seams, and startup
  docs, with explicit confirmation required before durable bootstrap writes.
  The detailed bootstrap contract remains canonical in `docs/WORKFLOWS.md`.
- Plan-next: triggered manually when a phase ships. Proposes the next phase
  with recommended milestone count and Draft milestones. Hands to
  `$requirements` only.
- Requirements: accepts Draft milestones from bootstrap or plan-next. Produces
  Accepted milestone contracts and requirements packets. References
  `docs/ARCHITECTURE.md`.
- Specs: produces executable contracts under `docs/specs/` from Accepted
  milestones only. References `docs/ARCHITECTURE.md` for seam compliance.
- Dev loop: implements from Accepted spec only. Checks architecture seams
  before implementation. MVP-path planning belongs to bootstrap and
  requirements, not dev-loop.
  milestones only. References `docs/ARCHITECTURE.md` for seam compliance.
- Dev loop: implements from Accepted spec only. Checks architecture seams
  before implementation. MVP-path planning belongs to bootstrap and
  requirements, not dev-loop.
- Review: compares the diff to the spec; it is not open-ended redesign.
- Context maintenance: auto-triggered by AGENTS.md after settled decisions.
  Also invoked by skill handoffs.
- `grill-with-docs`: pressure-tests against docs including ARCHITECTURE.md.
- Context maintenance: auto-triggered by AGENTS.md after settled decisions.
  Also invoked by skill handoffs.
- `grill-with-docs`: pressure-tests against docs including ARCHITECTURE.md.
- Read-only subagents may run in parallel if independent. Write-capable
  subagents need disjoint file ownership.
- Bash scripts may run repeatable checks, not own agent routing.

## Idle Triage

When no explicit developer task is active and the workspace has Accepted
milestones without child specs, or Draft milestones that are unblocked, the
main agent should ask which milestone or spec should advance next and surface
the next-action candidates with their status and blockers.

When a phase is complete (all its milestones are completed), the main agent
should suggest running `plan-next`.

When a phase is complete (all its milestones are completed), the main agent
should suggest running `plan-next`.

Accepted milestones with no spec are the highest-priority idle candidates.
Draft milestones with resolved dependencies follow.

## Open Questions

- What trace retention policy is appropriate for this repo?
