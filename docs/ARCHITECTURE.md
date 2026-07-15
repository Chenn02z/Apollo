# Apollo Architecture

## Current Structure

Apollo currently contains its product documentation and a visual/content
reference at `docs/reference/html/index.html`. It has no product runtime yet.

The MVP runtime is a local Codex-native staged workflow. Skills enter stages,
Codex custom agents perform bounded generation work, and deterministic local
tools support rendering and validation. It writes each generation to an
inspectable run directory rather than a database or service; it has no
standalone LLM API client or runtime API key.

## MVP Flow

```text
topic → `apollo-generate` skill → carousel-writer → request/content JSON → future HTML/render worker → HTML/PNG/manifest → future validator
```

## Approved MVP Boundaries

These are the minimum boundaries the first implementation must establish.

- **Run artifact boundary:** a run directory contains the artifacts available
  after its completed stages. Milestone 0001 writes only request and validated
  content; later stages add HTML, images, and a manifest. This makes failed
  output inspectable and permits a future stage to consume prior artifacts.
- **Content/HTML boundary:** milestone 0001's `carousel-content.json` holds
  slide copy and layout-ready fields. The future Codex-native HTML/render
  worker turns it into one HTML page; future research stages can replace the
  content producer without rewriting export code.
- **Theme/HTML boundary:** repository-owned visual assets and templates form
  one local 1080×1350 `database` theme pack. The future HTML/render worker may
  use only this pack and must output exactly seven sequential identifiable
  slides, with no scripts, network access, or external assets.
- **HTML/export boundary:** the future HTML/render stage uses Playwright to
  deterministically screenshot each constrained slide to PNG; it does not make
  visual or content decisions.
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
