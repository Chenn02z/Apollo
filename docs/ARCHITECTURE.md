# Architecture

Documents the current structure, approved seams, and deferred architecture for
Apollo. Seams are lightweight boundaries that exist now so future features can be
added without rewrites — never speculative blueprints or unused frameworks.

Update through `$context` when architecture decisions settle.

## Current Structure

There is no product runtime yet. The MVP is delivered entirely inside a Codex
session: the Apollo workflow authors a single self-contained `deck.html` and
exports ten PNGs. The only durable artifacts today are the docs in this repo
(`docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/CONTEXT.md`, milestones,
specs) and the untracked visual reference at `docs/reference/index.html`.

Spec 0006 (Accepted, not yet implemented) adds an orchestration layer above this
pipeline: `$getcracked` becomes the sole user-facing entry point, taking a
category and a topic count, and drives the pipeline once per selected topic.

The MVP production path is a pipeline of authoring, advisory review, and a
validation-plus-export gate:

1. **Topic → self-contained deck HTML.** `$generate` delegates deck-body
   composition of each run's `runs/<run-id>/deck.html` to the dedicated
   `.codex/agents/apollo/apollo-designer.toml` agent (not a generic
   worker/implementer). That design agent authors the complete `deck.html` for a
   single topic using two checked-in standalone 1080×1350 source slides:
   `templates/first-frame.html` for slide 1 (a fixed category/topic/commentary
   presentation with no body-safe area) and `templates/frame.html` for slides
   2–10, filling each slide's CSS-sized `<div id="body-safe-area">`, while the
   locked header, footer, rail, rotated `get cracked` label, visual feel, type,
   and colors stay fixed; both templates are immutable. The design agent owns only `deck.html` and does not alter
   templates; the author composes the body freely within each safe area. The
   fixed pedagogical order is an internal content-planning constraint that guides
   authoring, not a separate outline artifact or a fixed layout engine, and is
   distinct from the frame template. The main workflow retains run setup,
   manifest validation, structural validation, retry orchestration, and PNG
   export. Output is one offline file (no external assets, no network, no
   interactivity, each slide 1080×1350 CSS px).
2. **Advisory review (non-blocking).** Content and visual reviewers check the
   `deck.html` against a checked-in manifest's independent content and visual
   revision limits (each 0–5) and report feedback to the author, who revises the
   deck HTML. On revision exhaustion the run still delivers, writing run-scoped
   reports under `runs/<run-id>/reviews/content` and `runs/<run-id>/reviews/visual`.
   Review is advisory; it is not a hard gate.
3. **HTML → validation + PNG export.** The `deck.html` is validated, then
   exported as exactly ten 1080×1350 PNGs named `slide-01.png` through
   `slide-10.png`. Structural validation and PNG export are the only hard gates.

Each run is identified by a unique `run-id` the deck workflow generates itself;
its artifacts live in a per-run folder `runs/<run-id>/` (its `deck.html` and
`slide-01.png` … `slide-10.png`). `runs/` is local, gitignored generated output.
The legacy flat `runs/deck.html` is preserved as pre-0002 evidence and is not
overwritten by new runs.

Each run is identified by a unique `run-id` the deck workflow generates itself;
its artifacts live in a per-run folder `runs/<run-id>/` (its `deck.html` and
`slide-01.png` … `slide-10.png`). `runs/` is local, gitignored generated output.
The legacy flat `runs/deck.html` is preserved as pre-0002 evidence and is not
overwritten by new runs.

## Approved Seams

Boundaries the MVP deliberately establishes so post-MVP work can extend cleanly.
These describe the contract the MVP code must respect, not pre-built abstractions.

### Orchestration boundary (above Seam 1)

Accepted in spec 0006; not yet implemented.

- **What**: `$getcracked` main sits above Seam 1 as the sole user-facing entry
  point. It takes a category and a topic count and owns inventory reads and
  writes (`docs/getcracked-inventory.md`), topic selection via the
  `web-researcher` agent, dispatch of one `$generate` workflow per selected
  topic, `runs/<run-id>/metadata.md` writes on per-topic success, sequential
  inventory updates, and per-topic failure reporting.
- **Why**: separates "what to make and what has been made" from "how one deck
  gets made", so a durable backlog and multi-topic runs can grow without
  reaching into the deck pipeline.
- **Current path**: `$generate` keeps its existing self-contained lifecycle
  unchanged — it generates its own `run-id`, creates `runs/<run-id>/`, reads
  templates, validates the manifest, delegates to `apollo-designer`, runs
  structural validation and PNG export, and retries up to 3 attempts.
  `$getcracked` does not precreate runs or generate run-ids. Workflows are
  dispatched onto the runtime's own queue with no added cap, but inventory
  writes are serialized: one write at a time, never concurrent. A failed topic
  stays `planned`, gets no `metadata.md`, and does not block siblings.

### Web-research agent boundary

Accepted in spec 0006; not yet implemented.

- **What**: a dedicated `web-researcher` agent, planned at
  `.codex/agents/apollo/web-researcher.toml`, that supplies research findings
  only — cited sources, current topics, relevant technical context — returned
  in-session to its caller.
- **Why**: keeps "what the world currently tests" as an input to orchestration
  and authoring without letting a research agent own workflow control.
- **Current path**: `$getcracked` consumes findings for topic selection and
  `$generate` may consume them to ground current content. The agent edits no
  files — not the inventory, decks, or templates — makes no workflow decisions
  (no selection, dispatch, status transitions, or run-id generation), and its
  sources are never written under `docs/` or `runs/`.

### Seam 1: Topic → deck HTML boundary

- **What**: `$generate` delegates deck-body composition of `deck.html` to the
  dedicated `.codex/agents/apollo/apollo-designer.toml` agent (not a generic
  worker/implementer). That design agent authors a self-contained `deck.html`
  from a single
  topic using two checked-in standalone 1080×1350 source slides:
  `templates/first-frame.html` for slide 1 (a fixed category/topic/commentary
  presentation with no body-safe area) and `templates/frame.html` for slides
  2–10, filling each slide's CSS-sized `<div id="body-safe-area">`, while the
  locked header, footer, rail, rotated `get cracked` label, visual feel, type,
  and colors stay fixed; both templates are immutable.
  Authoring follows the fixed ten-slide pedagogical order (hook, definition,
  mental model, mechanics, flow, applied example, code/pseudocode, trade-off,
  misconception/failure, interviewer follow-up) as an internal content-planning
  constraint. The author composes the body freely within each safe area; there
  is no separate outline artifact and no deterministic body layout engine.
- **Why**: lets a future web/editor UI or alternative authoring model feed the
  same content-then-HTML path; the model still authors the visual HTML directly.
- **Current path**: the Apollo workflow authors `deck.html` in Codex today by
  routing slide 1 to `templates/first-frame.html` and slides 2–10 to
  `templates/frame.html`; the pedagogical order
  is an internal authoring constraint. The frame template
  (header/footer/rail and rotated `get cracked` label, visual feel/type/colors,
  and the CSS-sized body-safe area on slides 2–10) is the fixed visual contract;
  the author composes body content freely within each slide's safe area while
  the header and footer stay identical to the template.

### Seam 2: HTML → validation/PNG export boundary

- **What**: a `deck.html` validation-and-export step that takes one self-contained
  HTML file and produces exactly ten correctly sized, predictably named PNGs,
  failing on any validity breach.
- **Why**: isolates authoring from export so future formats (PDF, video/audio)
  or batching can reuse the same validated HTML input.
- **Current path**: validation and PNG export run as the second stage of the
  MVP pipeline. `scripts/check-deck.py` validates `runs/<run-id>/deck.html`
  through the 0005 slide-1 routing gate, then `node scripts/export-carousel.mjs <run-id>` rasterizes slides
  1–10 into `runs/<run-id>/slide-01.png` through `slide-10.png` under
  local/offline Playwright (network disabled, 1080×1350 viewport, device scale 1)
  and validates exact count and 1080×1350 image dimensions. The exporter owns
  rendered-dimension/overflow checks, exact names/count/sizes, and atomic output.

### Seam 3: `assets/` brand assets boundary

- **What**: `assets/` may hold standalone `getcracked.dev` brand assets for
  external/social use. These assets are not referenced by, embedded in, or
  exported with Apollo decks, which remain self-contained with no external
  assets. Apollo keeps its own name and brand; `assets/` is a separate
  external-facing space, not part of any deck.
- **Why**: lets standalone brand material live in the repo without coupling it
  to the self-contained deck pipeline or implying any deck external-asset
  dependency.
- **Current path**: `assets/` is decoupled from the Seam 1/Seam 2 pipeline;
  nothing in the deck authoring or export path loads or ships these assets.

## Deferred Architecture

Features intentionally NOT built in the MVP. Each names what is deferred and
which seam it builds on.

- **Web/editor UI**: a separate authoring surface feeding Seam 1's topic -> deck HTML path
  instead of the Codex-native workflow.
- **API / local-model integrations**: alternative authoring backends behind
  Seam 1.
- **Batching**: multiple decks through Seam 2's export path. Spec 0006's
  multi-topic dispatch is orchestration above Seam 1 — each topic still runs
  its own unchanged `$generate` pipeline — not batched authoring or export.
- **Publishing / accounts / cloud**: out of MVP scope; no runtime exists yet.
- **Analytics**: out of MVP scope.
- **Video / audio / PDF**: additional export formats reusing the validated HTML
  from Seam 2.
- **Automatic factual-review pipeline**: a separate validation stage in front of
  or after Seam 1; not part of MVP validity.
