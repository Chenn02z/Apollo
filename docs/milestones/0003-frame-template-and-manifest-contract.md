# Milestone: Frame Template And Manifest Contract

## Status

Draft

## Goal

Establish the checked-in frame template and manifest that lock Apollo's visual
frame while leaving the body open to free author composition. This settles the
contract the later review milestones (0004, 0005) build on: what is fixed by the
frame, what the author freely composes, and how the manifest configures
independent content and visual revision limits.

## MVP Deliverable

A single checked-in frame template and a single checked-in manifest exist and
are consumed by `$apollo` authoring.

Verifiable success criteria:

- Exactly one frame template is checked into the repository and it locks the
  header, footer, visual feel, type, and colors for every slide.
- The frame template declares a body-safe area — a defined region the author
  fills with body content.
- Authored `deck.html` keeps the frame's header, footer, visual feel, type, and
  colors from the frame template; only body content inside the body-safe area
  varies between decks on the same frame.
- A single checked-in manifest declares an independent content revision limit and
  visual revision limit, each an integer in the range 0–5.
- The author, not any reviewer, composes and revises body content; the frame is
  not restyled per deck.
- The existing validity contract still holds: exactly ten 1080×1350 slides, no
  external assets, no network, no interactivity or animation.

## Developer Workflow

Implementation loop establishing the frame-template/manifest contract for the
topic → deck HTML seam.

## In Scope

- One checked-in frame template locking header, footer, visual feel, type, and
  colors, and declaring a body-safe area.
- One checked-in manifest declaring independent content and visual revision
  limits (each 0–5).
- Free author body composition within the body-safe area on top of the fixed
  frame.
- Alignment of `$apollo` authoring to author into the frame template.

## Out Of Scope

- Content review behavior and content-review reports (milestone 0004).
- Visual review behavior and rendered-PNG visual reports (milestone 0005).
- Any change to structural validation or PNG export (owned by 0001/0002).
- A concrete manifest file path, schema, or reviewer-agent preset — settled later
  in requirements/spec, not in this milestone.

## Architecture Seams

- Respects and sharpens the topic → deck HTML boundary (Seam 1): the frame
  template is the fixed visual contract; the body-safe area is the author's free
  composition surface. The manifest is the configuration surface that later
  review milestones read for their revision limits.

## Deferred

- Content-review revisions and reports (0004).
- Visual-review revisions and reports (0005).
- Any manifest fields beyond the independent content and visual revision limits.
