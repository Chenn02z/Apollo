# Apollo Architecture

## Current Structure

Apollo includes verified v1 content and renderer stages plus a verified parallel
v2 `apollo-generate-v2` and `apollo-render-v2` path for adaptive 6–10-slide
content. The v2 path performs deterministic structural, overflow, export, and
manifest validation without changing v1 runs or defaults. The workspace also
includes a visual/content reference at `docs/reference/html/index.html`.

The MVP runtime is a local Codex-native staged workflow. Skills enter stages,
Codex custom agents perform bounded generation work, and deterministic local
tools support rendering and validation. It writes each generation to an
inspectable run directory rather than a database or service; it has no
standalone LLM API client or runtime API key.

## MVP Flow

```text
topic → `apollo-generate` → carousel-writer → v1 JSON → `apollo-render` → carousel-renderer → v1 HTML/PNG/manifest
topic → `apollo-generate-v2` → carousel-writer-v2 → v2 JSON → `apollo-render-v2` → carousel-renderer-v2 → v2 HTML/validated PNG/manifest
```

## Approved MVP Boundaries

These are the approved boundaries for the staged implementation.

- **Run artifact boundary:** a run directory contains the artifacts available
  after its completed stages. Milestone 0001 writes only request and validated
  content; later stages add HTML, images, and a manifest. Export stages PNGs
  before atomically replacing the complete renderer artifact set only after all
  the required v1 seven or v2 content-derived screenshots succeed. A failure
  preserves the prior complete set, or leaves no success manifest. This makes
  failed output inspectable and permits a future stage to consume prior
  artifacts.
- **Content/HTML boundary:** v1 `carousel-content.json` holds
  fixed seven-slide copy and layout-ready fields. The shipped `apollo-generate`
  and `apollo-render` remain v1 defaults; `apollo-render` delegates once to
  `carousel-renderer`, which turns it into one HTML page. Milestone 0003 adds
  the separate `apollo-generate-v2` and `apollo-render-v2` path, whose 6–10
  slide array is the sole slide-count source for validation, HTML, PNG export,
  and manifest creation; v1 behavior remains unchanged.
- **Theme/HTML boundary:** repository-owned visual assets, including vendored
  fonts, form one local 1080×1350 `database` theme pack. V1 output remains
  exactly seven sequential identifiable slides; v2 supports 6–10 ordered
  slides. Both paths use only this pack, with no scripts, network access, or
  external assets.
- **HTML/export boundary:** the renderer stage uses Playwright with network
  routes aborted to deterministically screenshot each constrained slide to
  PNG; it does not make visual or content decisions.
- **Validation boundary:** v2 reports deterministic dimensions, content-derived
  slide count, and overflow failures independently from content generation;
  it validates structural limits, not semantic concreteness. Its deterministic
  validation is shipped; milestone 0004 owns v2-only fixed-shell fidelity,
  calibrated capacity, strict overflow validation, and the five-topic proof.

## Deferred Architecture

- Research, citation, visual-spec, and vision-review stages are post-MVP;
  their artifact contracts must not be built until their milestone is shaped.
- An AI theme, theme taxonomy or plugins, retries, generated assets, caching,
  publishing, scheduling, analytics, web UI, authentication, and hosted
  execution are post-MVP.
- `docs/reference/html/index.html` is source material for the local
  `database` theme pack, not raw runtime HTML.
