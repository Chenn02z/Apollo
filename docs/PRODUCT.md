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
  model writes the outline and the self-contained HTML directly.
- Output: one standalone `deck.html` plus ten PNGs, `slide-01.png` to
  `slide-10.png`, each 1080×1350 pixels.
- Pedagogical order (fixed): hook, definition, mental model, mechanics, flow,
  applied example, code/pseudocode, trade-off, misconception/failure, interviewer
  follow-up. The ten-slide outline is a model-authored content-planning
  artifact; the authoring agent realizes it as self-contained deck HTML with no
  fixed template or layout engine.
- Broad topics get an interview-relevant angle; narrow topics get deeper
  treatment.
- Validity contract: exactly 10 top-level slides; no external assets or network
  dependencies; no interactivity or animation; each slide is 1080×1350 CSS px;
  overflow is detected; exactly 10 correctly sized PNGs with predictable
  numbering.

## Principles

- **Self-contained by default.** Output must open and render offline with no
  network, no external fonts or scripts, and no interactivity.
- **Deterministic shape.** Ten slides, fixed order, fixed dimensions, predictable
  file names. The structure is the contract; the authoring agent freely chooses
  visual style and per-slide layout within that contract — there is no fixed
  deck template or layout engine.
- **Fail clean.** Incomplete or invalid output is an error, not a deliverable.
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
