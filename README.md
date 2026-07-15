# Apollo

Apollo is a Codex-native staged workflow for turning a technical topic into an
interview-oriented carousel: seven legible 1080×1350 PNG slides with a
consistent visual theme.

## MVP

Invoke the `apollo-generate` Codex skill (explicitly, or through an equivalent
carousel-generation request) with a topic such as `ACID properties in databases`.

The staged workflow will produce a run directory containing:

- `request.json`
- `carousel-content.json`
- `index.html`
- seven PNG slides
- `render-manifest.json`

The MVP is local-only and Codex-native. Custom-agent workers produce structured
content and constrained HTML; Playwright screenshots that HTML. Apollo does not
run a standalone LLM API client or require a runtime API key. A
repository-owned `database` theme pack supplies the local visual assets and
templates; the HTML/render worker must produce seven sequential slides using
only those approved assets. Deterministic validation follows in milestone 0003.

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

The product is being bootstrapped. Shape Draft milestones through
`$requirements`, create an Accepted implementation contract with `$spec`, then
implement through `$dev-loop`.
