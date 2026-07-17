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

Only these development-workflow agents should edit files, and only when the
main workflow calls for it.

## Runtime Writers

- `carousel-writer`: writes only its delegated
  `runs/<run-id>/carousel-content.json` initial artifact or
  `runs/<run-id>/carousel-content.candidate.json` rewrite candidate during the
  `apollo-generate` runtime stage.
- `carousel-reviewer`: writes only its delegated
  `runs/<run-id>/carousel-review-<n>.json` artifact after `apollo-generate`
  validates content, where `<n>` is 1 through 3.
- `carousel-art-director`: writes only its delegated
  `runs/<run-id>/carousel-layout.json` artifact, exactly once; it does not
  write HTML, change content, retry, or repair.
- `carousel-composer` (planned): writes only delegated
  `runs/<run-id>/slide-bodies/<nn>.html` body fragments; it does not change
  content, templates, shell chrome, CSS, or export artifacts.

Write-capable subagents must have disjoint file ownership. Use one
`implementer` at a time unless an Accepted spec explicitly decomposes disjoint
write scopes. `doc-curator` may edit docs and skill or agent rules when
`context` calls for surgical updates.

## Routing Principles

- Use stronger planning and review agents for ambiguity, scope, and failure
  modes.
- Use cheaper read-only exploration for narrow repo-state questions.
- Keep model/provider choices in agent config or explicit specs.
- Do not use shell scripts as the orchestration brain.
- Preserve user-owned worktree changes. Do not revert unrelated edits.
