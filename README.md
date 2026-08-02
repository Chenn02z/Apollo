# Apollo

> Turn one software-engineering topic into a self-contained, interview-ready slide deck — authored in Codex, delivered as one offline HTML file and ten PNGs.

Apollo is a Codex-native workflow. Spec 0006 (Accepted, not yet implemented)
settles `$getcracked` as the sole user-facing entry point: you invoke it with a
category and a topic count (for example, "give me 5 topics for Databases"), and
it selects topics, records them in a checked-in inventory, and runs one
`$generate` workflow per topic. `$generate` — the deck-authoring workflow,
renamed from `$apollo` — owns one deck end to end: it generates its own
`run-id`, creates `runs/<run-id>/`, authors, validates, exports, and retries.
It delegates deck-body composition to the dedicated
`.codex/agents/apollo/apollo-designer.toml` agent (not a generic
worker/implementer); the design agent owns only `runs/<run-id>/deck.html` and
does not alter templates, while the deck workflow retains run setup, manifest
validation, structural validation, retry orchestration, and PNG export. There
is no external
model, no API integration, and no external runtime to run.

## What You Get

- **One topic in, one deck out.** Apollo produces exactly one standalone HTML
  file (`deck.html`) plus exactly ten PNG slides, written to a per-run folder
  `runs/<run-id>/` for a unique `run-id` the deck workflow generates itself.
- **A durable topic backlog.** Under spec 0006 (Accepted, not yet implemented),
  `docs/getcracked-inventory.md` records topics under seven fixed categories
  with a status (`planned`, `generated`, `reviewed`) and a run link, and each
  successful run gets a `metadata.md` naming what it covers. `reviewed` is set
  by hand only.
- **Exactly ten coherent slides.** Every deck follows a fixed pedagogical order:
  hook, definition, mental model, mechanics, flow, applied example,
  code/pseudocode, trade-off, misconception/failure, interviewer follow-up.
- **Self-contained output.** No external assets, no network calls, no
  interactivity or animation. Each slide is 1080×1350 CSS pixels and exports as
  `runs/<run-id>/slide-01.png` through `runs/<run-id>/slide-10.png`.
- **Locked frame, free body.** Two checked-in standalone 1080×1350 source
  templates (not full decks) build the ten-slide deck: `templates/first-frame.html`
  is used only for slide 1, carrying a fixed category/topic/commentary
  presentation with no body-safe area, and `templates/frame.html` is used for
  slides 2–10, filling each slide's CSS-sized `<div id="body-safe-area">` with
  body content; both templates own the fixed rail and rotated `get cracked`
  label while the header and footer stay fixed; within each safe area, the
  author composes the body freely.
- **Advisory content and visual review.** A checked-in manifest sets independent
  content and visual revision limits (each 0–5). Content review checks a correct
  explanation, a concrete example, a trade-off or failure mode, and an
  interview-ready Q/A; visual review reads the rendered PNGs for frame integrity,
  legibility, and collisions. Reviewers report feedback to the author, who
  revises the deck; review is advisory, not a blocking gate.
- **Fails clean.** If a deck cannot be produced complete and valid, Apollo stops
  rather than handing back a partial or invalid result. Structural validation and
  PNG export remain the only hard gates.

## How It Works

1. You invoke `$getcracked` with a category and a topic count. It uses the
   `web-researcher` agent to find what is currently tested in that category,
   selects that exact count of topics not already in the inventory, records
   them as `planned`, and dispatches one `$generate` workflow per topic. Each
   topic succeeds or fails on its own: a failed topic stays `planned` and does
   not block the others.
2. Codex uses two checked-in standalone 1080×1350 source templates to build the
   deck: `templates/first-frame.html` for slide 1 (a fixed category/topic/
   commentary presentation with no body-safe area) and `templates/frame.html`
   for slides 2–10, each filling its CSS-sized `<div id="body-safe-area">` with
   authored body content. Both templates keep the fixed rail and rotated
   `get cracked` label; the frame itself is fixed.
3. Content and visual reviewers check the deck against the manifest's
   independent revision limits and report feedback to the author, who revises the
   deck HTML. Review is advisory: when the revision budget is exhausted the run
   still delivers, writing run-scoped reports under `runs/<run-id>/reviews/`.
4. Apollo validates the deck first (`scripts/check-deck.py`, reused unchanged):
   exactly ten top-level slides, correct dimensions, no overflow, no external
   dependencies.
5. Apollo exports exactly ten 1080×1350 PNGs via a deterministic local
   Node Playwright script (`scripts/export-carousel.mjs <run-id>`) that
   rasterizes slides 1–10 into `runs/<run-id>/slide-01.png` through
   `runs/<run-id>/slide-10.png` (network disabled, 1080×1350 viewport, device
   scale 1) and validates count and dimensions. On any failure it emits a clear
   error and leaves no partial slide PNGs for the run.

## Repository Layout

```text
.
├── README.md
├── user-journeys.html
├── AGENTS.md
└── docs/
    ├── PRODUCT.md
    ├── ARCHITECTURE.md
    ├── CONTEXT.md
    ├── WORKFLOWS.md
    ├── AGENT_ROLES.md
    ├── DOCS_POLICY.md
    ├── milestones/
    ├── specs/
    ├── adr/
    ├── techdebt/
    └── reference/
```

`docs/PRODUCT.md` carries the full product intent and scope. Deeper architecture
notes live in `docs/ARCHITECTURE.md`; canonical terminology is in
`docs/CONTEXT.md`. `user-journeys.html` is the visual map of the current path.

## Non-Goals (MVP)

The MVP does not include a web/editor UI, API or local-model integrations,
batching, publishing, analytics, video/audio, PDF, accounts, cloud, or an
automatic factual-review pipeline. Those are explicitly post-MVP.

Spec 0006's multi-topic dispatch is orchestration, not batching: each topic
still runs its own unchanged `$generate` pipeline end to end.
