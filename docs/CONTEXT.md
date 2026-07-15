# Apollo Context

## Canonical Terms

- **Apollo:** the local technical-carousel generator in this workspace.
- **topic:** the user-supplied technical subject passed to `apollo generate`.
- **run:** one generated output directory containing the request, content,
  HTML, images, and manifest.
- **content artifact:** `carousel-content.json`, the bounded seven-slide copy
  consumed by the renderer.
- **fixed renderer:** the Node/Playwright implementation that maps the content
  artifact to one themed HTML page and seven PNG slides.
- **layout:** one of the seven MVP slide structures. Layouts are fixed, not
  agent-designed.
- **theme:** the single consistent visual identity used in the MVP.
- **overflow diagnostic:** a deterministic rendering failure that identifies
  slide content exceeding its rendered bounds.
- **reference HTML:** `docs/reference/html/index.html`; it sets the intended
  teaching and visual direction but is not production renderer code.

## Product Boundaries

- The MVP is a local Node + Playwright CLI: `apollo generate "<topic>"`.
- A successful MVP run generates request/content JSON, HTML, seven 1080×1350
  PNGs, and a render manifest without manual HTML editing.
- Formal citations, specialist-agent orchestration, visual-spec artifacts,
  vision repair, generated imagery, extra themes, publishing, scheduling,
  analytics, web UI, and authentication are post-MVP.
- The proof topics are ACID properties, indexes, caching, REST vs GraphQL, and
  embeddings; review of their factual quality is manual in the MVP.

## Maturity Gaps

- Node, Playwright, package-manager, and verification commands are not yet
  established. The first implementation milestone must record them.

## Workflow Boundaries

- The three MVP milestones are Draft and must go through `$requirements`
  before `$spec` or implementation.
- `docs/PRODUCT.md` owns product intent and scope;
  `docs/ARCHITECTURE.md` owns implementation boundaries;
  this file owns durable terminology.
