# Apollo

> Turn one software-engineering topic into a self-contained, interview-ready slide deck — authored in Codex, delivered as one offline HTML file and ten PNGs.

Apollo is a Codex-native workflow. You invoke it with a single
software-engineering topic (for example, "database transactions" or "consistent
hashing"). The Codex model that is already available in your session authors the
content directly and lays it out as a standalone HTML deck. There is no external
model, no API integration, and no runtime to run.

## What You Get

- **One topic in, one deck out.** Apollo produces exactly one standalone HTML
  file (`deck.html`) plus exactly ten PNG slides, written to a per-run folder
  `runs/<run-id>/` for a caller-supplied unique `run-id`.
- **Exactly ten coherent slides.** Every deck follows a fixed pedagogical order:
  hook, definition, mental model, mechanics, flow, applied example,
  code/pseudocode, trade-off, misconception/failure, interviewer follow-up.
- **Self-contained output.** No external assets, no network calls, no
  interactivity or animation. Each slide is 1080×1350 CSS pixels and exports as
  `runs/<run-id>/slide-01.png` through `runs/<run-id>/slide-10.png`.
- **Locked frame, free body.** One checked-in `templates/frame.html` is a single
  standalone 1080×1350 source slide (not a full deck). Apollo repeats it to build
  the ten-slide deck, filling each slide's CSS-sized `<div id="body-safe-area">`
  with body content while the header and footer stay fixed; within that safe
  area, the author composes the body freely.
- **Advisory content and visual review.** A checked-in manifest sets independent
  content and visual revision limits (each 0–5). Content review checks a correct
  explanation, a concrete example, a trade-off or failure mode, and an
  interview-ready Q/A; visual review reads the rendered PNGs for frame integrity,
  legibility, and collisions. Reviewers report feedback to the author, who
  revises the deck; review is advisory, not a blocking gate.
- **Fails clean.** If a deck cannot be produced complete and valid, Apollo stops
  rather than handing back a partial or invalid result. Structural validation and
  PNG export remain the only hard gates.

## How It Works

1. You give Apollo a single software-engineering topic.
2. Codex uses one checked-in `templates/frame.html` — a single standalone
   1080×1350 source slide — and repeats it ten times to build the deck. Each
   repeated slide keeps the template's fixed header and footer and fills its
   CSS-sized `<div id="body-safe-area">` with authored body content; the frame
   itself is fixed.
3. Content and visual reviewers check the deck against the manifest's
   independent revision limits and report feedback to the author, who revises the
   deck HTML. Review is advisory: when the revision budget is exhausted the run
   still delivers, writing run-scoped reports under `runs/<run-id>/reviews/`.
4. Apollo validates the deck first (`scripts/check-deck.py`, reused unchanged):
   exactly ten top-level slides, correct dimensions, no overflow, no external
   dependencies.
5. Apollo exports exactly ten 1080×1350 PNGs via a deterministic local
   Node Playwright script (`scripts/export-carousel.mjs <run-id>`) that
   rasterizes slides 1–10 into `runs/<run-id>/slide-01.png` through
   `runs/<run-id>/slide-10.png` (network disabled, 1080×1350 viewport, device
   scale 1) and validates count and dimensions. On any failure it emits a clear
   error and leaves no partial slide PNGs for the run.

## Repository Layout

```text
.
├── README.md
├── user-journeys.html
├── AGENTS.md
└── docs/
    ├── PRODUCT.md
    ├── ARCHITECTURE.md
    ├── CONTEXT.md
    ├── WORKFLOWS.md
    ├── AGENT_ROLES.md
    ├── DOCS_POLICY.md
    ├── milestones/
    ├── specs/
    ├── adr/
    ├── techdebt/
    └── reference/
```

`docs/PRODUCT.md` carries the full product intent and scope. Deeper architecture
notes live in `docs/ARCHITECTURE.md`; canonical terminology is in
`docs/CONTEXT.md`. `user-journeys.html` is the visual map of the current path.

## Non-Goals (MVP)

The MVP does not include a web/editor UI, API or local-model integrations,
batching, publishing, analytics, video/audio, PDF, accounts, cloud, or an
automatic factual-review pipeline. Those are explicitly post-MVP.
