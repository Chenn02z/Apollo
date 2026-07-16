# Apollo Context

## Canonical Terms

- **Apollo:** the Codex-native technical-carousel workflow in this workspace.
- **topic:** the user-supplied technical subject passed to `apollo-generate`,
  or to `apollo-generate-v2` for the separate adaptive v2 path.
- **Codex-native stage:** a bounded workflow stage entered through a Codex
  skill and performed by a Codex custom agent or deterministic local tool.
- **run:** one generated output directory containing artifacts completed so
  far. V1 uses `request.json`, `carousel-content.json`, `index.html`, PNGs,
  and a manifest; the parallel v2 path uses `request-v2.json`,
  `carousel-content-v2.json`, `index-v2.html`, `slides-v2/`, and
  `render-manifest-v2.json`.
- **content artifact:** `carousel-content.json`, the bounded seven-slide copy
  consumed by the v1 renderer. A v2 content artifact uses 6–10 slides selected
  from its teaching beats; it is a parallel versioned path.
- **renderer stage:** `apollo-render` is the unchanged v1 default. The separate
  `apollo-render-v2` validates a v2 artifact, delegates once to
  `carousel-renderer-v2` for HTML, then uses deterministic local tools for
  overflow checks, PNG export, and the manifest.
- **database theme pack:** the sole local 1080×1350 MVP visual system, derived
  from `docs/reference/html/index.html` and stored as repository-owned assets
  and templates.
- **constrained HTML contract:** v1 has seven ordered identifiable 1080×1350
  slides; v2 has 6–10. Both use approved local theme assets only, with no
  scripts, network access, or external assets.
- **overflow diagnostic:** a deterministic rendering failure that identifies
  slide content exceeding its rendered bounds.
- **v2 roles:** the closed set `hook`, `overview`, `concept`, `example`,
  `deep-dive`, `interview`, and `takeaway`; `hook` is first, exactly one
  `overview` is second, and `takeaway` is last. Intermediate roles may repeat;
  `interview` is optional.
- **reference HTML:** `docs/reference/html/index.html`; source material for the
  `database` theme pack, not raw production runtime output.

## Product Boundaries

- The MVP is a local Codex-native staged workflow. `apollo-generate` is its
  content-stage entry skill; there is no shell CLI, standalone LLM API client,
  or runtime API key.
- The verified v1 workflow produces `request.json`, validated
  `carousel-content.json`, HTML, PNGs, and a manifest. The separate verified
  v2 workflow validates its 6–10-slide artifact and rendered capacity before
  publishing its v2 PNGs and manifest.
- Formal citations, an AI theme, theme taxonomy or plugins, retries,
  visual-spec artifacts, vision repair, generated imagery, publishing,
  scheduling, analytics, web UI, and authentication are post-MVP.
- The proof topics are ACID properties, indexes, caching, REST vs GraphQL, and
  embeddings; review of their factual quality is manual in the MVP.

## Maturity Gaps

- The broader five-topic proof remains future work.

## Workflow Boundaries

- Milestones `0001`, `0002`, and `0003` are Verified. `0004` remains Draft and must go through
  `$requirements` before `$spec` or implementation.
- `docs/PRODUCT.md` owns product intent and scope;
  `docs/ARCHITECTURE.md` owns implementation boundaries;
  this file owns durable terminology.
