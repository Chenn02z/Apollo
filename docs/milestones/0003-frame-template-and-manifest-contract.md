# Milestone: Frame Template And Manifest Contract

## Status

Accepted

## Goal

Establish the checked-in frame template and manifest that lock Apollo's visual
frame while leaving each slide's body open to free author composition. This
settles the contract the later review milestones (0004, 0005) build on: what is
fixed by the frame, what the author freely composes per slide, and how the
manifest configures independent content and visual revision limits.

## MVP Deliverable

Two checked-in files exist and are consumed by `$apollo` authoring:

- `templates/frame.html`: one standalone 1080×1350 source slide (not a full
  deck). It carries the locked header and footer markup, the shared visual feel,
  type, and colors, and exactly one CSS-sized `<div id="body-safe-area">` region
  the author fills with body content.
- `templates/manifest.json`: a JSON object with exactly two keys —
  `content_revision_limit` and `visual_revision_limit` — each an integer in the
  range 0–5, defaulting to `1` and `1`.

User-visible outcome: running `$apollo` on a topic repeats the one-slide
`templates/frame.html` ten times into `runs/<run-id>/deck.html` and fills each
slide's `<div id="body-safe-area">` with authored body content. Every generated
slide's header and footer match the template markup and CSS exactly; only body
content inside the body-safe area varies between slides and between decks.

Verifiable success criteria:

- `templates/frame.html` is a single standalone 1080×1350 slide containing the
  locked header, footer, visual feel, type, colors, and exactly one CSS-sized
  `<div id="body-safe-area">`.
- `templates/manifest.json` parses as JSON with exactly `content_revision_limit`
  and `visual_revision_limit`, each an integer 0–5, defaulting to `1` and `1`.
- The two revision budgets are independent; a limit of `0` skips its
  corresponding reviewer entirely with no report produced.
- `$apollo` produces `runs/<run-id>/deck.html` by repeating the one-slide
  template ten times and filling each slide's body-safe area.
- Each generated slide's header and footer match the template markup and CSS
  exactly; validation of the frame excludes the body-safe area, leaving body
  content and styling inside it to author discretion.
- The existing validity contract still holds: exactly ten 1080×1350 slides, no
  external assets, no network, no interactivity or animation.

## Scenarios

- Author a deck: `$apollo` reads `templates/frame.html`, repeats it ten times
  into `runs/<run-id>/deck.html`, and fills each slide's body-safe area with
  authored body content while leaving header and footer untouched.
- Read revision budgets: a downstream reviewer milestone reads
  `templates/manifest.json` and uses `content_revision_limit` and
  `visual_revision_limit` independently.
- Zero budget: a manifest with `content_revision_limit: 0` (or
  `visual_revision_limit: 0`) skips that reviewer entirely and produces no
  report for it, without affecting the other budget.
- Default budget: a manifest omitting explicit values uses the defaults `1`
  and `1`.

## Developer Workflow

Implementation loop establishing the frame-template/manifest contract for the
topic → deck HTML seam, and aligning `$apollo` authoring to fill the frame's
body-safe area rather than author decks free-form.

## Decisions

- `templates/frame.html` is one standalone 1080×1350 source slide, not a full
  deck.
- `templates/manifest.json` is JSON with exactly `content_revision_limit` and
  `visual_revision_limit`, each an integer 0–5, defaulting to `1` and `1`. A
  value of `0` skips that reviewer entirely with no report; the two budgets are
  independent.
- Apollo repeats the one-slide template ten times into `runs/<run-id>/deck.html`
  and fills each slide's single CSS-sized `<div id="body-safe-area">`.
- Each generated slide's header and footer must match the template markup and
  CSS exactly. Validation excludes the body-safe area; body content and styling
  inside it are left to author discretion.

## In Scope

- Add `templates/frame.html` as one standalone 1080×1350 slide locking header,
  footer, visual feel, type, and colors, with exactly one CSS-sized
  `<div id="body-safe-area">`.
- Add `templates/manifest.json` with exactly `content_revision_limit` and
  `visual_revision_limit` (each integer 0–5, defaults `1` and `1`).
- Align `$apollo` authoring to repeat the frame template ten times into
  `runs/<run-id>/deck.html` and fill each slide's body-safe area while keeping
  header and footer identical to the template.

## Out Of Scope

- Content review behavior and content-review reports (milestone 0004).
- Visual review behavior and rendered-PNG visual reports (milestone 0005).
- Any reviewer report generation or export changes driven by the manifest.
- Any change to structural validation or PNG export (owned by 0001/0002).
- Any manifest fields beyond `content_revision_limit` and
  `visual_revision_limit`.

## Architecture Seams

- Respects and sharpens the topic → deck HTML boundary (Seam 1):
  `templates/frame.html` is the fixed visual contract; each slide's body-safe
  area is the author's free composition surface. `templates/manifest.json` is
  the configuration surface that later review milestones read for their
  independent revision limits.

## Deferred

- Content-review revisions and reports (0004).
- Visual-review revisions and reports (0005).
- Any manifest fields beyond the independent content and visual revision limits.
