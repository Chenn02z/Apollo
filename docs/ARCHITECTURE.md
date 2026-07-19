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

1. **Outline → self-contained deck HTML.** The authoring agent freely authors
   each deck's complete `deck.html` for a ten-slide outline — colors,
   typography, composition, diagrams, and per-slide layout are agent-chosen.
   The outline is a model-authored content-planning artifact, not input to a
   fixed layout engine. Output is one offline file (no external assets, no
   network, no interactivity, each slide 1080×1350 CSS px).
2. **HTML → validation + PNG export.** The `deck.html` is validated, then
   exported as exactly ten 1080×1350 PNGs named `slide-01.png` through
   `slide-10.png`.

## Approved Seams

Boundaries the MVP deliberately establishes so post-MVP work can extend cleanly.
These describe the contract the MVP code must respect, not pre-built abstractions.

### Seam 1: Outline → deck HTML boundary

- **What**: a fixed ten-slide outline structure (hook, definition, mental model,
  mechanics, flow, applied example, code/pseudocode, trade-off,
  misconception/failure, interviewer follow-up) as a model-authored
  content-planning contract; the authoring agent realizes it as self-contained
  `deck.html` with no fixed template or layout engine.
- **Why**: lets a future web/editor UI or alternative authoring model feed the
  same content contract; the agent still authors the visual HTML directly.
- **Current path**: the Apollo workflow authors both the outline and the
  `deck.html` directly in Codex today; the outline order is enforced as the
  validity contract.

### Seam 2: HTML → validation/PNG export boundary

- **What**: a `deck.html` validation-and-export step that takes one self-contained
  HTML file and produces exactly ten correctly sized, predictably named PNGs,
  failing on any validity breach.
- **Why**: isolates authoring from export so future formats (PDF, video/audio)
  or batching can reuse the same validated HTML input.
- **Current path**: validation and PNG export run as the second stage of the
  MVP pipeline. The only deterministic rendering stage is a local Playwright
  export script that rasterizes slides 1–10 into `slide-01.png` through
  `slide-10.png` and validates exact count and 1080×1350 image dimensions.

## Deferred Architecture

Features intentionally NOT built in the MVP. Each names what is deferred and
which seam it builds on.

- **Web/editor UI**: a separate authoring surface feeding Seam 1's outline
  contract instead of the Codex-native workflow.
- **API / local-model integrations**: alternative authoring backends behind
  Seam 1.
- **Batching**: multiple decks through Seam 2's export path.
- **Publishing / accounts / cloud**: out of MVP scope; no runtime exists yet.
- **Analytics**: out of MVP scope.
- **Video / audio / PDF**: additional export formats reusing the validated HTML
  from Seam 2.
- **Automatic factual-review pipeline**: a separate validation stage in front of
  or after Seam 1; not part of MVP validity.
