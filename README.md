# Apollo

Apollo is a Codex-native staged workflow for turning a technical topic into an
adaptive 7–10-slide, interview-oriented carousel.

## MVP

Use `apollo-generate` to create and review structured content, then
`apollo-render` to deterministically populate the fixed local shell and export
1080×1350 PNG slides. Each local run has:

- `request.json`
- `carousel-content.json`
- `carousel-layout.json`
- optionally, `carousel-content.initial.json` and `carousel-content.before-revision-2.json`
- `carousel-review-1.json` through `carousel-review-3.json` for completed content reviews
- `slide-bodies/`
- `index.html`
- `slides/`
- `render-manifest.json`

The validated content artifact alone determines the 7–10 slide count. Apollo
performs deterministic structural, overflow, export, and manifest checks. It
is local-only and Codex-native: no standalone LLM API client or runtime API key
is required. Initial content and each review-requested candidate get up to
three writer attempts. A completed `approve_with_warnings` or `reject` review
can trigger up to two candidate rewrites and three reviews total. Each
candidate is validated before it replaces the last valid content artifact; an
invalid selected artifact is removed by validation, and an unavailable or
invalid review never blocks run creation.

`docs/reference/html/index.html` is source material for the `database` theme
pack; it is not raw runtime output.

## Scope

Apollo is for creators making concise technical interview-preparation
carousels. The first proof set is ACID properties, indexes, caching, REST vs
GraphQL, and embeddings.

The render stage validates semantic content, prepares an external boundary
snapshot, invokes `carousel-art-director` once to create validated creative
direction in `carousel-layout.json`, then `carousel-composer` authors free-flow
body copy and arrangement in exact `slide-bodies/` fragments from the content,
layout direction, and canonical shell only; new bodies cannot use legacy
`cp-*` primitives. The art director and deterministic renderer retain the
template and theme inputs. Deterministic code safely validates and inserts the
fragments into the unchanged database shell, preserves shell-owned topic,
number, role, title, why, glossary, and footer copy, checks reserved-body
containment in Playwright, and atomically publishes fragments, HTML, PNGs, and
the manifest last.
Research/citations, visual-review repair loops, publishing, scheduling,
analytics, web UI, and authentication are deferred roadmap ideas. Generated
imagery, an AI theme, and a theme taxonomy or plugin system remain out of
scope.

## Development

`0001-adaptive-carousel-content` is user-Verified, including the bounded
writer/reviewer/revision loop, and ends at validated `carousel-content.json`.
`0002-deterministic-fixed-shell-rendering-baseline` is user-Verified: its
historical six-variant render/export baseline preceded the fixed-shell migration.
`0003-template-archive-and-carousel-art-direction` is user-Verified: the
`database-blueprint` archive and closed art-direction plan are current.
`0004-constrained-slide-composition` is historically Verified: it established
layout-neutral semantic content, constrained body fragments, fixed-shell
assembly, and atomic export publication.
`0005-free-flow-slide-bodies` is Verified and defines the live body-composition
seam: composer-authored copy and arrangement with the fixed shell and
deterministic safety, export, rollback, and publication boundaries preserved.
`0006-increase-slide-body-utilization` is Accepted and pending implementation;
it plans richer slide briefs plus a 70% qualifying body-span check, while
`0005` remains the live contract.
`0007-carousel-treatment-variety` is Verified; it
uses the existing layout direction note to assign varied information treatments
and reading paths without changing schemas, pipeline stages, or validators.

Renderer development uses Node 22 LTS. Run `npm ci`, then once run `npx
playwright install chromium`. The renderer's targeted checks are `npm run
test:renderer`.
