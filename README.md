# Apollo

Apollo is a Codex-native staged workflow for turning a technical topic into an
adaptive 7–10-slide, interview-oriented carousel.

## MVP

Use `apollo-generate` to create structured content, then `apollo-render` to
deterministically populate the fixed local shell and export 1080×1350 PNG
slides. Each local run contains:

- `request.json`
- `carousel-content.json`
- `index.html`
- `slides/`
- `render-manifest.json`

The validated content artifact alone determines the 7–10 slide count. Apollo
performs deterministic structural, overflow, export, and manifest checks. It
is local-only and Codex-native: no standalone LLM API client or runtime API key
is required.

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

Milestone `0003-adaptive-carousel-content` is Verified. Milestone
`0004-pipeline-reliability` is Accepted for reliability work and the five-topic
proof; it is not shipped.

Renderer development uses Node 22 LTS. Run `npm ci`, then once run `npx
playwright install chromium`. The renderer's targeted checks are `npm run
test:renderer`.
