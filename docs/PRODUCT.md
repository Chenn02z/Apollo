# Apollo Product

## Product Intent

Apollo is a local CLI that turns a technical topic into a seven-slide,
interview-oriented PNG carousel. It gives a technical-content creator a
repeatable way to produce clear, consistently themed educational slides without
manually editing HTML.

## Target User And Pain

The initial user is a creator producing technical interview-preparation
content. They need concise, accurate-enough-for-manual-review slides with
consistent visual presentation; composing each carousel by hand is slow and
visually inconsistent.

## MVP Boundary

The MVP is complete when `apollo generate "<topic>"` runs locally using Node
and Playwright and creates, without manual HTML edits:

- `request.json` and `carousel-content.json`
- one `index.html`
- seven 1080×1350 PNG slides using one fixed theme and seven fixed layouts
- `render-manifest.json`
- actionable failure diagnostics when text or slide content overflows

It uses one content-generation pass with no formal source/citation workflow.
It is manually reviewed against ACID properties, indexes, caching, REST vs
GraphQL, and embeddings.

## Product Principles

- **Meaning in data; pixels in code.** Content is structured data; the fixed
  renderer owns dimensions, layout, and image production.
- **One idea per slide.** Keep technical explanations concise, diagram-led,
  and suitable for a phone screen.
- **One visual identity first.** Consistency beats theme choice breadth.
- **Inspectable local output.** Every run leaves its input, content, HTML,
  images, and manifest together.
- **Reference, not reuse.** `docs/reference/html/index.html` informs the
  quality bar but is not runtime or renderer code.

## Explicit Post-MVP Cutoff

- multi-agent orchestration and retries
- source-backed research and citations
- visual-spec artifacts, vision review, and automated repair loops
- generated image assets
- more themes, a topic taxonomy, caching, or scheduling
- publishing, analytics, web UI, authentication, and hosted workflows

## Success Metric

All five proof topics render seven legible, consistently themed PNG slides at
the required dimensions with no deterministic overflow failures and no manual
HTML editing.

## MVP Milestone Ladder

1. `0001-carousel-contract-and-content`: CLI request and bounded seven-slide
   content artifact.
2. `0002-fixed-carousel-renderer`: fixed theme/layout renderer and local PNG
   export.
3. `0003-render-validation-and-mvp-proof`: deterministic validation and the
   five-topic manual proof set.
