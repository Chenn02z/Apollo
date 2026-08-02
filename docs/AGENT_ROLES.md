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

The `apollo-designer` agent-routing decision for the `$generate` workflow. It delegates
deck-body composition to the dedicated design agent and does not change the
generic roles above.

- `$generate` delegates deck-body composition of `<run-dir>/deck.html` to the
  dedicated `.codex/agents/apollo/apollo-designer.toml` agent — not a generic
  worker/implementer. No generic worker runs Apollo composition.
- The design agent authors only `<run-dir>/deck.html` within the immutable
  `templates/first-frame.html` for slide 1 (fixed category/topic/commentary, no
  body-safe area) and `templates/frame.html` for slides 2–10 (fixed header,
  footer, rail, rotated `get cracked` label, visual feel, type, colors, and
  body-safe area) and may revise its own `deck.html` from advisory review
  feedback; it does not alter templates.
- The main workflow retains run setup, manifest validation, structural
  validation (`scripts/check-deck.py`), retry orchestration, and PNG export
  (`scripts/export-carousel.mjs`); the design agent does not run those gates.
- This is the only delegation inside `$generate`: one task to one design agent,
  not a multi-agent runtime.

## Apollo Web-Research Agent Routing

Accepted in spec 0006; the agent lives at `.codex/agents/apollo/web-researcher.toml`. The `web-researcher` agent
is planned at `.codex/agents/apollo/web-researcher.toml` as a dedicated agent,
not a generic worker/implementer.

- `web-researcher` determines what is currently tested or interviewed for a
  given category and provides current content grounding for a given topic.
- It is called by `$getcracked` for topic selection and by `$generate` for
  content grounding. Both consume its output as input; neither hands it
  workflow control.
- It supplies research findings only: cited sources, current topics, and
  relevant technical context returned in-session. It prefers primary sources
  (official documentation, papers, specifications, source code) over secondary
  commentary.
- It uses native web search to surface current topics and cited sources; no
  separate search plugin or tool proxy is required.
- It edits no files — not `docs/getcracked-inventory.md`, decks, or templates —
  and its sources are never written under `docs/` or `runs/`.
- It makes no workflow decisions: no topic selection, no dispatch, no status
  transitions, no run-id generation.

## Apollo Orchestration Ownership

Accepted in spec 0006; implemented. `$getcracked` main is the sole
user-facing entry point and owns orchestration directly rather than delegating
it to a generic worker.

- `$getcracked` main owns inventory reads and writes, topic selection,
  per-topic `$generate` dispatch, `metadata.md` writes on success, sequential
  inventory updates, and per-topic failure reporting.
- `$generate` keeps its existing self-contained lifecycle; `$getcracked` does
  not precreate runs or generate run-ids.

## Routing Principles

- Use stronger planning and review agents for ambiguity, scope, and failure
  modes.
- Use cheaper read-only exploration for narrow repo-state questions.
- Keep model/provider choices in agent config or explicit specs.
- Do not use shell scripts as the orchestration brain.
- Preserve user-owned worktree changes. Do not revert unrelated edits.

