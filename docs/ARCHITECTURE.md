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
topic → `apollo-generate` → [carousel-writer → validation] × up to 3 → carousel-reviewer → [[candidate writer → validation] × up to 3 → promote → carousel-reviewer] × up to 2 → `apollo-render` → populate-carousel → HTML/validated PNG/manifest
```

## Current Boundaries

- **Run artifact boundary:** a run directory contains `request.json`,
  `carousel-content.json`, `index.html`, `slides/`, and `render-manifest.json`
  as stages complete; it may also contain `carousel-content.initial.json`,
  `carousel-content.before-revision-2.json`, and versioned
  `carousel-review-1.json` through `carousel-review-3.json` artifacts.
  Export stages PNGs before
  atomically replacing the complete renderer artifact set only after every
  content-derived screenshot succeeds. A failure preserves the prior complete
  set, or leaves no success manifest.
- **Content/HTML boundary:** `carousel-content.json` holds plain-text,
  layout-ready 7–10-slide copy. Its slide array is the sole slide-count source
  for validation, HTML, PNG export, and manifest creation. `apollo-render`
  runs `scripts/populate-carousel.mjs`, which deterministically expands the
  fixed local shell into one HTML page with escaped content slots.
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

## Planned Visual-Composition Seams

Milestones `0003-template-archive-and-carousel-art-direction` and
`0004-constrained-slide-composition` add two LLM stages between validated
content and deterministic assembly:

```text
carousel-content.json → carousel-art-director → carousel-layout.json
→ carousel-composer → slide-bodies/<nn>.html → fixed shell assembly
→ validation → Playwright PNG export
```

- `0003` introduces one repository-owned `database-blueprint` template archive,
  its contract, and the art director. The art director selects that template,
  a shared motif, per-slide composition, density, and visual anchor; it creates
  no HTML and cannot alter content. Plan validation rejects unknown templates,
  unsupported capabilities, and missing or extra slide plans.
- `0004` introduces the composer. It creates only body fragments from the selected template contract
  and the approved layout plan. It may use approved local SVG primitives; it
  cannot alter the header, footer, shell, CSS, scripts, external resources, or
  validated teaching claims.
- Deterministic code validates the layout plan and body fragments, reserves the
  body region between fixed header/footer chrome, assembles the shell, enforces
  HTML/SVG safety and browser layout, and exports PNGs atomically.

The initial template choice is recorded for reproducibility even though only
one template ships first. Current closed variants remain until `0004` is
verified, then the fixed-variant path is removed. Invalid plan or composer
output fails with diagnostics; neither stage has an automatic retry/repair
loop. The implementation spec must define the exact safe DOM/SVG policy and
reserved-body measurement.

## Deferred Architecture

- Research/citation, visual review/repair, and publishing/scheduling are
  deferred roadmap ideas; no active milestone contract authorizes them.
- An AI theme, theme taxonomy or plugins, unbounded retry or repair loops,
  generated assets, caching, publishing, scheduling, analytics, web UI, authentication, and hosted
  execution are post-MVP.
- `docs/reference/html/index.html` is source material for the local
  `database` theme pack, not raw runtime HTML.
