# Milestone: Get Cracked Inventory And Orchestration

## Status

Accepted

## Status Notes

- **Accepted by user:** the developer settled the decisions below directly in
  requirements. Spec authoring may start; implementation is not yet authorized.
- **Renames the deck workflow:** `$apollo` becomes `$generate`. Prior review
  milestones shift one slot: content review is now 0007, visual review is now
  0008.
- **Amended after acceptance — slide-1 commentary removed:** the developer
  settled a new explicit direction. The slide-1 commentary slot is removed
  entirely, and this milestone now authorizes changing
  `templates/first-frame.html`, the `apollo-designer` authoring contract, and
  structural validation and its tests as necessary to eliminate
  `[COMMENTARY]`. Slide 1 carries category and topic only. `$generate` still
  owns deck authoring, validation, export, and retries.
- **Amended after acceptance — settled review findings:** `$generate` delegates
  deck-body composition directly to `apollo-designer`; main serializes inventory
  writes; workers are dispatched onto the runtime queue with no lower artificial
  cap; inventory seeding names four exact existing run IDs and excludes
  `run-b0472ccc-825f-418b-9ee5-19df1dcb4653`; the deck skill's path and
  invocation name both become `generate`.

## Goal

Turn Apollo from a one-topic-at-a-time deck command into a small content
operation with a durable backlog. Today every deck is produced by invoking
`$apollo` on one topic, and nothing in the repo records what has been made,
what is worth making next, or which topic a given `runs/<run-id>/` folder
belongs to. Run folders are UUID-named and opaque.

This milestone introduces `$getcracked` as the orchestration entry point over a
checked-in inventory of topics, renames the deck-producing workflow to
`$generate`, and makes each generated run self-describing. Research and
generation stay separate, opt-in operations so the developer keeps control of
what gets researched, what gets planned, and what actually gets built.

## MVP Deliverable

The developer can run `$getcracked research <category>` to get a cited
shortlist and five new planned topics in the inventory, then run
`$getcracked generate <explicit planned topics>` to produce a deck per topic,
with `docs/getcracked-inventory.md` reflecting the current state of the
backlog.

Verifiable success criteria:

- `$apollo` no longer exists as an invocation and `.agents/skills/apollo/` no
  longer exists as a path. The skill lives at `.agents/skills/generate/SKILL.md`
  and `$generate` is the only name for the deck-authoring workflow. No alias,
  shim, or deprecation path is kept.
- `$getcracked research <category>` returns a compact, cited shortlist in the
  session and adds exactly five planned topics to the inventory under the one
  category named in the invocation.
- Research-added topics are de-duplicated against existing inventory entries by
  normalized topic name, so a research pass never introduces a topic already
  listed under that category.
- Research sources are shown in-session with their citations and are not written
  to any file; nothing under `docs/` or `runs/` persists a source list.
- `$getcracked generate <explicit planned topics>` generates decks only for the
  topics named in the invocation. It never derives, expands, or infers the topic
  list from the inventory on its own.
- For each requested topic, `$getcracked` main generates the run-id and creates
  `runs/<run-id>/` before delegating, then delegates exactly one `$generate`
  worker per topic. Workers are dispatched onto the runtime's own queue; the
  workflow imposes no cap below whatever concurrency the runtime already allows.
- `$generate` receives the topic and the precreated run and owns deck authoring,
  validation, export, and retries: it reads both frame templates, reads and
  validates the manifest, delegates deck-body composition directly to
  `apollo-designer` with no intermediate generic worker, runs structural
  validation, runs PNG export, and retries up to 3 total attempts on validation
  or export failure.
- Slide 1 carries exactly two authored slots: category and topic. No
  `[COMMENTARY]` placeholder or commentary paragraph remains in
  `templates/first-frame.html`, in the `apollo-designer` authoring contract, or
  in structural validation and its tests, and no generated deck renders slide-1
  commentary text.
- On a per-topic success only, main writes `runs/<run-id>/metadata.md` with the
  deck title and a 1–2 sentence description, and updates that topic's inventory
  entry to `generated` with a link to the run. Main serializes every inventory
  write, so concurrent worker completions never interleave edits to
  `docs/getcracked-inventory.md`.
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
- `$getcracked` is the main orchestration skill with two opt-in operations:
  `research <category>` and `generate <explicit planned topics>`. There is no
  combined command that researches and generates in one automatic pass.
- Research prefers primary sources (official documentation, papers,
  specifications, source code) over secondary commentary.
- Research always adds exactly five planned topics, always under the single
  category named in the invocation. It does not create categories and does not
  spread topics across categories.
- De-duplication is by normalized topic name against the existing inventory.
- Research output is a compact cited shortlist shown in-session only. Sources
  are never stored.
- Run lifecycle moves up to main: main owns the run-id and creates
  `runs/<run-id>/` per requested topic before delegation.
- Main delegates one `$generate` worker per requested topic onto the runtime's
  queue. The workflow adds no cap below the runtime's own concurrency limit.
- `$generate` owns deck authoring, validation, export, and retries, and receives
  an already-created run instead of creating one. It delegates deck-body
  composition directly to `apollo-designer`; no generic worker sits between
  `$generate` and the design agent.
- The slide-1 commentary slot is removed. Slide 1 has category and topic only,
  and `[COMMENTARY]` disappears from the template, the designer contract, and
  validation.
- `metadata.md` is written by main, only after that topic's run succeeds, and
  contains a title plus a 1–2 sentence description.
- Main serializes all inventory writes so parallel worker completions cannot
  interleave edits to `docs/getcracked-inventory.md`.
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
- Add the `$getcracked` main skill with `research <category>` and
  `generate <explicit planned topics>` operations.
- Move run-id generation and `runs/<run-id>/` creation from the deck workflow up
  into `$getcracked` main.
- Per-topic delegation from main to one `$generate` worker, queued by the
  runtime and not capped lower by the workflow.
- Remove the slide-1 commentary slot: drop `[COMMENTARY]` and the `.commentary`
  paragraph from `templates/first-frame.html`, drop commentary from the
  `apollo-designer` slide-1 authoring contract, and update structural validation
  and `tests/test_frame_template.py` so slide 1 is category + topic only.
- Main-written `runs/<run-id>/metadata.md` (title + 1–2 sentence description) on
  per-topic success.
- Serialized inventory writes in main.
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
- Any change to `templates/frame.html`, `templates/manifest.json`,
  `scripts/export-carousel.mjs`, or the 3-attempt retry behavior. Changes to
  `templates/first-frame.html`, the `apollo-designer` slide-1 contract, and
  `scripts/check-deck.py` are in scope only insofar as they remove the
  commentary slot; run setup also moves out of the deck workflow into main.
- Any other change to slide-1 design beyond deleting the commentary slot — no
  new slots, no re-layout, no restyling of the surviving category and topic.
- Any automatic use of `reviewed`; review remains manual inventory editing.
- Backfilling metadata or inventory entries for the excluded Apollo
  slide-template test run.
- Content-review revisions and reports (0007) and visual-review revisions and
  reports (0008).

## Architecture Seams

- **New orchestration boundary above Seam 1:** `$getcracked` main owns the run
  lifecycle (run-id, `runs/<run-id>/` creation), the inventory
  (`docs/getcracked-inventory.md`), and per-run `metadata.md`. It never reads,
  writes, or reasons about templates, deck HTML, the structural validator, or
  the exporter. Inventory writes are serialized in main, which is the single
  writer for `docs/getcracked-inventory.md`.
- **Seam 1 (topic → deck HTML)** stays owned by `$generate` and
  `apollo-designer`. `$generate` now receives a topic plus a precreated run
  directory instead of creating one, and delegates deck-body composition
  directly to `apollo-designer`. The authoring contract changes in exactly one
  way: slide 1 loses its commentary slot and carries category and topic only.
- **Seam 2 (HTML → validation/PNG export)** keeps its shape. Structural
  validation and PNG export remain the only hard gates and stay inside the
  per-topic `$generate` worker. The single change is that validation drops its
  slide-1 commentary assertions; the gate does not move or otherwise weaken.
- The main/worker split is what makes multi-topic generation possible without
  duplicating the deck pipeline: adding topics adds workers, not new pipeline
  code.

## Specs

- Proposed: `docs/specs/0006-getcracked-inventory-and-orchestration.md`

## Acceptance Criteria

- Invoking `$generate` with a topic and a precreated run produces a validated,
  exported deck; `$apollo` is gone from the skill surface and the skill lives at
  `.agents/skills/generate/SKILL.md`.
- A freshly generated deck's slide 1 renders category and topic only, and
  `[COMMENTARY]` appears nowhere in `templates/first-frame.html`, the
  `apollo-designer` contract, `scripts/check-deck.py`, or `tests/`.
- `$getcracked research <category>` prints a compact cited shortlist and leaves
  exactly five new, name-normalized-unique `planned` entries under that category
  in `docs/getcracked-inventory.md`, with no source list written anywhere.
- `$getcracked generate <two or more explicit planned topics>` creates one run
  directory per topic, delegates one worker per topic, and on success flips each
  topic to `generated` with a run link and a `runs/<run-id>/metadata.md`
  containing a title and a 1–2 sentence description. Concurrent completions
  produce a well-formed inventory with every entry updated exactly once.
- A deliberately failing topic in a multi-topic invocation is reported, stays
  `planned`, has no `metadata.md`, and does not prevent sibling topics from
  completing.
- `docs/getcracked-inventory.md` shows the seven fixed categories and the four
  seeded AI Engineering entries as `generated` with run links, and does not list
  `run-b0472ccc-825f-418b-9ee5-19df1dcb4653`.

## Verification

- Manual invocation of `$getcracked research <category>` on one category;
  confirm five new planned entries, normalized-name de-duplication against a
  pre-existing entry, an in-session cited shortlist, and no stored sources.
- Manual invocation of `$getcracked generate` with at least two explicit planned
  topics; confirm per-topic run directories, per-topic workers, `metadata.md`
  contents, and inventory transitions.
- One forced-failure topic alongside a healthy topic; confirm per-topic isolation
  and that the failed topic stays `planned`.
- `tests/test_frame_template.py` and `tests/test_check_deck.py` are updated to
  the two-slot slide 1 and pass; `tests/test_manifest.py` passes unchanged.
- Grep confirms no `[COMMENTARY]` or `.commentary` reference survives outside
  pre-existing `runs/` artifacts.
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
- Regenerating or backfilling existing decks under `runs/` to drop their
  rendered slide-1 commentary; only future runs use the two-slot slide 1.

## Open Questions

None blocking. The spec may settle the exact inventory markdown table shape, the
exact `metadata.md` field layout, the normalization rule's precise form, the
research shortlist's presentation format, and the per-topic failure report
wording, plus how slide 1's surviving category and topic reflow once the
commentary paragraph is deleted and the serialization mechanism for inventory
writes.

## Handoff

- producer skill: `$requirements`
- intended consumer skill: `$spec`
- artifact path: `docs/milestones/0006-getcracked-inventory-and-orchestration.md`
- status: `Accepted`
- settled decisions: see **Decisions** above — `$apollo` renames to `$generate`
  in both skill path and invocation name, with no alias; `$getcracked` has
  opt-in `research <category>` and
  `generate <explicit planned topics>` operations only; research is
  primary-source-first, adds exactly five normalized-name de-duplicated planned
  topics under one fixed category, and returns an in-session cited shortlist
  with no stored sources; main owns run-id, `runs/<run-id>/` creation, and
  `metadata.md` on success, serializes inventory writes, and delegates one
  `$generate` worker per topic onto the runtime queue with no lower artificial
  cap; `$generate` owns deck authoring, validation, export, and retries, and
  delegates deck-body composition directly to `apollo-designer`; the slide-1
  commentary slot is removed so slide 1 has category and topic only, which
  authorizes changing `templates/first-frame.html`, the designer contract, and
  validation and its tests to eliminate `[COMMENTARY]`; failures stay
  `planned`, are reported, and do not block siblings; the inventory is
  `docs/getcracked-inventory.md` with seven fixed categories and three-field
  entries, seeded with four `generated` AI Engineering runs by exact run ID and
  excluding `run-b0472ccc-825f-418b-9ee5-19df1dcb4653`; `reviewed` is manual
  only; no website, accounts, scheduling, priorities, new categories, source
  persistence, or deck-pipeline changes beyond removing the commentary slot.
- unresolved blockers: none
- docs / specs / milestones the next skill must read:
  - `docs/ARCHITECTURE.md` (Seam 1 and Seam 2; the new orchestration boundary
    sits above Seam 1)
  - `docs/CONTEXT.md` (`Apollo`, `topic`, `runs/` / `run-id`, `validity
    contract`)
  - `docs/WORKFLOWS.md` (handoff + spec status contract)
  - `docs/milestones/0005-deck-template-enforcement-and-inline-graphics.md`
    (current deck pipeline contract, preserved except for the removed slide-1
    commentary slot)
  - proposed spec: `docs/specs/0006-getcracked-inventory-and-orchestration.md`
  - implementation touchpoints: `.agents/skills/apollo/SKILL.md` (moved to
    `.agents/skills/generate/SKILL.md`), a new `$getcracked` main skill,
    `docs/getcracked-inventory.md` (new), `templates/first-frame.html`,
    `.codex/agents/apollo/apollo-designer.toml`, `scripts/check-deck.py`, and
    `tests/test_frame_template.py`
- agent routing log:
  - `requirements`: used
  - `explorer`: not applicable for this scoped milestone-authoring pass
  - `spec-planner`: not applicable (spec authoring is the consumer's step)
  - `spec-griller`: not applicable (no spec drafted in this pass)
  - `codex-agent-tracer`: not applicable for this scoped pass
- trace path: not applicable for this scoped pass
