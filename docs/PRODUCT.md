# Product Backbone

## Product Intent

Apollo is a Codex-native workflow that turns a single software-engineering topic
into a self-contained, interview-ready slide deck. The developer invokes Apollo
with one topic; Codex's available model authors the content directly. Apollo has
no external model, no API integration, and no runtime multi-agent orchestration.

The MVP endpoint is full delivery: exactly one standalone offline HTML deck,
exactly ten coherent slides, and exactly ten 1080×1350 PNGs named
`slide-01.png` through `slide-10.png`. Apollo fails rather than produce
incomplete or invalid output.

## Target User

Engineers preparing for technical interviews, and anyone who wants a concise,
pedagogically ordered explainer on one software-engineering concept — produced
entirely within a Codex session, with no extra tooling to install or run.

## Scope (MVP)

- Input: a single software-engineering topic supplied to the Apollo workflow.
- Authoring surface: the Apollo workflow running in Codex; the available Codex
  model authors the self-contained `deck.html` from a single topic into a single
  checked-in frame template that locks the header, footer, visual feel, type, and
  colors and declares a body-safe area. The author composes the body freely
  within that safe area.
- Output: one standalone `deck.html` plus ten PNGs, `slide-01.png` to
  `slide-10.png`, each 1080×1350 pixels — all written to a per-run folder
  `runs/<run-id>/` for a caller-supplied unique `run-id`. No shared or cwd
  output folder is used.
- Pedagogical order (fixed, internal content-planning constraint): hook,
  definition, mental model, mechanics, flow, applied example, code/pseudocode,
  trade-off, misconception/failure, interviewer follow-up. The fixed order
  guides the model's authoring; it is not a separate outline artifact or layout
  engine input. It is distinct from the frame template, which locks the
  header/footer/visual feel/type/colors and declares the body-safe area.
- Broad topics get an interview-relevant angle; narrow topics get deeper
  treatment.
- Validity contract: exactly 10 top-level slides; no external assets or network
  dependencies; no interactivity or animation; each slide is 1080×1350 CSS px;
  overflow is detected; exactly 10 correctly sized PNGs with predictable
  numbering. The structural validator (`scripts/check-deck.py`) runs first,
  then the exporter renders and enforces rendered dimensions, overflow,
  names, count, and sizes — failing clean with a clear error and no partial
  slide PNGs on any breach.
- Advisory review: a checked-in manifest sets independent content and visual
  revision limits (each 0–5). Content review checks a correct explanation, a
  concrete example, a trade-off or failure mode, and interview-ready Q/A for
  mid-level generalists; visual review reads the rendered PNGs for frame
  integrity, legibility, and collisions. Reviewers report feedback to the author,
  who revises the deck HTML. Review is advisory: on exhaustion the run still
  delivers with run-scoped reports under `runs/<run-id>/reviews/content` and
  `runs/<run-id>/reviews/visual`. Structural validation and PNG export remain the
  only hard gates.

## Principles

- **Self-contained by default.** Output must open and render offline with no
  network, no external fonts or scripts, and no interactivity.
- **Locked frame, free body.** Ten slides, fixed order, fixed dimensions,
  predictable file names. A single checked-in frame template locks the header,
  footer, visual feel, type, and colors and declares a body-safe area; the author
  composes the body freely within that safe area. The structure and frame are the
  contract; there is no separate deterministic layout engine for body content.
- **Fail clean.** Incomplete or invalid output is an error, not a deliverable.
  The structural validator runs before export; any breach stops the run with a
  clear error and no partial slide PNGs left in `runs/<run-id>/`.
- **Codex is the engine.** No model/API layer to configure; the authoring model
  is whatever Codex already provides.

## Roadmap (Post-MVP, Explicit)

These are explicitly deferred and out of MVP scope:

- Web/editor UI.
- API or local-model integrations.
- Batching (multiple topics/decks at once).
- Publishing and sharing.
- Analytics.
- Video/audio variants.
- PDF export.
- Accounts and cloud storage.
- Automatic factual-review pipeline.

## Reference Material

The supplied reference HTML (`docs/reference/index.html`) is visual guidance only.
It is intentionally untracked and preserved as-is. Apollo decks must not copy its
external assets; the reference informs layout and tone, not dependencies.
