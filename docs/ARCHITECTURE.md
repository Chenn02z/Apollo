# Apollo Architecture

## Current Structure

Apollo includes the verified content-stage runtime and a visual/content
reference at `docs/reference/html/index.html`. The renderer stage is Accepted
but not implemented; render validation remains a later milestone.

The MVP runtime is a local Codex-native staged workflow. Skills enter stages,
Codex custom agents perform bounded generation work, and deterministic local
tools support rendering and validation. It writes each generation to an
inspectable run directory rather than a database or service; it has no
standalone LLM API client or runtime API key.

## MVP Flow

```text
topic → `apollo-generate` skill → carousel-writer → request/content JSON → `apollo-render` → carousel-renderer → HTML/PNG/manifest → future validator
```

## Approved MVP Boundaries

These are the approved boundaries for the staged implementation.

- **Run artifact boundary:** a run directory contains the artifacts available
  after its completed stages. Milestone 0001 writes only request and validated
  content; later stages add HTML, images, and a manifest. Export stages PNGs
  before atomically replacing the complete renderer artifact set only after all
  seven screenshots succeed. A failure preserves the prior complete set, or
  leaves no success manifest. This makes failed output inspectable and permits
  a future stage to consume prior artifacts.
- **Content/HTML boundary:** milestone 0001's `carousel-content.json` holds
  slide copy and layout-ready fields. The Accepted `apollo-render` stage
  validates it and delegates once to `carousel-renderer`, which turns it into
  one HTML page; future research stages can replace the content producer
  without rewriting export code.
- **Theme/HTML boundary:** repository-owned visual assets, including vendored
  fonts, form one local 1080×1350 `database` theme pack. `carousel-renderer`
  may use only this pack and must output exactly seven sequential identifiable
  slides, with no scripts, network access, or external assets.
- **HTML/export boundary:** the renderer stage uses Playwright with network
  routes aborted to deterministically screenshot each constrained slide to
  PNG; it does not make visual or content decisions.
- **Validation boundary:** the future Codex-native validator reports
  deterministic dimensions, slide count, and overflow failures independently
  from content generation.

## Deferred Architecture

- Research, citation, visual-spec, and vision-review stages are post-MVP;
  their artifact contracts must not be built until their milestone is shaped.
- An AI theme, theme taxonomy or plugins, retries, generated assets, caching,
  publishing, scheduling, analytics, web UI, authentication, and hosted
  execution are post-MVP.
- `docs/reference/html/index.html` is source material for the local
  `database` theme pack, not raw runtime HTML.
