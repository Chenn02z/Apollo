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

## MVP Flow

```text
topic → `apollo-generate` → [carousel-writer → validation] × up to 3 → carousel-reviewer → [[candidate writer → validation] × up to 3 → promote → carousel-reviewer] × up to 2 → `apollo-render` → populate-carousel → HTML/validated PNG/manifest
```

## Approved MVP Boundaries

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
  Milestone `0004-pipeline-reliability` owns fixed-shell fidelity, calibrated
  capacity, strict overflow validation, and the five-topic proof.
- **Review/rewrite boundary:** `carousel-reviewer` evaluates validated content
  and writes a versioned review that Apollo deterministically validates. An
  `approve_with_warnings` or `reject` decision may cause `carousel-writer` to
  write a candidate, with up to three attempts for initial content and each
  candidate. Apollo validates each attempt; validation removes an invalid
  selected artifact, and a failed candidate leaves prior valid content intact.
  It performs at most two revisions and three reviews. A missing or invalid
  review is non-blocking and stops this loop; this stage does not render slides
  or replace deterministic validation.

## Deferred Architecture

- Research, citation, visual-spec, and vision-review stages are post-MVP;
  their artifact contracts must not be built until their milestone is shaped.
- An AI theme, theme taxonomy or plugins, unbounded retry or repair loops,
  generated assets, caching, publishing, scheduling, analytics, web UI, authentication, and hosted
  execution are post-MVP.
- `docs/reference/html/index.html` is source material for the local
  `database` theme pack, not raw runtime HTML.
