# Apollo Architecture

## Current Structure

Apollo has one adaptive 7–10-slide content-to-render workflow. It performs
deterministic structural, overflow, export, and manifest validation. The
workspace also includes a visual/content reference at
`docs/reference/html/index.html`.

The MVP runtime is a local Codex-native staged workflow. Skills enter stages,
a Codex custom agent performs bounded content generation, and deterministic
local tools support rendering and validation. It writes each generation to an
inspectable run directory rather than a database or service; it has no
standalone LLM API client or runtime API key.

## Current Flow

```text
topic → `apollo-generate` → [carousel-writer → validation] × up to 3 → carousel-reviewer → [[candidate writer → validation] × up to 3 → promote → carousel-reviewer] × up to 2 → `apollo-render` → content validation → external snapshot preparation → carousel-art-director (once) → layout/boundary validation → populate-carousel → HTML/validated PNG/manifest
```

## Current Boundaries

- **Run artifact boundary:** a run directory contains `request.json`,
  `carousel-content.json`, `carousel-layout.json`, `index.html`, `slides/`, and `render-manifest.json`
  as stages complete; it may also contain `carousel-content.initial.json`,
  `carousel-content.before-revision-2.json`, and versioned
  `carousel-review-1.json` through `carousel-review-3.json` artifacts.
  Export stages PNGs before
  atomically replacing the complete renderer artifact set only after every
  content-derived screenshot succeeds. A failure preserves the prior complete
  set, or leaves no success manifest.
- **Content/layout/HTML boundary:** `carousel-content.json` holds plain-text,
  layout-ready 7–10-slide copy. Its slide array is the sole slide-count source
  for validation, HTML, PNG export, and manifest creation. `apollo-render`
  validates content, prepares an external protected-boundary snapshot, invokes
  `carousel-art-director` once to write only `carousel-layout.json`, validates
  the plan and boundary, then runs `scripts/populate-carousel.mjs`, which
  deterministically expands the unchanged fixed local shell into one HTML page
  with escaped content slots.
- **Theme/HTML boundary:** repository-owned visual assets, including vendored
  fonts, form one local 1080×1350 `database` theme pack. Output has 7–10
  ordered identifiable slides and uses only this pack, with no scripts, network
  access, or external assets.
- **HTML/export boundary:** the renderer stage uses Playwright with network
  routes aborted to deterministically screenshot each constrained slide to PNG;
  it does not make visual or content decisions.
- **Validation boundary:** validation reports deterministic dimensions,
  content-derived slide count, and overflow failures independently from content
  generation; it validates structural limits, not semantic concreteness.
- **Review/rewrite boundary:** `carousel-reviewer` evaluates validated content
  and writes a versioned review that Apollo deterministically validates. An
  `approve_with_warnings` or `reject` decision may cause `carousel-writer` to
  write a candidate, with up to three attempts for initial content and each
  candidate. Apollo validates each attempt; validation removes an invalid
  selected artifact, and a failed candidate leaves prior valid content intact.
  It performs at most two revisions and three reviews. A missing or invalid
  review is non-blocking and stops this loop; this stage does not render slides
  or replace deterministic validation.

## Visual-Composition Seams

`0003-template-archive-and-carousel-art-direction` is Verified. It adds the
repository-owned `database-blueprint` archive and plans visual direction before
the existing renderer; `0004-constrained-slide-composition` remains Draft.

```text
0003: carousel-content.json → content validation → external snapshot preparation
      → carousel-art-director (once) → plan/boundary validation
      → unchanged fixed-variant population/export → PNG/manifest

0004: validated layout plan → carousel-composer → slide-bodies/<nn>.html
      → fixed shell assembly → validation → Playwright PNG export
```

- `0003` records the sole `database-blueprint` template, a closed
  template-specific motif, and one spatial composition, density, visual anchor,
  reading direction, and direction note per content slide. The archive wraps
  the existing `database` theme rather than adding another visual theme. The
  director creates no HTML, cannot alter content, has `carousel-layout.json` as
  its sole write, and is never retried or repaired.
- `0003` validation deterministically rejects unknown template, motif,
  vocabulary, or capability values and missing, extra, duplicate, or mismatched
  slide plans, and validates the protected boundary against its external
  snapshot. An invalid or missing plan emits diagnostics, does not retry,
  stops before population/export, and preserves prior complete renderer
  artifacts.
- `0004` introduces the composer. It creates only body fragments from the
  selected template contract and validated layout plan. It may use approved
  local SVG primitives; it cannot alter the header, footer, shell, CSS, scripts,
  external resources, or validated teaching claims.

Current closed variants remain until `0004` is verified, then the fixed-variant
path is removed. The `0004` implementation spec must define the exact safe
DOM/SVG policy and reserved-body measurement.

## Deferred Architecture

- Research/citation, visual review/repair, and publishing/scheduling are
  deferred roadmap ideas; no active milestone contract authorizes them.
- An AI theme, theme taxonomy or plugins, unbounded retry or repair loops,
  generated assets, caching, publishing, scheduling, analytics, web UI, authentication, and hosted
  execution are post-MVP.
- `docs/reference/html/index.html` is source material for the local
  `database` theme pack, not raw runtime HTML.
