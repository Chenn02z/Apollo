# Apollo Context

## Canonical Terms

- **Apollo:** the Codex-native technical-carousel workflow in this workspace.
- **topic:** the user-supplied technical subject passed to `apollo-generate`.
- **Codex-native stage:** a bounded workflow stage entered through a Codex
  skill and performed by a Codex custom agent or deterministic local tool.
- **run:** one generated output directory containing `request.json`,
  `carousel-content.json`, `carousel-layout.json`, `composition.html`, `index.html`,
  `slides/`, and `render-manifest.json` as its stages complete; it may also
  contain preserved content artifacts and versioned best-effort review artifacts.
- **recovery record:** a sanitized, append-only diagnostic event the workflow
  appends to a run's `recovery-log.jsonl` when a post-run failure is recorded;
  `recovery-history.jsonl` is workspace-local, untracked, untrusted diagnostic
  memory used to recognize prior failures. Neither is a prompt instruction or
  publication artifact.
- **bounded recovery:** up to two `carousel-recovery` delegations per
  top-level invocation for recoverable generate or render failures. A repeated
  signature or exhausted budget stops; unbounded retry and vision repair remain
  out of scope.
- **content artifact:** `carousel-content.json`, bounded plain-text teaching
  content whose 7–10 slides determine the rendered slide count. It is the
  verified authoring/review boundary. Initial generation gets up to three
  writer attempts; validation removes an invalid selected artifact. Each slide
  has layout-neutral semantic content from a closed content vocabulary; legacy
  visual `variant` fields are rejected. During composition, `slide.content` is
  a non-binding creative brief rather than final rendered body copy.
- **content archives:** `carousel-content.initial.json` preserves the initial
  validated content before revision 1; `carousel-content.before-revision-2.json`
  preserves the next validated content before revision 2. Neither is overwritten.
- **review artifact:** an evidence-backed, versioned
  `carousel-review-<n>.json` publishability review, where `<n>` is 1 through
  2. `apollo-generate` validates each review before branching. An
  `approve_with_warnings` or `reject` decision may ask `carousel-writer` for a
  candidate revision, with up to three writer attempts for that candidate.
  Apollo validates it before promotion and preserves prior valid content when
  validation removes an invalid candidate. There are at most two revisions and
  two reviews; a missing or invalid review is non-blocking and ends that loop.
- **renderer stage:** `apollo-render` validates content, prepares an external
  snapshot of the protected boundary, delegates once to `carousel-art-director`,
  validates the layout plan and boundary, then delegates once to
  `carousel-composer` to author `composition.html`. Deterministic code validates
  its ordered slides, performs PNG export, and atomically publishes the
  composition with the manifest last.
- **fixed-shell renderer:** one local `database` shell with fixed
  header, footer, title, why, and glossary regions plus deterministic HTML,
  browser-layout, export, and publication checks.
- **carousel recovery:** a narrowly scoped runtime repair role. It may repair a
  generate candidate from a valid checkpoint, or a non-protected layout or
  `composition.html` during render. Initial-content, review, state,
  protected-boundary, integrity, browser, export, and publication errors are
  terminal; it does not rerun art direction or composition.
- **carousel art director:** an LLM stage that reads validated content and the
  available template contract, records the version-2 `database-blueprint`
  template and `blueprint` motif, and writes only `carousel-layout.json` exactly
  once; it does not create HTML, alter teaching content, retry, or repair.
- **layout plan:** `carousel-layout.json`, the validated art-direction artifact
  specified for `0003`. It records one template and motif per carousel plus exactly one
  per-content-slide plan with `composition`, `density`, `visualAnchor`,
  `direction`, and non-empty `directionNote`. Composition is spatial planning,
  not a semantic content variant: `minimal`, `editorial`, `split`, `grid`,
  `flow`, or `focus`; density is `sparse`, `standard`, or `dense`; visual anchor
  is `headline`, `statement`, `diagram`, `sequence`, `contrast`, or
  `collection`; direction is `centered`, `top-down`, `left-right`, or `radial`.
  Motifs are closed values defined by the selected template contract. The plan
  is validated creative direction, not a DOM arrangement contract. `0007` uses
  `directionNote` to assign each slide's information treatment and
  reading path across the carousel, with justified repetition allowed. An optional
  valid `repeatJustification` is accepted and ignored after plan validation;
  repeated body arrangements produce no deterministic warning.
- **carousel composer:** the runtime writer that turns validated content as a
  creative brief and the approved layout plan as creative direction into
  complete `composition.html` document. It owns the document's HTML/CSS/SVG
  treatments and cannot alter content, layout, source assets, or published
  PNG/manifest artifacts. `0007` directs it to implement the assigned
  treatment and reading path rather than default to a minimum repeated body
  structure.
- **template contract:** the repository-owned version-2 layout-capability
  contract for a named template: its fixed motif and accepted composition,
  density, visual-anchor, and reading-direction vocabulary. It has no fragment
  vocabulary.
- **database theme pack:** the sole local 1080×1350 MVP visual system, derived
  from `docs/reference/html/index.html` and stored as canonical
  repository-owned assets and templates. The `database-blueprint` archive
  references this theme; it is not a second visual theme. The art director and
  renderer retain it, while legacy `cp-*` CSS remains embedded in the canonical
  theme for compatibility but is unreachable to newly validated slide bodies
  because `cp-*` classes are rejected.
- **safe HTML contract:** 7–10 ordered identifiable 1080×1350 slides with
  validated self-contained HTML/SVG bodies, approved local theme assets only,
  and no scripts, network access, or external assets.
- **roles:** the closed set `hook`, `overview`, `concept`, `example`,
  `deep-dive`, `interview`, and `takeaway`; `hook` is first, exactly one
  `overview` is second, and `takeaway` is last. Intermediate roles may repeat;
  `interview` is optional.
- **overflow diagnostic:** a deterministic rendering failure that identifies
  slide content exceeding its rendered bounds.
- **body-underfill diagnostic:** a deterministic rendering failure when
  qualifying visible text and painted SVG geometry span less than an unrounded
  70% of the `.slide-body` CSS content-box height. It is geometric and remains
  distinct from writer, reviewer, and manual review of semantic depth.
- **reference HTML:** `docs/reference/html/index.html`; source material for the
  `database` theme pack, not raw production runtime output.

## Product Boundaries

- The MVP is a local Codex-native staged workflow. `apollo-generate` is its
  content-stage entry skill; there is no shell CLI, standalone LLM API client,
  or runtime API key.
- The workflow produces a validated 7–10-slide content artifact, HTML, PNGs,
  and a manifest. Deterministic checks validate structural limits, dimensions,
  slide count, and rendered capacity before publication.
- Template archive, validated creative direction, and free-flow slide-body
  composition and bounded recovery are current capabilities. Formal citations,
  vision repair, and publishing/scheduling are deferred roadmap ideas.
  Generated imagery, an AI theme, theme taxonomy or plugins, unbounded retry
  or repair loops, analytics, web UI, and authentication remain out of scope.
- The proof topics are ACID properties, indexes, caching, REST vs GraphQL, and
  embeddings; review of their factual quality is manual in the MVP.

## Maturity Gaps

- `0003-template-archive-and-carousel-art-direction`,
  `0004-constrained-slide-composition`, and `0005-free-flow-slide-bodies` are
  Verified. `0005` opens body-copy and arrangement authorship to the composer;
  shell, safety, containment, export, rollback, and publication ownership stay
  in deterministic code.
- `0006-increase-slide-body-utilization` is Verified. It requires richer
  writer/reviewer slide briefs and a deterministic unrounded 70% qualifying
  vertical-span check, without changing schemas, workflow stages, retries,
  correction, shell, theme, rollback, or publication seams.
- `0007-carousel-treatment-variety` is Verified. It provides prompt-only
  carousel-level treatment and reading-path variety through the
  existing `directionNote`, without schema, pipeline, or validator changes.

## Workflow Boundaries

- `0001-adaptive-carousel-content`, `0002`, `0003`, `0004`, `0005`, and
  `0006-increase-slide-body-utilization` are Verified.
- `0007-carousel-treatment-variety` is Verified.
- `docs/PRODUCT.md` owns product intent and scope;
  `docs/ARCHITECTURE.md` owns implementation boundaries; this file owns durable
  terminology.
