# Apollo Architecture

## Current Structure

Apollo currently contains its product documentation and a visual/content
reference at `docs/reference/html/index.html`. It has no product runtime yet.

The MVP runtime will be a local Node CLI using Playwright. It will write each
generation to an inspectable run directory rather than a database or service.

## MVP Flow

```text
topic → request/content JSON → fixed HTML renderer → Playwright PNG export → validation
```

## Approved MVP Boundaries

These are the minimum boundaries the first implementation must establish.

- **Run artifact boundary:** a run directory contains request, content, HTML,
  images, and manifest. This makes a failed output inspectable and permits a
  future stage to consume prior artifacts.
- **Content/render boundary:** `carousel-content.json` holds slide copy and
  layout-ready fields; the renderer turns that data into HTML and PNGs. Future
  research or visual-planning stages can replace the producer without rewriting
  export code.
- **Renderer/layout boundary:** one renderer selects from exactly seven fixed
  layouts under one fixed theme. New themes or layouts remain later additions,
  not an MVP plugin system.
- **Validation boundary:** rendering reports deterministic dimensions, slide
  count, and overflow failures independently from content generation.

## Deferred Architecture

- Research, citation, visual-spec, and vision-review stages are post-MVP;
  their artifact contracts must not be built until their milestone is shaped.
- Generated assets, multiple themes, caching, publishing, scheduling,
  analytics, web UI, authentication, and hosted execution are post-MVP.
- The reference HTML stays isolated from the renderer until a future accepted
  milestone explicitly imports a reusable pattern from it.
