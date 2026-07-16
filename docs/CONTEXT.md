# Apollo Context

## Canonical Terms

- **Apollo:** the Codex-native technical-carousel workflow in this workspace.
- **topic:** the user-supplied technical subject passed to `apollo-generate`.
- **Codex-native stage:** a bounded workflow stage entered through a Codex
  skill and performed by a Codex custom agent or deterministic local tool.
- **run:** one generated output directory containing `request.json`,
  `carousel-content.json`, `index.html`, `slides/`, and `render-manifest.json`
  as its stages complete; it may also contain preserved content artifacts and
  versioned best-effort review artifacts.
- **content artifact:** `carousel-content.json`, bounded plain-text teaching
  content whose 7–10 slides determine the rendered slide count. Initial
  generation gets up to three writer attempts; validation removes an invalid
  selected artifact.
- **content archives:** `carousel-content.initial.json` preserves the initial
  validated content before revision 1; `carousel-content.before-revision-2.json`
  preserves the next validated content before revision 2. Neither is overwritten.
- **review artifact:** an evidence-backed, versioned
  `carousel-review-<n>.json` publishability review, where `<n>` is 1 through
  3. `apollo-generate` validates each review before branching. An
  `approve_with_warnings` or `reject` decision may ask `carousel-writer` for a
  candidate revision, with up to three writer attempts for that candidate.
  Apollo validates it before promotion and preserves prior valid content when
  validation removes an invalid candidate. There are at most two revisions and
  three reviews; a missing or invalid review is non-blocking and ends that loop.
- **renderer stage:** `apollo-render` validates the content artifact, then
  `scripts/populate-carousel.mjs` deterministically expands the fixed local
  shell with escaped slots before overflow checks, PNG export, and manifest
  creation.
- **database theme pack:** the sole local 1080×1350 MVP visual system, derived
  from `docs/reference/html/index.html` and stored as repository-owned assets
  and templates.
- **constrained HTML contract:** 7–10 ordered identifiable 1080×1350 slides
  using approved local theme assets only, with no scripts, network access, or
  external assets.
- **roles:** the closed set `hook`, `overview`, `concept`, `example`,
  `deep-dive`, `interview`, and `takeaway`; `hook` is first, exactly one
  `overview` is second, and `takeaway` is last. Intermediate roles may repeat;
  `interview` is optional.
- **overflow diagnostic:** a deterministic rendering failure that identifies
  slide content exceeding its rendered bounds.
- **reference HTML:** `docs/reference/html/index.html`; source material for the
  `database` theme pack, not raw production runtime output.

## Product Boundaries

- The MVP is a local Codex-native staged workflow. `apollo-generate` is its
  content-stage entry skill; there is no shell CLI, standalone LLM API client,
  or runtime API key.
- The workflow produces a validated 7–10-slide content artifact, HTML, PNGs,
  and a manifest. Deterministic checks validate structural limits, dimensions,
  slide count, and rendered capacity before publication.
- Formal citations, an AI theme, theme taxonomy or plugins, unbounded retry or
  repair loops, visual-spec artifacts, vision repair, generated imagery, publishing,
  scheduling, analytics, web UI, and authentication are post-MVP.
- The proof topics are ACID properties, indexes, caching, REST vs GraphQL, and
  embeddings; review of their factual quality is manual in the MVP.

## Maturity Gaps

- Milestone `0004-pipeline-reliability` is Accepted for reliability work and
  the five-topic proof; it is not shipped.

## Workflow Boundaries

- Milestone `0003-adaptive-carousel-content` is Verified. Milestone
  `0004-pipeline-reliability` is Accepted for spec authoring and is not yet
  implemented or verified.
- `docs/PRODUCT.md` owns product intent and scope;
  `docs/ARCHITECTURE.md` owns implementation boundaries; this file owns durable
  terminology.
