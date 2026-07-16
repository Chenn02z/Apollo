# Apollo

Apollo is a Codex-native staged workflow for turning a technical topic into an
adaptive 7–10-slide, interview-oriented carousel.

## MVP

Use `apollo-generate` to create and review structured content, then
`apollo-render` to deterministically populate the fixed local shell and export
1080×1350 PNG slides. Each local run has:

- `request.json`
- `carousel-content.json`
- optionally, `carousel-content.initial.json` and `carousel-content.before-revision-2.json`
- `carousel-review-1.json` through `carousel-review-3.json` for completed content reviews
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

The next stages split visual planning from composition: a template archive and
`carousel-art-director`, then constrained `carousel-composer` body fragments.
Research/citations, visual-review repair loops, publishing, scheduling,
analytics, web UI, and authentication are deferred roadmap ideas. Generated
imagery, an AI theme, and a theme taxonomy or plugin system remain out of
scope.

## Development

`0001-adaptive-carousel-content` is user-Verified, including the bounded
writer/reviewer/revision loop, and ends at validated `carousel-content.json`.
`0002-deterministic-fixed-shell-rendering-baseline` is user-Verified: it is
the current six-variant render/export baseline.
`0003-template-archive-and-carousel-art-direction` and
`0004-constrained-slide-composition` are Draft. Content still carries current
variant fields until `0004` is verified.

Renderer development uses Node 22 LTS. Run `npm ci`, then once run `npx
playwright install chromium`. The renderer's targeted checks are `npm run
test:renderer`.
