# Milestone: Get Cracked Inventory And Orchestration

## Status

Accepted

## Status Notes

- **Accepted by user:** the developer settled the decisions below directly in
  requirements. Spec authoring may start; implementation is not yet authorized.
- **Renames the deck workflow:** `$apollo` becomes `$generate`. Prior review
  milestones shift one slot: content review is now 0007, visual review is now
  0008.
- **Amended after acceptance — reconciled to the settled direction:** earlier
  post-acceptance text described a two-slot slide 1, two `$getcracked`
  subcommands, and main-precreated runs. All three are withdrawn. The settled
  direction is: slide 1 keeps `[CATEGORY]`, `[TOPIC]`, and `[COMMENTARY]`
  unchanged; `$getcracked` is the sole user-facing invocation
  (`$getcracked give me N topics for <category>`) and orchestrates research,
  selection, inventory writes, and per-topic dispatch internally; `$generate` is
  a pure rename of the existing `$apollo` behavior and still owns its own run-id
  and `runs/<run-id>/` creation. A dedicated `web-researcher` agent supplies
  findings-only, in-session research to both topic selection and content
  grounding.
- **Amended after acceptance — settled review findings:** `$generate` delegates
  deck-body composition directly to `apollo-designer`; `$getcracked` serializes
  inventory writes; `$generate` workflows are dispatched onto the runtime queue
  with no lower artificial cap and never through `codex exec`; inventory seeding
  names four exact existing run IDs and excludes
  `run-b0472ccc-825f-418b-9ee5-19df1dcb4653`; the deck skill's path and
  invocation name both become `generate`.

## Goal

Turn Apollo from a one-topic-at-a-time deck command into a small content
operation with a durable backlog. Today every deck is produced by invoking
`$apollo` on one topic, and nothing in the repo records what has been made,
what is worth making next, or which topic a given `runs/<run-id>/` folder
belongs to. Run folders are UUID-named and opaque.

This milestone introduces `$getcracked` as the sole user-facing entry point over
a checked-in inventory of topics, renames the deck-producing workflow to
`$generate`, and makes each generated run self-describing. One invocation names
a category and a count; `$getcracked` researches, selects, records, and
dispatches internally, so the developer states intent once instead of driving
each stage by hand.

## MVP Deliverable

The developer can run `$getcracked give me N topics for <category>` and get N
researched, normalized-unique topics recorded as `planned` in
`docs/getcracked-inventory.md`, one deck generated per topic, and each
successful topic flipped to `generated` with a run link and a
`runs/<run-id>/metadata.md`.

Verifiable success criteria:

- `$apollo` no longer exists as an invocation and `.agents/skills/apollo/` no
  longer exists as a path. The skill lives at `.agents/skills/generate/SKILL.md`
  and `$generate` is the only name for the deck-authoring workflow. No alias,
  shim, or deprecation path is kept.
- `$getcracked give me N topics for <category>` is the only invocation the
  developer makes. There is no separate research subcommand, no separate
  generate subcommand, and no user-facing `$research`; `$generate` is not
  invoked directly by the developer in this flow.
- `$getcracked` invokes the `web-researcher` agent to determine what is
  currently tested or interviewed in the named category, then selects exactly N
  teachable topics from those findings and appends them as `planned` under that
  one category.
- Selected topics are de-duplicated by normalized topic name against existing
  entries in that category; a collision produces a replacement candidate so the
  recorded count is always exactly N.
- Name normalization is lowercase, trimmed, internal whitespace collapsed to
  single spaces, and ASCII punctuation stripped. Articles are retained as part
  of the name.
- Research sources are shown in-session with their citations and are not written
  to any file; nothing under `docs/` or `runs/` persists a source list.
- `$getcracked` dispatches exactly one `$generate` workflow per selected topic
  onto the runtime's own queue, with no cap below whatever concurrency the
  runtime already allows. Dispatch never uses `codex exec`.
- `$generate` is a rename of the current Apollo deck behavior with no behavioral
  change: it generates its own run-id, creates `runs/<run-id>/`, reads both
  frame templates, reads and validates the manifest, delegates deck-body
  composition directly to `apollo-designer` with no intermediate generic worker,
  runs structural validation, runs PNG export, and retries up to 3 total
  attempts on validation or export failure. `$getcracked` never precreates runs
  or generates run-ids.
- `$generate` may consume `web-researcher` findings to ground current content
  for its topic; the agent supplies findings only and makes no workflow
  decision.
- Slide 1 keeps its three authored slots — `[CATEGORY]`, `[TOPIC]`, and
  `[COMMENTARY]` — unchanged. No change is made to
  `templates/first-frame.html`, the `apollo-designer` slide-1 authoring
  contract, structural validation, or slide-1 tests.
- On a per-topic success only, `$getcracked` writes `runs/<run-id>/metadata.md`
  with the deck title and a 1–2 sentence description, and updates that topic's
  inventory entry to `generated` with a link to the run. `$getcracked`
  serializes every inventory write, so concurrent workflow completions never
  interleave edits to `docs/getcracked-inventory.md`.
- On a per-topic failure, the topic stays `planned`, no `metadata.md` is written
  for it, the failure is reported to the developer, and the other requested
  topics still complete.
- `docs/getcracked-inventory.md` exists with exactly seven categories: DSA,
  System Design, Software Design, Java & Backend Development, Databases, AI
  Engineering, Deep Learning.
- Each inventory entry carries exactly three fields: topic name, status
  (`planned`, `generated`, or `reviewed`), and a link to its run. No other
  per-entry fields.
- The inventory is seeded with exactly four `generated` AI Engineering entries,
  each linked to its existing run:
  - LLM Inference Optimization → `runs/run-029566d4-241f-41d1-9b2b-c24bd6fd9d64/`
  - KV Cache → `runs/run-a3f90c9e-efe0-4f47-8aab-7f29a0f030f5/`
  - AI Agent Tool Use → `runs/run-d03e198c-95bc-421d-9b05-1e8b98bda127/`
  - LLM Evaluation → `runs/run-dde474cc-b81f-40ce-bc2d-993556b7953b/`
  The Apollo slide-template test run,
  `runs/run-b0472ccc-825f-418b-9ee5-19df1dcb4653/`, is excluded.
- `reviewed` is reached only by the developer manually editing the inventory.
  Nothing in the workflow sets or checks `reviewed`.

## Developer Workflow

Requirements → spec authoring for the `$getcracked` orchestration and inventory
contract, then implementation through `$spec` and `$dev-loop`.

## Decisions

- `$apollo` is renamed to `$generate`, in both skill path
  (`.agents/skills/apollo/` → `.agents/skills/generate/`) and invocation name.
  There is no alias and no backwards compatibility path.
- `$getcracked` is the sole user-facing orchestration skill, invoked as
  `$getcracked give me N topics for <category>`. It has no subcommands. Research,
  selection, inventory recording, and per-topic dispatch all happen internally
  inside that one invocation.
- A dedicated `web-researcher` agent, configured at
  `.codex/agents/apollo/web-researcher.toml`, supplies research findings only. It
  serves both `$getcracked` topic selection and `$generate` content grounding,
  edits no files, and makes no workflow decision.
- Research prefers primary sources (official documentation, papers,
  specifications, source code) over secondary commentary.
- `$getcracked` selects exactly the requested count of teachable topics, always
  under the single category named in the invocation. It does not create
  categories and does not spread topics across categories.
- De-duplication is by normalized topic name against the existing inventory, and
  a collision produces a replacement candidate so the count stays exact.
- Normalization is lowercase, trim, collapse internal whitespace to single
  spaces, and strip ASCII punctuation. Articles are retained.
- Research findings and their citations are shown in-session only. Sources are
  never stored.
- The run lifecycle stays inside `$generate`: it generates its own run-id and
  creates `runs/<run-id>/`. `$getcracked` never precreates runs.
- `$getcracked` dispatches one `$generate` workflow per selected topic onto the
  runtime's queue. The workflow adds no cap below the runtime's own concurrency
  limit, and dispatch never uses `codex exec`.
- `$generate` is a rename of the current `$apollo` behavior with nothing else
  changed: it owns run setup, deck authoring, validation, export, and retries,
  and delegates deck-body composition directly to `apollo-designer`; no generic
  worker sits between `$generate` and the design agent.
- Slide 1 is unchanged and keeps all three authored slots: `[CATEGORY]`,
  `[TOPIC]`, and `[COMMENTARY]`.
- `metadata.md` is written by `$getcracked`, only after that topic's run
  succeeds, and contains a title plus a 1–2 sentence description.
- `$getcracked` serializes all inventory writes so parallel workflow completions
  cannot interleave edits to `docs/getcracked-inventory.md`.
- Inventory status is `planned` → `generated` by the workflow; `reviewed` is a
  manual developer edit.
- Failures are per-topic and non-blocking: a failed topic remains `planned` and
  is reported, while other topics proceed.
- The inventory lives at `docs/getcracked-inventory.md` with the seven fixed
  categories listed in the MVP deliverable.

## In Scope

- Rename the `$apollo` skill to `$generate`, including its directory path
  (`.agents/skills/apollo/` → `.agents/skills/generate/`), its invocation name,
  and the references that name it.
- Add the `$getcracked` main skill as the sole user-facing entry point, invoked
  as `$getcracked give me N topics for <category>`, covering internal research,
  topic selection, inventory recording, and per-topic dispatch.
- Add the dedicated `web-researcher` agent at
  `.codex/agents/apollo/web-researcher.toml`, consumed by `$getcracked` for
  topic selection and by `$generate` for content grounding.
- Per-topic dispatch from `$getcracked` to one `$generate` workflow, queued by
  the runtime, not capped lower by the workflow, and never via `codex exec`.
- `$getcracked`-written `runs/<run-id>/metadata.md` (title + 1–2 sentence
  description) on per-topic success.
- Serialized inventory writes in `$getcracked`.
- Create `docs/getcracked-inventory.md` with the seven fixed categories and the
  three-field entry shape.
- Seed the four existing AI Engineering runs as `generated` entries linked to
  their runs, by exact run ID: LLM Inference Optimization
  (`run-029566d4-241f-41d1-9b2b-c24bd6fd9d64`), KV Cache
  (`run-a3f90c9e-efe0-4f47-8aab-7f29a0f030f5`), AI Agent Tool Use
  (`run-d03e198c-95bc-421d-9b05-1e8b98bda127`), and LLM Evaluation
  (`run-dde474cc-b81f-40ce-bc2d-993556b7953b`). The fifth existing run,
  `run-b0472ccc-825f-418b-9ee5-19df1dcb4653` (titled `Apollo slide template`),
  is a template test run and is not listed.
- Per-topic failure reporting that leaves the topic `planned` and does not block
  sibling topics.

## Out Of Scope

- A website, publishing surface, accounts, or any hosted view of the inventory.
- Scheduling, automation, or any unattended trigger of research or generation.
- Priority, difficulty, ordering, dates, tags, or any inventory field beyond
  topic name, status, and run link.
- New categories beyond the seven fixed ones, and any workflow that creates
  categories.
- Persisting research sources to disk in any form.
- Any change to `$generate`'s existing behavior, including run-id generation,
  `runs/<run-id>/` creation, authoring, validation, export, and the 3-attempt
  retry behavior. The rename is the only change to that workflow.
- Any change to `templates/first-frame.html`, `templates/frame.html`,
  `templates/manifest.json`, `scripts/check-deck.py`,
  `scripts/export-carousel.mjs`, or the slide-1 tests.
- Any change to slide 1, including removing or altering `[COMMENTARY]`, adding
  slots, re-layout, or restyling.
- Any user-facing subcommand, additional invocation, or direct developer
  invocation of `$generate` or a research command within this flow.
- Any automatic use of `reviewed`; review remains manual inventory editing.
- Backfilling metadata or inventory entries for the excluded Apollo
  slide-template test run.
- Content-review revisions and reports (0007) and visual-review revisions and
  reports (0008).

## Architecture Seams

- **New orchestration boundary above Seam 1:** `$getcracked` main owns topic
  selection, the inventory (`docs/getcracked-inventory.md`), per-topic dispatch,
  and per-run `metadata.md`. It never reads, writes, or reasons about templates,
  deck HTML, the structural validator, or the exporter, and it does not own the
  run lifecycle. Inventory writes are serialized in main, which is the single
  writer for `docs/getcracked-inventory.md`.
- **New research boundary alongside orchestration:** the `web-researcher` agent
  supplies in-session findings to both `$getcracked` (topic selection) and
  `$generate` (content grounding). It edits no files and makes no workflow
  decision, so neither caller hands control to it.
- **Seam 1 (topic → deck HTML)** stays owned by `$generate` and
  `apollo-designer`, unchanged. `$generate` still generates its own run-id,
  creates `runs/<run-id>/`, and delegates deck-body composition directly to
  `apollo-designer`. The authoring contract is untouched: slide 1 keeps
  category, topic, and commentary.
- **Seam 2 (HTML → validation/PNG export)** is unchanged. Structural validation
  and PNG export remain the only hard gates and stay inside the per-topic
  `$generate` workflow.
- The orchestrator/workflow split is what makes multi-topic generation possible
  without duplicating the deck pipeline: adding topics adds `$generate`
  workflows, not new pipeline code.

## Specs

- Proposed: `docs/specs/0006-getcracked-inventory-and-orchestration.md`

## Acceptance Criteria

- `$generate` produces a validated, exported deck with its existing behavior
  intact, including its own run-id and `runs/<run-id>/` creation; `$apollo` is
  gone from the skill surface and the skill lives at
  `.agents/skills/generate/SKILL.md`.
- A freshly generated deck's slide 1 still renders category, topic, and
  commentary, and `templates/first-frame.html`, the `apollo-designer` contract,
  `scripts/check-deck.py`, and the slide-1 tests are unmodified.
- `$getcracked give me N topics for <category>` is the only invocation needed:
  it shows the `web-researcher` findings with citations in-session, writes no
  source list anywhere, and leaves exactly N new, name-normalized-unique
  `planned` entries under that category in `docs/getcracked-inventory.md`.
- Two topic names that differ only by case, surrounding or repeated whitespace,
  or ASCII punctuation are treated as the same name, while two names differing
  only by an article are treated as distinct.
- The same invocation dispatches one `$generate` workflow per selected topic
  with no `codex exec`, and on success flips each topic to `generated` with a
  run link and a `runs/<run-id>/metadata.md` containing a title and a 1–2
  sentence description. Concurrent completions produce a well-formed inventory
  with every entry updated exactly once.
- A deliberately failing topic in a multi-topic run is reported, stays
  `planned`, has no `metadata.md`, and does not prevent sibling topics from
  completing.
- `docs/getcracked-inventory.md` shows the seven fixed categories and the four
  seeded AI Engineering entries as `generated` with run links, and does not list
  `run-b0472ccc-825f-418b-9ee5-19df1dcb4653`.

## Verification

- One manual invocation of `$getcracked give me N topics for <category>` with N
  of at least two; confirm the in-session cited findings, no stored sources,
  exactly N new planned entries, normalized-name de-duplication with
  replacement against a pre-existing entry, one `$generate` workflow per topic,
  each workflow creating its own run directory, `metadata.md` contents, and
  inventory transitions to `generated`.
- Confirm no separate research or generate subcommand is required or exposed,
  and that no dispatch path shells out to `codex exec`.
- One forced-failure topic alongside a healthy topic; confirm per-topic isolation
  and that the failed topic stays `planned`.
- Inspect `docs/getcracked-inventory.md` after the multi-topic run; confirm no
  interleaved or partial writes.
- `tests/test_frame_template.py`, `tests/test_check_deck.py`, and
  `tests/test_manifest.py` pass unchanged, with no slide-1 test modifications.
- Grep confirms `[COMMENTARY]` still exists in `templates/first-frame.html` and
  the `apollo-designer` contract.
- Confirm no existing run artifacts under `runs/` were modified.

## Deferred

- Any hosted or generated view of the inventory (website, feed, export).
- Scheduling or unattended runs of research or generation.
- Richer inventory fields (priority, difficulty, dates, tags, ordering).
- Additional categories beyond the seven fixed ones.
- Durable storage or citation archiving of research sources.
- Automating the `reviewed` transition or tying it to content/visual review
  (0007 / 0008).
- Retroactive metadata for pre-existing runs beyond the four seeded entries.
- Any slide-1 redesign, including revisiting the `[COMMENTARY]` slot.

## Open Questions

None blocking. The spec may settle the exact inventory markdown table shape, the
exact `metadata.md` field layout, the research findings' in-session presentation
format, the per-topic failure report wording, how `$getcracked` parses the count
and category out of the natural-language request, and the serialization
mechanism for inventory writes.

## Handoff

- producer skill: `$requirements`
- intended consumer skill: `$spec`
- artifact path: `docs/milestones/0006-getcracked-inventory-and-orchestration.md`
- status: `Accepted`
- settled decisions: see **Decisions** above — `$apollo` renames to `$generate`
  in both skill path and invocation name, with no alias, and `$generate`'s
  existing behavior is otherwise unchanged, including its own run-id and
  `runs/<run-id>/` creation, deck authoring, validation, export, retries, and
  direct delegation of deck-body composition to `apollo-designer`;
  `$getcracked give me N topics for <category>` is the sole user-facing
  invocation and has no subcommands, orchestrating research, selection,
  inventory recording, and per-topic dispatch internally; a dedicated
  `web-researcher` agent at `.codex/agents/apollo/web-researcher.toml` supplies
  primary-source-first, findings-only, in-session research to both topic
  selection and content grounding, with no stored sources and no workflow
  decisions; selection adds exactly N normalized-unique planned topics under one
  fixed category, normalizing by lowercase, trim, whitespace collapse, and ASCII
  punctuation strip while retaining articles, and replacing collisions to keep
  the count exact; `$getcracked` writes `metadata.md` on per-topic success,
  serializes inventory writes, and dispatches one `$generate` workflow per topic
  onto the runtime queue with no lower artificial cap and never via
  `codex exec`; slide 1 is unchanged and keeps `[CATEGORY]`, `[TOPIC]`, and
  `[COMMENTARY]`, with no template, designer-contract, validator, or test
  changes; failures stay `planned`, are reported, and do not block siblings; the
  inventory is `docs/getcracked-inventory.md` with seven fixed categories and
  three-field entries, seeded with four `generated` AI Engineering runs by exact
  run ID and excluding `run-b0472ccc-825f-418b-9ee5-19df1dcb4653`; `reviewed` is
  manual only; no website, accounts, scheduling, priorities, new categories,
  source persistence, or deck-pipeline changes.
- unresolved blockers: none
- docs / specs / milestones the next skill must read:
  - `docs/ARCHITECTURE.md` (Seam 1 and Seam 2; the new orchestration boundary
    sits above Seam 1)
  - `docs/CONTEXT.md` (`Apollo`, `topic`, `runs/` / `run-id`, `validity
    contract`)
  - `docs/WORKFLOWS.md` (handoff + spec status contract)
  - `docs/milestones/0005-deck-template-enforcement-and-inline-graphics.md`
    (current deck pipeline contract, preserved unchanged)
  - proposed spec: `docs/specs/0006-getcracked-inventory-and-orchestration.md`
  - implementation touchpoints: `.agents/skills/apollo/SKILL.md` (moved to
    `.agents/skills/generate/SKILL.md`), a new `$getcracked` main skill at
    `.agents/skills/getcracked/SKILL.md`, a new
    `.codex/agents/apollo/web-researcher.toml`, and
    `docs/getcracked-inventory.md` (new)
- agent routing log:
  - `requirements`: used
  - `explorer`: not applicable for this scoped milestone-authoring pass
  - `spec-planner`: not applicable (spec authoring is the consumer's step)
  - `spec-griller`: not applicable (no spec drafted in this pass)
  - `codex-agent-tracer`: not applicable for this scoped pass
- trace path: not applicable for this scoped pass
