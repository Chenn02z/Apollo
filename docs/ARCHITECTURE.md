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

The MVP production path is a two-stage pipeline with a validation gate between
the stages:

1. **Topic → self-contained deck HTML.** The active Codex model directly
   authors each deck's complete `deck.html` for a single topic — colors,
   typography, composition, diagrams, and per-slide layout are model-chosen.
   The fixed pedagogical order is an internal content-planning constraint that
   guides authoring, not a separate outline artifact or a fixed layout engine.
   Output is one offline file (no external assets, no network, no interactivity,
   each slide 1080×1350 CSS px).
2. **HTML → validation + PNG export.** The `deck.html` is validated, then
   exported as exactly ten 1080×1350 PNGs named `slide-01.png` through
   `slide-10.png`.

Each run is identified by a caller-supplied unique `run-id`; its artifacts live in
a per-run folder `runs/<run-id>/` (its `deck.html` and `slide-01.png` …
`slide-10.png`). `runs/` is local, gitignored generated output. The legacy flat
`runs/deck.html` is preserved as pre-0002 evidence and is not overwritten by new
runs.

## Approved Seams

Boundaries the MVP deliberately establishes so post-MVP work can extend cleanly.
These describe the contract the MVP code must respect, not pre-built abstractions.

### Seam 1: Topic → deck HTML boundary

- **What**: the active Codex model authors a self-contained `deck.html` directly
  from a single topic, following the fixed ten-slide pedagogical order (hook,
  definition, mental model, mechanics, flow, applied example,
  code/pseudocode, trade-off, misconception/failure, interviewer follow-up) as
  an internal content-planning constraint — no separate outline artifact and
  no fixed template or layout engine.
- **Why**: lets a future web/editor UI or alternative authoring model feed the
  same content-then-HTML path; the model still authors the visual HTML directly.
- **Current path**: the Apollo workflow authors `deck.html` directly in Codex
  today; the pedagogical order is an internal authoring constraint, not a
  visual template.

### Seam 2: HTML → validation/PNG export boundary

- **What**: a `deck.html` validation-and-export step that takes one self-contained
  HTML file and produces exactly ten correctly sized, predictably named PNGs,
  failing on any validity breach.
- **Why**: isolates authoring from export so future formats (PDF, video/audio)
  or batching can reuse the same validated HTML input.
- **Current path**: validation and PNG export run as the second stage of the
  MVP pipeline. `scripts/check-deck.py` validates `runs/<run-id>/deck.html`
  unchanged, then `node scripts/export-carousel.mjs <run-id>` rasterizes slides
  1–10 into `runs/<run-id>/slide-01.png` through `slide-10.png` under
  local/offline Playwright (network disabled, 1080×1350 viewport, device scale 1)
  and validates exact count and 1080×1350 image dimensions. The exporter owns
  rendered-dimension/overflow checks, exact names/count/sizes, and atomic output.

## Deferred Architecture

Features intentionally NOT built in the MVP. Each names what is deferred and
which seam it builds on.

- **Web/editor UI**: a separate authoring surface feeding Seam 1's topic -> deck HTML path
  instead of the Codex-native workflow.
- **API / local-model integrations**: alternative authoring backends behind
  Seam 1.
- **Batching**: multiple decks through Seam 2's export path.
- **Publishing / accounts / cloud**: out of MVP scope; no runtime exists yet.
- **Analytics**: out of MVP scope.
- **Video / audio / PDF**: additional export formats reusing the validated HTML
  from Seam 2.
- **Automatic factual-review pipeline**: a separate validation stage in front of
  or after Seam 1; not part of MVP validity.
