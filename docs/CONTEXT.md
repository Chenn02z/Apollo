# Apollo Context

## Canonical Terms

- **Apollo:** the Codex-native technical-carousel workflow in this workspace.
- **topic:** the user-supplied technical subject passed to `apollo-generate`.
- **Codex-native stage:** a bounded workflow stage entered through a Codex
  skill and performed by a Codex custom agent or deterministic local tool.
- **run:** one generated output directory containing artifacts completed so
  far. Milestone 0001 has `request.json` and validated
  `carousel-content.json`; later Codex-native stages add HTML, images, and a
  manifest.
- **content artifact:** `carousel-content.json`, the bounded seven-slide copy
  consumed by the renderer.
- **HTML/render worker:** the future Codex custom agent stage that turns the
  content artifact into constrained HTML using approved local theme assets,
  then produces HTML, PNGs, and a manifest with deterministic local tools.
- **database theme pack:** the sole local 1080×1350 MVP visual system, derived
  from `docs/reference/html/index.html` and stored as repository-owned assets
  and templates.
- **constrained HTML contract:** exactly seven sequential identifiable slides;
  approved local theme assets only; no scripts, network access, or external
  assets.
- **overflow diagnostic:** a deterministic rendering failure that identifies
  slide content exceeding its rendered bounds.
- **reference HTML:** `docs/reference/html/index.html`; source material for the
  `database` theme pack, not raw production runtime output.

## Product Boundaries

- The MVP is a local Codex-native staged workflow. `apollo-generate` is its
  content-stage entry skill; there is no shell CLI, standalone LLM API client,
  or runtime API key.
- Milestone 0001 produces only `request.json` and validated
  `carousel-content.json`. Future Codex-native HTML/render and validation
  stages produce the remaining HTML, PNG, manifest, and validation artifacts.
- Formal citations, an AI theme, theme taxonomy or plugins, retries,
  visual-spec artifacts, vision repair, generated imagery, publishing,
  scheduling, analytics, web UI, and authentication are post-MVP.
- The proof topics are ACID properties, indexes, caching, REST vs GraphQL, and
  embeddings; review of their factual quality is manual in the MVP.

## Maturity Gaps

- Local render/export and validation tool commands are not yet established;
  their respective future stages must record them.

## Workflow Boundaries

- Milestone `0001` is Verified. Milestones `0002` and `0003` remain Draft and
  must go through `$requirements` before `$spec` or implementation.
- `docs/PRODUCT.md` owns product intent and scope;
  `docs/ARCHITECTURE.md` owns implementation boundaries;
  this file owns durable terminology.
