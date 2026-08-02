# Spec: Getcracked Inventory And Orchestration

## Status

Accepted

## Goal

Turn Apollo from a one-topic-at-a-time deck command into a small content
operation with a durable backlog. `$getcracked` becomes the sole
user-facing entry point that orchestrates research and generation
internally over a checked-in inventory of topics. The deck-producing
workflow renames from `$apollo` to `$generate` with its existing behavior
unchanged. Each generated run becomes self-describing via `metadata.md`.
A dedicated web-research agent supplies research findings to both
`$getcracked` (topic selection) and `$generate` (content grounding)
without making workflow decisions.

## Scenario

1. A developer runs `$getcracked give me 5 topics for Databases`.
   `$getcracked` invokes a web-research agent to determine what is
   currently tested or interviewed in that category, selects exactly five
   teachable topics that are normalized-unique against existing inventory
   entries, appends them as `planned` to `docs/getcracked-inventory.md`,
   then dispatches one `$generate` workflow per selected topic. Each
   `$generate` generates its own run-id, creates `runs/<run-id>/`, authors,
   validates, exports, and retries — its existing behavior, unchanged. On
   per-topic success, `$getcracked` writes `runs/<run-id>/metadata.md` and
   transitions that inventory entry to `generated` with a run link.
2. A forced-failure topic stays `planned`, gets no `metadata.md`, is
   reported, and does not block the other topics.
3. Slide 1 retains its three authored slots: `[CATEGORY]`, `[TOPIC]`, and
   `[COMMENTARY]`. No template, test, or validator changes are made for
   slide 1.

## Architecture Reference

`docs/ARCHITECTURE.md` — this spec introduces a new orchestration boundary
that sits **above** Seam 1 (Topic → deck HTML). `$getcracked` main owns
orchestration: inventory management, topic selection via the web-research
agent, per-topic `$generate` workflow dispatch, `metadata.md` writes, and
sequential inventory updates. Seam 1's delegation contract (main →
`apollo-designer` via `$generate`) is preserved: the design agent still
authors `deck.html` only and never edits templates. `$generate`'s existing
behavior is unchanged: it generates its own run-id, creates
`runs/<run-id>/`, reads templates, validates the manifest, delegates
deck-body composition to `apollo-designer`, runs structural validation,
runs PNG export, and retries up to 3 attempts. Seam 2 (HTML →
validation/PNG export) is unchanged. A new web-research agent boundary is
introduced alongside the orchestration boundary; it supplies findings only
and never edits inventory, decks, or makes workflow decisions.

## In Scope

- Rename `.agents/skills/apollo/` to `.agents/skills/generate/` and update
  its `SKILL.md` front-matter `name` to `generate`; invocation name becomes
  `$generate` with no alias, shim, or deprecation path. `$generate`'s
  existing behavior (run-id generation, `runs/<run-id>/` creation, authoring,
  validation, export, retries) is unchanged.
- Add `.agents/skills/getcracked/SKILL.md` as the sole user-facing
  orchestration skill. `$getcracked` is the only entry point users invoke.
  It orchestrates research and generation internally; users do not invoke
  `$research` or `$generate` separately.
- Add a dedicated web-research agent contract (see Web-Research Agent
  Contract). `$getcracked` uses it for topic selection; `$generate` uses
  it to ground current content for the chosen topic. The agent supplies
  research findings only.
- `$getcracked`-written `runs/<run-id>/metadata.md` (title + 1–2 sentence
  description) on per-topic success only.
- Sequential inventory writes in `$getcracked` main: it updates
  `docs/getcracked-inventory.md` one entry at a time after each
  `$generate` workflow completes, never concurrently. Verification is by
  inspection.
- Create `docs/getcracked-inventory.md` with exactly seven fixed categories
  and three-field entries (topic name, status, run link), seeded with four
  `generated` AI Engineering runs by exact run ID, excluding
  `run-b0472ccc-825f-418b-9ee5-19df1dcb4653`.
- Per-topic failure reporting: failed topic stays `planned`, no
  `metadata.md`, failure reported to developer, siblings proceed.
- Minimal documentation alignment for the rename and new orchestration
  (see Documentation Alignment section).

## Out Of Scope

- Any change to `$generate`'s existing behavior (run-id generation,
  `runs/<run-id>/` creation, authoring, validation, export, retries).
- Any change to `templates/first-frame.html`,
  `templates/frame.html`, `scripts/check-deck.py`,
  `scripts/export-carousel.mjs`, `templates/manifest.json`,
  `tests/test_frame_template.py`, `tests/test_manifest.py`, or
  `tests/test_check_deck.py`.
- Removing or altering the slide-1 `[COMMENTARY]` slot. Slide 1 retains
  `[CATEGORY]`, `[TOPIC]`, and `[COMMENTARY]`.
- Any hosted or generated view of the inventory (website, feed, export).
- Scheduling or unattended runs of research or generation.
- Richer inventory fields (priority, difficulty, dates, tags, ordering).
- Additional categories beyond the seven fixed ones.
- Durable storage or citation archiving of research sources.
- Automating the `reviewed` transition or tying it to content/visual review
  (0007 / 0008).
- Retroactive metadata for pre-existing runs beyond the four seeded entries.
- Unrelated doc cleanup beyond the documentation alignment listed below.

## Architecture Seams

### New orchestration boundary (above Seam 1)

`$getcracked` main sits above Seam 1. It owns:
- Inventory reads and writes (`docs/getcracked-inventory.md`).
- Topic selection: invoking the web-research agent, normalizing and
  de-duplicating candidates against existing inventory entries, selecting
  exactly the requested count.
- Dispatch of one `$generate` workflow per selected topic onto the
  runtime's own queue, with no added cap below the runtime's own
  concurrency limit.
- `metadata.md` writes on per-topic success.
- Sequential inventory updates: one write at a time, never concurrent.
- Per-topic failure reporting.

`$generate` owns (unchanged from the existing `$apollo` skill):
- Run-id generation and `runs/<run-id>/` creation.
- Reading both frame templates.
- Reading and validating the manifest.
- Delegating deck-body composition directly to `apollo-designer` (no
  intermediate generic worker).
- Running structural validation (`scripts/check-deck.py`).
- Running PNG export (`node scripts/export-carousel.mjs <run-id>`).
- Retrying up to 3 total attempts on validation or export failure.
- Optionally invoking the web-research agent to ground current content
  for the chosen topic before or during authoring.

### Seam 1 (Topic → deck HTML)

Preserved unchanged. `apollo-designer` still authors `runs/<run-id>/deck.html`
only and never edits templates. Slide 1 retains its three slots: category,
topic, and commentary.

### Seam 2 (HTML → validation/PNG export)

Preserved unchanged. `scripts/check-deck.py` and
`scripts/export-carousel.mjs` are untouched.

### Web-research agent boundary

A new agent that supplies research findings only. It does not edit the
inventory, decks, or templates, and it does not make workflow decisions
(topic selection, dispatch, status transitions). Both `$getcracked` and
`$generate` consume its output as input; neither delegates workflow control
to it.

## Contracts

### `$getcracked` (sole user-facing entry point)

Users invoke `$getcracked` with a natural-language request specifying a
category and a count of topics. Example: `$getcracked give me 5 topics for
Databases`. `$getcracked` orchestrates internally; users do not invoke
`$research` or `$generate` separately.

- **Input**: a natural-language request containing a category name and a
  topic count. The category must be exactly one of: DSA, System Design,
  Software Design, Java & Backend Development, Databases, AI Engineering,
  Deep Learning.
- **Topic selection process**:
  1. `$getcracked` invokes the web-research agent to determine what is
     currently tested or interviewed in the named category. The agent
     returns research findings (cited sources, current topics) in-session.
     Sources are never written to any file.
  2. `$getcracked` selects exactly the requested number of teachable topics
     from the research findings.
  3. Each candidate topic name is normalized (lowercase, trim
     leading/trailing whitespace, collapse internal whitespace to single
     spaces, strip ASCII punctuation, retain articles) and compared
     against the normalized names of all existing
     entries under that category. If a candidate collides, `$getcracked`
     produces a replacement candidate and re-checks. Repeat until exactly
     the requested count of normalized-unique topics is found.
  4. The selected topics are appended as `planned` entries to
     `docs/getcracked-inventory.md` under the named category.
- **Generation dispatch**:
  1. `$getcracked` dispatches one `$generate` workflow per selected topic
     onto the runtime's own queue with no added cap below the runtime's
     concurrency limit.
  2. Each `$generate` workflow generates its own run-id, creates
     `runs/<run-id>/`, authors the deck, validates, exports, and retries —
     its existing behavior, unchanged. `$getcracked` does not precreate
     runs or generate run-ids.
  3. On per-topic success: `$getcracked` writes
     `runs/<run-id>/metadata.md` with the deck title and a 1–2 sentence
     description, then updates that topic's inventory entry to `generated`
     with a link to the run.
  4. On per-topic failure: the topic stays `planned`, no `metadata.md` is
     written, the failure is reported to the developer, and other topics
     still complete.
- **Concurrency and serialization**: workflows are dispatched onto the
  runtime's own queue with no added cap. `$getcracked` updates the inventory
  sequentially: after each workflow completes (success or failure),
  `$getcracked` performs that topic's inventory write (if any) before
  processing the next completion. Writes are never concurrent. The developer
  verifies no interleaving by inspecting the final
  `docs/getcracked-inventory.md` state after all workflows finish.

### `$generate` (renamed from `$apollo`, behavior unchanged)

`$generate` is the deck-authoring workflow. Its behavior is identical to
the existing `$apollo` skill: it generates its own run-id, creates
`runs/<run-id>/`, reads both frame templates, reads and validates the
manifest, delegates deck-body composition to `apollo-designer`, runs
`scripts/check-deck.py`, runs `node scripts/export-carousel.mjs <run-id>`,
and retries up to 3 total attempts on validation or export failure.

The only change is the rename: path moves from
`.agents/skills/apollo/SKILL.md` to `.agents/skills/generate/SKILL.md`,
front-matter `name` changes from `apollo` to `generate`, and the invocation
name becomes `$generate`.

`$generate` may optionally invoke the web-research agent to ground current
content for the chosen topic before or during authoring. This does not
change its existing pipeline steps.

### Web-Research Agent Contract

A dedicated agent that supplies research findings only.

- **Role**: determine what is currently tested or interviewed for a given
  category, and provide current content grounding for a given topic.
- **Called by**: `$getcracked` (for topic selection) and `$generate` (for
  content grounding).
- **Output**: research findings — cited sources, current topics, relevant
  technical context — returned to the caller in-session.
- **Constraints**:
  - Supplies research findings only.
  - Does not edit the inventory, decks, templates, or any file.
  - Does not make workflow decisions: no topic selection, no dispatch, no
    status transitions, no run-id generation.
  - Sources are shown in-session and are never written to any file under
    `docs/` or `runs/`.
  - Prefers primary sources (official documentation, papers,
    specifications, source code) over secondary commentary.
- **Configuration**: the agent is named `web-researcher` and configured
  at `.codex/agents/apollo/web-researcher.toml`. It is a dedicated agent,
  not a generic worker/implementer.

### `metadata.md` format

```markdown
# <deck title>

<1–2 sentence description>
```

Minimal: a level-1 heading with the deck title, a blank line, then 1–2
sentences of description. No other fields.

### Inventory format (`docs/getcracked-inventory.md`)

A markdown document with exactly seven category sections, each containing a
table of entries. Each table row has exactly three columns: topic, status,
and run link. Status is `planned`, `generated`, or `reviewed`.

Seven fixed categories (exact names):
- DSA
- System Design
- Software Design
- Java & Backend Development
- Databases
- AI Engineering
- Deep Learning

Seed entries (AI Engineering, `generated`):

| Topic | Status | Run |
|---|---|---|
| LLM Inference Optimization | generated | `runs/run-029566d4-241f-41d1-9b2b-c24bd6fd9d64/` |
| KV Cache | generated | `runs/run-a3f90c9e-efe0-4f47-8aab-7f29a0f030f5/` |
| AI Agent Tool Use | generated | `runs/run-d03e198c-95bc-421d-9b05-1e8b98bda127/` |
| LLM Evaluation | generated | `runs/run-dde474cc-b81f-40ce-bc2d-993556b7953b/` |

The fifth existing run, `run-b0472ccc-825f-418b-9ee5-19df1dcb4653` (titled
"Apollo slide template"), is a template test run and is not listed.

### Skill rename references

- `.agents/skills/apollo/SKILL.md` moves to
  `.agents/skills/generate/SKILL.md`; front-matter `name` changes from
  `apollo` to `generate`.
- The `description` line in the moved `SKILL.md` may update to reflect the
  new name, but the workflow steps (run-id generation, run directory
  creation, template reading, manifest validation, delegation,
  validation, export, retries) are unchanged.
- The `developer_instructions` in `apollo-designer.toml` continues to
  reference `templates/first-frame.html` with its three slots unchanged.

### Documentation Alignment

The `$apollo` → `$generate` rename and the new `$getcracked` orchestration
requires minimal doc updates. These are in scope; unrelated doc cleanup
is not. No template/test/validator changes are needed — slide 1 retains its
three slots.

- `docs/CONTEXT.md`: update references to `$apollo` /
  `.agents/skills/apollo/` to `$generate` / `.agents/skills/generate/`;
  add `$getcracked` as the sole user-facing orchestration entry point;
  add the web-research agent boundary. The `first-frame template`
  definition is unchanged (three slots).
- `docs/ARCHITECTURE.md`: add the new orchestration boundary above Seam 1
  noting `$getcracked` main and the web-research agent boundary; update
  references to `$apollo` to `$generate`. Seam 1 and Seam 2 descriptions
  are unchanged (three-slot slide 1).
- `README.md`: update any reference to `$apollo` to `$generate` and note
  `$getcracked` as the entry point, if the README references the workflow
  name.
- `docs/AGENT_ROLES.md`: add the web-research agent role; update any
  `$apollo` reference to `$generate` and `$getcracked`, if present.
- `docs/PRODUCT.md`: update product intent and scope for the `$getcracked`
  entry point, the durable inventory, and the research-informs-only boundary.
- `user-journeys.html`: update the journey map for the `$getcracked` entry
  point and per-topic dispatch; the deck pipeline steps are unchanged.

These doc updates are part of the same increment and ship with the code
changes. They are triggered via `$context` after implementation settles.

## Failure Modes

- **Unknown category**: `$getcracked` receives a request whose category is
  not among the seven fixed names. Halt with a clear error listing the
  seven valid categories. Do not create new categories.
- **Web-research agent unavailable or returns no findings**: if the
  web-research agent cannot supply findings, `$getcracked` reports the
  failure and halts. No topics are added to the inventory and no workflows
  are dispatched. (If partial findings are available, `$getcracked` may
  proceed with what it has, selecting fewer than requested if needed, but
  must report the shortfall.)
- **Per-topic generation failure**: `$generate` exhausts 3 attempts
  without a valid deck + exported PNGs. The topic stays `planned`, no
  `metadata.md` is written, the final error is surfaced verbatim, and
  sibling topics continue independently.
- **Missing manifest**: `$generate` finds `templates/manifest.json` is
  missing. Halt that workflow with "Missing templates/manifest.json". The
  topic stays `planned`; siblings continue. (Preserved from the existing
  `$apollo` contract.)
- **Inventory write conflict**: two or more workflows complete and
  `$getcracked` attempts to update `docs/getcracked-inventory.md`
  simultaneously. `$getcracked` serializes all writes so edits never
  interleave. The developer verifies by inspecting the final inventory
  state.

## Acceptance Criteria

- `$apollo` does not exist as an invocation name; no alias, shim, or
  deprecation path. `.agents/skills/apollo/` does not exist as a path. The
  skill lives at `.agents/skills/generate/SKILL.md` and `$generate` is the
  only name for the deck-authoring workflow.
- `$getcracked` is the sole user-facing entry point. Users do not invoke
  `$research` or `$generate` separately when calling `$getcracked`.
- `$getcracked` orchestrates research and generation internally: it invokes
  the web-research agent for topic selection, selects exactly the requested
  count of normalized-unique teachable topics, appends them as `planned`,
  and dispatches one `$generate` workflow per topic.
- `$generate`'s existing behavior is unchanged: it generates its own
  run-id, creates `runs/<run-id>/`, authors, validates, exports, and
  retries up to 3 attempts. `$getcracked` does not precreate runs or
  generate run-ids.
- The web-research agent supplies research findings only. It does not edit
  the inventory, decks, or templates, and does not make workflow decisions.
  Sources are shown in-session and never written to any file.
- Slide 1 retains `[CATEGORY]`, `[TOPIC]`, and `[COMMENTARY]`. No template,
  test, or validator changes are made for slide 1.
- On per-topic success, `$getcracked` writes `runs/<run-id>/metadata.md`
  with the deck title and a 1–2 sentence description, and updates that
  topic's inventory entry to `generated` with a link to the run.
  `$getcracked` writes inventory updates sequentially, one at a time,
  never concurrently.
- On per-topic failure, the topic stays `planned`, no `metadata.md` is
  written, the failure is reported, and other requested topics still
  complete.
- `docs/getcracked-inventory.md` exists with exactly seven categories: DSA,
  System Design, Software Design, Java & Backend Development, Databases,
  AI Engineering, Deep Learning. Each entry has exactly three fields: topic
  name, status, and run link.
- The inventory is seeded with exactly four `generated` AI Engineering
  entries linked to their existing runs by exact run ID:
  `run-029566d4-241f-41d1-9b2b-c24bd6fd9d64`,
  `run-a3f90c9e-efe0-4f47-8aab-7f29a0f030f5`,
  `run-d03e198c-95bc-421d-9b05-1e8b98bda127`,
  `run-dde474cc-b81f-40ce-bc2d-993556b7953b`. The test run
  `run-b0472ccc-825f-418b-9ee5-19df1dcb4653` is excluded.
- `reviewed` is reached only by the developer manually editing the
  inventory. Nothing in the workflow sets or checks `reviewed`.
- Documentation in `docs/CONTEXT.md`, `docs/ARCHITECTURE.md`, `README.md`,
  `docs/AGENT_ROLES.md`, `docs/PRODUCT.md`, and `user-journeys.html` reflects
  the `$generate` rename, `$getcracked` addition, and web-research agent
  boundary. No unrelated doc changes.

## Verification

- Manual `$getcracked give me 5 topics for Databases`; confirm exactly
  five new `planned` entries, normalized-name de-duplication with
  replacement against a pre-existing entry, an in-session cited shortlist
  from the web-research agent, and no stored sources.
- Confirm `$generate` workflows are dispatched one per topic and each
  generates its own run-id and `runs/<run-id>/` directory.
- Confirm `metadata.md` contents on success and inventory transition to
  `generated` with run link.
- One forced-failure topic alongside a healthy topic; confirm per-topic
  isolation and that the failed topic stays `planned`.
- Inspect `docs/getcracked-inventory.md` after a multi-topic run; confirm
  no interleaved or partial writes — every entry is clean and complete.
- `tests/test_frame_template.py`, `tests/test_manifest.py`, and
  `tests/test_check_deck.py` pass unchanged (no test modifications in this
  spec).
- Confirm no existing run artifacts under `runs/` were modified.
- Confirm `.agents/skills/apollo/` no longer exists and
  `.agents/skills/generate/SKILL.md` does.

## Handoff

- **producer skill**: `$spec`
- **intended consumer skill**: `$dev-loop`
- **artifact path**:
  `docs/specs/0006-getcracked-inventory-and-orchestration.md`
- **status**: Accepted
- **settled decisions**:
  - `$getcracked` is the sole user-facing entry point. It orchestrates
    research and generation internally; users do not invoke `$research` or
    `$generate` separately.
  - `$apollo` renames to `$generate` in both skill path and invocation
    name, with no alias. `$generate`'s existing behavior is unchanged:
    it generates its own run-id, creates `runs/<run-id>/`, authors,
    validates, exports, and retries.
  - A dedicated web-research agent supplies research findings only. It does
    not edit inventory/decks or make workflow decisions. `$getcracked` uses
    it for topic selection; `$generate` uses it to ground current content.
  - `$getcracked` selects exactly the requested count of normalized-unique
    teachable topics. Collisions produce replacement candidates so the
    count is always exact.
  - `$getcracked` writes `metadata.md` on per-topic success and updates
    the inventory sequentially (one at a time, never concurrent).
  - Failures stay `planned`, are reported, and do not block siblings.
  - The inventory is `docs/getcracked-inventory.md` with seven fixed
    categories and three-field entries, seeded with four `generated` AI
    Engineering runs by exact run ID, excluding
    `run-b0472ccc-825f-418b-9ee5-19df1dcb4653`.
  - `reviewed` is manual only.
  - Slide 1 retains `[CATEGORY]`, `[TOPIC]`, and `[COMMENTARY]`. No
    template, test, or validator changes.
  - Minimal documentation alignment for the rename and new orchestration;
    no unrelated doc cleanup.
- **unresolved blockers**: none
- **docs / specs / milestones the next skill must read**:
  - `docs/WORKFLOWS.md` (handoff + spec status contract)
  - `docs/ARCHITECTURE.md` (Seam 1, Seam 2, new orchestration boundary)
  - `docs/CONTEXT.md` (canonical terminology — needs `$context` update
    after implementation for the rename and `$getcracked` addition)
  - `docs/milestones/0006-getcracked-inventory-and-orchestration.md`
    (Accepted milestone)
  - `docs/specs/0005-deck-template-enforcement-and-inline-graphics.md`
    (current deck pipeline contract, preserved unchanged)
- **agent routing log**:
  - `explorer`: not applicable for this scoped spec-authoring pass
  - `spec-planner`: not applicable (spec authoring is the consumer's step)
  - `spec-griller`: revised after product-direction correction; ready for
    re-grill
  - `codex-agent-tracer`: not applicable for this scoped pass
- **trace path**: not applicable for this scoped pass

## Open Questions

  file path are left to the implementer. The contract is that it is a
  dedicated agent, not a generic worker/implementer.
- **Research findings presentation format**: the exact in-session format
  of the web-research agent's output is not fixed. Left to the implementer's
  judgment within "cited" and "findings only."
- **Per-topic failure report wording**: not fixed; the implementer chooses
  clear, concise wording.
- **`$getcracked` request parsing**: the exact parsing of the
  natural-language request (e.g. "give me 5 topics for Databases") into a
  count and category is left to the implementer. The contract is that the
  count and category are extracted correctly.
