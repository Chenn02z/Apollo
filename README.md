# Apollo

Apollo is a Codex-native staged workflow for turning a technical topic into an
interview-oriented carousel. Its shipped v1 creates a fixed seven-slide
carousel; its verified v2 path creates an adaptive 6–10-slide carousel.

## MVP

Use `apollo-generate` and `apollo-render` for the fixed v1 path, or
`apollo-generate-v2` and `apollo-render-v2` for adaptive v2 content such as
`ACID properties in databases`.

The v1 path produces:

- `request.json`
- `carousel-content.json`

The v2 path uses separate artifacts: `request-v2.json`,
`carousel-content-v2.json`, `index-v2.html`, `slides-v2/`, and
`render-manifest-v2.json`. Its 6–10 slide count comes only from the validated
content artifact and it performs deterministic structural, overflow, export,
and manifest checks. Apollo is local-only and Codex-native. Both paths produce
structured copy, constrained HTML, PNG slides, and a manifest.
Apollo does not run a standalone LLM API client or require a runtime API key.
V2 adds depth without changing the shipped v1 contract.

`docs/reference/html/index.html` is source material for the `database` theme
pack; it is not raw runtime output.

## Scope

Apollo is for creators making concise technical interview-preparation
carousels. The first proof set is ACID properties, indexes, caching, REST vs
GraphQL, and embeddings.

Source-backed research, citations, visual-review repair loops, an AI theme,
theme taxonomy or plugins, generated imagery, publishing, scheduling,
analytics, web UI, and authentication are post-MVP.

## Development

Milestones 0001, 0002, and 0003 are Verified. Milestone 0004 is Accepted for
v2-only reliability work; it is not shipped.

Renderer development uses Node 22 LTS. Run `npm ci`, then once run `npx
playwright install chromium`. The renderer's targeted checks are `npm run
test:renderer`.
