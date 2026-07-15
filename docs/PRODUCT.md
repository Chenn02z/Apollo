# Apollo Product

## Product Intent

Apollo is a Codex-native staged workflow that turns a technical topic into a
seven-slide, interview-oriented PNG carousel. It gives a technical-content
creator a repeatable way to produce clear, consistently themed educational
slides without manually editing HTML.

## Target User And Pain

The initial user is a creator producing technical interview-preparation
content. They need concise, accurate-enough-for-manual-review slides with
consistent visual presentation; composing each carousel by hand is slow and
visually inconsistent.

## MVP Boundary

The shipped first stage lets the `apollo-generate` Codex skill receive a topic
and create:

- `request.json` and `carousel-content.json`

The MVP is complete when later Codex-native stages add, without manual HTML
edits:

- one constrained, agent-authored `index.html`
- seven 1080×1350 PNG slides using the local `database` theme pack
- `render-manifest.json`
- actionable failure diagnostics when text or slide content overflows

It uses one custom-agent content pass followed by one future custom-agent
HTML/render pass, with no formal source/citation workflow. Apollo has no
standalone LLM API client or runtime API key. The HTML pass may use only the
approved local `database` theme assets and templates, and must output exactly
seven sequential identifiable slides with no scripts, network access, or
external assets. Playwright screenshots those slides deterministically. It is
manually reviewed against ACID properties, indexes, caching, REST vs GraphQL,
and embeddings.

## Product Principles

- **Codex-native stages.** Skills enter the workflow and custom agents perform
  bounded work; Playwright owns deterministic image production.
- **Meaning before pixels.** One agent creates structured content; a later
  agent composes constrained HTML from approved local theme assets.
- **One idea per slide.** Keep technical explanations concise, diagram-led,
  and suitable for a phone screen.
- **One visual identity first.** The reference-derived `database` theme pack
  provides consistency before theme choice breadth.
- **Inspectable local output.** Every run leaves its input, content, HTML,
  images, and manifest together once the render stages ship.
- **Reference-derived assets, not raw reuse.**
  `docs/reference/html/index.html` informs the `database` theme pack but is not
  raw runtime output.

## Explicit Post-MVP Cutoff

- retries
- source-backed research and citations
- visual-spec artifacts, vision review, and automated repair loops
- generated image assets
- an AI theme, a theme taxonomy or plugin system, caching, or scheduling
- publishing, analytics, web UI, authentication, and hosted workflows

## Success Metric

All five proof topics render seven legible, consistently themed PNG slides at
the required dimensions with no deterministic overflow failures and no manual
HTML editing.

## MVP Milestone Ladder

1. `0001-carousel-contract-and-content` — Verified: `apollo-generate` skill,
   request, and bounded seven-slide content artifact.
2. `0002-fixed-carousel-renderer` — Accepted: repository-owned visual
   assets/templates, constrained HTML generation, and local PNG export.
3. `0003-render-validation-and-mvp-proof` — Draft: deterministic validation
   and the five-topic manual proof set.
