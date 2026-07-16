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
  content whose 7–10 slides determine the rendered slide count. It is the
  verified authoring/review boundary. Initial generation gets up to three
  writer attempts; validation removes an invalid selected artifact. Current
  content retains its closed `variant` fields until the composition milestone
  replaces that renderer contract.
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
- **fixed-shell renderer:** the current implemented renderer: one local
  `database` shell with six closed variants, fixed header/footer chrome, and
  deterministic HTML, browser-layout, export, and publication checks.
- **carousel art director (planned):** an LLM stage that reads validated
  content and available template contracts, selects the initial
  `database-blueprint` template and carousel motif, and writes
  `carousel-layout.json`; it does not create HTML or alter teaching content.
- **carousel composer (planned):** an LLM stage that turns validated content,
  an approved layout plan, and a template contract into one safe slide-body
  HTML fragment per slide. It cannot alter the shared shell, templates,
  content claims, scripts, or external resources.
- **template contract (planned):** a repository-owned declaration of the
  permitted body tags, classes, visual primitives, and SVG subset for a named
  template.
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
- Template archive/art direction and constrained composition are planned
  milestones, not current capabilities. Formal citations, visual review/repair,
  and publishing/scheduling are deferred roadmap ideas.
  Generated imagery, an AI theme, theme taxonomy or plugins, unbounded retry
  or repair loops, analytics, web UI, and authentication remain out of scope.
- The proof topics are ACID properties, indexes, caching, REST vs GraphQL, and
  embeddings; review of their factual quality is manual in the MVP.

## Maturity Gaps

- `0001-adaptive-carousel-content` is user-Verified, including bounded review
  and revision. Existing fixed-shell render/export code is Implemented but has
  not been user-Verified as a milestone.
- `0003-template-archive-and-carousel-art-direction` and
  `0004-constrained-slide-composition` open the next seams without moving
  shell, safety, or screenshot ownership out of deterministic code.

## Workflow Boundaries

- `0001-adaptive-carousel-content` is Verified; `0002` is Implemented;
  `0003` and `0004` are Draft.
- `docs/PRODUCT.md` owns product intent and scope;
  `docs/ARCHITECTURE.md` owns implementation boundaries; this file owns durable
  terminology.
