# Product Backbone

## Product Intent

Apollo is a Codex-native workflow that turns software-engineering topics into
self-contained, interview-ready slide decks. Codex's available model authors the
content directly. Apollo has no external model, no API integration, and no
runtime multi-agent orchestration.

Spec 0006 (Accepted, not yet implemented) makes Apollo a small content operation
with a durable backlog rather than a one-topic-at-a-time command. `$getcracked`
is the sole user-facing entry point: the developer names a category and a topic
count, and `$getcracked` selects the topics, records them in a checked-in
inventory, and runs the deck workflow once per topic. The deck workflow
(`$generate`, renamed from `$apollo`) still owns one deck end to end.

The MVP endpoint is full delivery: exactly one standalone offline HTML deck,
exactly ten coherent slides, and exactly ten 1080×1350 PNGs named
`slide-01.png` through `slide-10.png`. Apollo fails rather than produce
incomplete or invalid output.

## Target User

Engineers preparing for technical interviews, and anyone who wants a concise,
pedagogically ordered explainer on one software-engineering concept — produced
entirely within a Codex session, with no extra tooling to install or run.

## Scope (MVP)

- Input: a category and a topic count supplied to `$getcracked`, which selects
  the topics and drives one deck workflow per topic (Accepted in spec 0006, not
  yet implemented). Each deck workflow still takes a single
  software-engineering topic.
- Durable backlog: `docs/getcracked-inventory.md` (Accepted, not yet created)
  records topics under seven fixed categories — DSA, System Design, Software
  Design, Java & Backend Development, Databases, AI Engineering, Deep Learning
  — with a status (`planned`, `generated`, `reviewed`) and a run link. Each
  successful run also gets a `runs/<run-id>/metadata.md` naming what it covers.
  `reviewed` is set only by the developer editing the inventory by hand.
- Authoring surface: the Apollo workflow running in Codex; the available Codex
  model authors the self-contained `deck.html` from a single topic using two
  checked-in standalone 1080×1350 source slides — `templates/first-frame.html`
  for slide 1 (a fixed category/topic/commentary presentation with no body-safe
  area) and `templates/frame.html` for slides 2–10, filling each slide's
  CSS-sized `<div id="body-safe-area">` while the locked header, footer, rail,
  rotated `get cracked` label, visual feel, type, and colors stay fixed. The
  author composes the body freely
- Output: one standalone `deck.html` plus ten PNGs, `slide-01.png` to
  `slide-10.png`, each 1080×1350 pixels — all written to a per-run folder
  `runs/<run-id>/` for a unique `run-id` the deck workflow generates itself. No
  shared or cwd output folder is used.
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
  numbering.

## Principles

- **Self-contained by default.** Output must open and render offline with no
  network, no external fonts or scripts, and no interactivity.
- **Locked frame, free body.** Ten slides, fixed order, fixed dimensions,
  predictable file names. Two checked-in standalone 1080×1350 source slides
  build the deck: `templates/first-frame.html` for slide 1 (a fixed category/
  topic/commentary presentation with no body-safe area) and `templates/frame.html`
  for slides 2–10, filling each slide's CSS-sized `<div id="body-safe-area">`
  while the locked header, footer, rail, rotated `get cracked` label, visual
  feel, type, and colors stay fixed. The author composes the body freely within
  each safe area. The structure and frame are the contract; there is no separate
  deterministic layout engine for body content.
- **Fail clean.** Incomplete or invalid output is an error, not a deliverable.
  The structural validator runs before export; any breach stops the run with a
  clear error and no partial slide PNGs left in `runs/<run-id>/`.
- **Codex is the engine.** No model/API layer to configure; the authoring model
  is whatever Codex already provides.
- **One way in, one deck per topic.** `$getcracked` is the only entry point the
  developer uses; it orchestrates research and generation internally. Each
  topic runs its own unchanged deck workflow, so one topic's failure never
  blocks another's.
- **Research informs, it does not decide.** The `web-researcher` agent supplies
  cited in-session findings only. It writes no files and makes no workflow
  decisions.

## Roadmap (Post-MVP, Explicit)

These are explicitly deferred and out of MVP scope:

- Web/editor UI.
- API or local-model integrations.
- Batching (multiple topics/decks through a shared authoring or export path).
  Spec 0006's multi-topic dispatch is orchestration above the deck workflow,
  not batched authoring or export.
- Publishing and sharing.
- Analytics.
- Video/audio variants.
- PDF export.
- Accounts and cloud storage.
- Automatic factual-review pipeline.
- Any hosted or generated view of the inventory (website, feed, export).
- Scheduled or unattended research and generation runs.

## Reference Material

The supplied reference HTML (`docs/reference/index.html`) is visual guidance only.
It is intentionally untracked and preserved as-is. Apollo decks must not copy its
external assets; the reference informs layout and tone, not dependencies.
