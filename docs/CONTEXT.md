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
- **renderer stage:** `apollo-render` validates a content artifact, delegates
  once to `carousel-renderer` for HTML, then uses deterministic local tools for
  PNG export and the manifest.
- **database theme pack:** the sole local 1080×1350 MVP visual system, derived
  from `docs/reference/html/index.html` and stored as repository-owned assets
  and templates.
- **constrained HTML contract:** seven ordered identifiable 1080×1350 slides;
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
  `carousel-content.json`. The Accepted renderer stage adds HTML, PNG, and a
  manifest; validation remains a later stage.
- Formal citations, an AI theme, theme taxonomy or plugins, retries,
  visual-spec artifacts, vision repair, generated imagery, publishing,
  scheduling, analytics, web UI, and authentication are post-MVP.
- The proof topics are ACID properties, indexes, caching, REST vs GraphQL, and
  embeddings; review of their factual quality is manual in the MVP.

## Maturity Gaps

- Overflow diagnostics and the five-topic proof remain future validation-stage
  work.

## Workflow Boundaries

- Milestone `0001` is Verified; `0002` is Accepted and may proceed to `$spec`.
  Milestone `0003` remains Draft and must go through `$requirements` before
  `$spec` or implementation.
- `docs/PRODUCT.md` owns product intent and scope;
  `docs/ARCHITECTURE.md` owns implementation boundaries;
  this file owns durable terminology.
