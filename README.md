# Apollo

Apollo turns a technical topic into a locally rendered, interview-oriented
carousel: seven legible 1080×1350 PNG slides with a consistent visual theme.

## MVP

```bash
apollo generate "ACID properties in databases"
```

The command will produce a run directory containing:

- `request.json`
- `carousel-content.json`
- `index.html`
- seven PNG slides
- `render-manifest.json`

The MVP is local-only. It uses Node and Playwright, one fixed theme, seven
fixed layouts, one content-generation pass, and deterministic checks for slide
dimensions, count, and overflow.

`docs/reference/html/index.html` is the content and visual-quality reference;
it is not renderer code.

## Scope

Apollo is for creators making concise technical interview-preparation
carousels. The first proof set is ACID properties, indexes, caching, REST vs
GraphQL, and embeddings.

Source-backed research, citations, visual-review repair loops, additional
themes, generated imagery, publishing, scheduling, analytics, web UI, and
authentication are post-MVP.

## Development

The product is being bootstrapped. Shape Draft milestones through
`$requirements`, create an Accepted implementation contract with `$spec`, then
implement through `$dev-loop`.
