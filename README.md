# Apollo

> Turn one software-engineering topic into a self-contained, interview-ready slide deck — authored in Codex, delivered as one offline HTML file and ten PNGs.

Apollo is a Codex-native workflow. You invoke it with a single
software-engineering topic (for example, "database transactions" or "consistent
hashing"). The Codex model that is already available in your session authors the
content directly and lays it out as a standalone HTML deck. There is no external
model, no API integration, and no runtime to run.

## What You Get

- **One topic in, one deck out.** Apollo produces exactly one standalone HTML
  file (`deck.html`) plus exactly ten PNG slides.
- **Exactly ten coherent slides.** Every deck follows a fixed pedagogical order:
  hook, definition, mental model, mechanics, flow, applied example,
  code/pseudocode, trade-off, misconception/failure, interviewer follow-up.
- **Self-contained output.** No external assets, no network calls, no
  interactivity or animation. Each slide is 1080×1350 CSS pixels and exports as
  `slide-01.png` through `slide-10.png`.
- **Fails clean.** If a deck cannot be produced complete and valid, Apollo stops
  rather than handing back a partial or invalid result.

## How It Works

1. You give Apollo a single software-engineering topic.
2. Codex authors the ten-slide outline and independently authors it as a
   self-contained `deck.html` (no fixed template or layout engine; visual
   style and per-slide layout are agent-chosen).
3. Apollo validates the deck (exactly ten top-level slides, correct dimensions,
   no overflow, no external dependencies).
4. Apollo exports exactly ten 1080×1350 PNGs via a deterministic local
   Playwright script that rasterizes slides 1–10 into `slide-01.png` through
   `slide-10.png` and validates count and dimensions.

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
