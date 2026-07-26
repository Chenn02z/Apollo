# Project Agent Roles

Project-scoped Codex agents live under `.codex/agents/`.

The main agent owns judgment, reconciliation across subagent outputs, user
interaction, and final reporting. Skills are the workflow layer;
`.codex/agents/*.toml` are the concrete subagent presets those workflows invoke.

If a selected skill instructs the main agent to use a named project agent role,
that skill instruction authorizes using that role as a scoped subagent for the
task, subject to system, tool, and sandbox limits.

## Read-Only Agents

- `spec-planner`: planner for requirements, milestones, specs, and acceptance
  criteria.
- `spec-griller`: reviewer for ambiguity, failure modes, scope creep, and weak
  contracts.
- `explorer`: cheap read-only repo explorer for current state and patterns.
- `reviewer`: read-only diff and spec reviewer.

Read-only subagents may run in parallel when their questions are independent.

## Write-Capable Agents

- `implementer`: write-capable worker for accepted specs.
- `test-runner`: targeted verification worker.
- `doc-curator`: documentation maintainer.

Only `implementer`, `test-runner`, and `doc-curator` should edit files, and
only when the main workflow calls for it.

Write-capable subagents must have disjoint file ownership. Use one
`implementer` at a time unless an Accepted spec explicitly decomposes disjoint
write scopes. `doc-curator` may edit docs and skill or agent rules when
`context` calls for surgical updates.

## Apollo Design-Agent Routing

The `apollo-designer` agent-routing decision for the `$apollo` workflow. It delegates
deck-body composition to the dedicated design agent and does not change the
generic roles above.

- `$apollo` delegates deck-body composition of `runs/<run-id>/deck.html` to the
  dedicated `.codex/agents/apollo/apollo-designer.toml` agent — not a generic
  worker/implementer. No generic worker runs Apollo composition.
- The design agent authors only `runs/<run-id>/deck.html` within the immutable
  `templates/first-frame.html` for slide 1 (fixed category/topic/commentary, no
  body-safe area) and `templates/frame.html` for slides 2–10 (fixed header,
  footer, rail, rotated `get cracked` label, visual feel, type, colors, and
  body-safe area) and may revise its own `deck.html` from advisory review
  feedback; it does not alter templates.
- The main workflow retains run setup, manifest validation, structural
  validation (`scripts/check-deck.py`), retry orchestration, and PNG export
  (`scripts/export-carousel.mjs`); the design agent does not run those gates.
- This is the only Apollo delegation: one task to one design agent, not a
  multi-agent runtime.

## Routing Principles

- Use stronger planning and review agents for ambiguity, scope, and failure
  modes.
- Use cheaper read-only exploration for narrow repo-state questions.
- Keep model/provider choices in agent config or explicit specs.
- Do not use shell scripts as the orchestration brain.
- Preserve user-owned worktree changes. Do not revert unrelated edits.

