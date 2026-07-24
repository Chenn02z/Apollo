# Milestone: Visual Review Revisions And Reports

## Status

Draft

## Goal

Add non-blocking visual review that reads the rendered PNGs and helps the author
fix frame integrity, legibility, and collision problems before delivery. Visual
review reports feedback to the author, and the author revises the deck HTML —
bounded by the manifest's visual revision limit. Review is advisory: it never
blocks delivery.

## MVP Deliverable

Visual review runs against a run's rendered PNGs, drives author revisions within
the manifest's visual revision limit, and always produces a run-scoped visual
report.

Verifiable success criteria:

- Visual review reads the rendered PNGs for the run (not just the HTML source)
  and checks frame integrity, legibility, and element collisions.
- Visual review reports feedback to the author; the author — not the reviewer —
  revises the deck HTML in response, after which the run re-renders PNGs.
- The number of visual revision cycles never exceeds the manifest's visual
  revision limit (0–5). A limit of 0 means no visual-revision cycle runs.
- When the visual revision limit is exhausted, the run still delivers the deck
  and PNGs (does not fail or block on unresolved visual feedback).
- Every run writes a visual review report under `runs/<run-id>/reviews/visual`,
  including on exhaustion.
- Structural validation and PNG export remain the only hard gates; visual review
  does not gate delivery.

## Developer Workflow

Implementation loop for advisory rendered-PNG visual review feeding author
revisions.

## In Scope

- Visual review that reads the run's rendered PNGs for frame integrity,
  legibility, and collisions.
- Author-driven revision cycles (with re-render) bounded by the manifest's visual
  revision limit.
- Run-scoped visual report written under `runs/<run-id>/reviews/visual`,
  including on exhaustion.

## Out Of Scope

- Content review and content reports (milestone 0004).
- The frame template and manifest contract themselves (milestone 0003).
- Any change to the structural validation or PNG export contract (owned by
  0001/0002) beyond re-rendering after an author revision.
- Making visual review a blocking gate — it is advisory only.
- A concrete reviewer-agent preset or report file format — settled later in
  requirements/spec.

## Architecture Seams

- Builds on the manifest contract (0003) by consuming the visual revision limit.
- Consumes the rendered PNGs produced at the validation/PNG export boundary
  (Seam 2) as its review input; the author remains the sole editor of deck HTML.

## Deferred

- Any escalation of visual review into a hard gate.
- Unifying content and visual review into a single review surface or report.
