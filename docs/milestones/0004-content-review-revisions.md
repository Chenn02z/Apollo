# Milestone: Content Review Revisions And Reports

## Status

Draft

## Goal

Add non-blocking content review that helps the author raise a deck's
explanatory quality before delivery. Content review reads the authored deck,
reports feedback to the author, and the author revises the deck HTML — bounded by
the manifest's content revision limit. Review is advisory: it never blocks
delivery.

## MVP Deliverable

Content review runs against an authored `deck.html`, drives author revisions
within the manifest's content revision limit, and always produces a run-scoped
content report.

Verifiable success criteria:

- Content review checks the deck for: a correct explanation, a concrete example,
  a trade-off or failure mode, and interview-ready Q/A aimed at mid-level
  generalists.
- Content review reports feedback to the author; the author — not the reviewer —
  revises the deck HTML in response.
- The number of content revision cycles never exceeds the manifest's content
  revision limit (0–5). A limit of 0 means no content-revision cycle runs.
- When the content revision limit is exhausted, the run still delivers the deck
  (does not fail or block on unresolved content feedback).
- Every run writes a content review report under `runs/<run-id>/reviews/content`,
  including on exhaustion.
- Structural validation and PNG export remain the only hard gates; content review
  does not gate delivery.

## Developer Workflow

Implementation loop for advisory content review feeding author revisions.

## In Scope

- Content review of the authored deck against the four content checks above.
- Author-driven revision cycles bounded by the manifest's content revision limit.
- Run-scoped content report written under `runs/<run-id>/reviews/content`,
  including on exhaustion.

## Out Of Scope

- Visual review of rendered PNGs and visual reports (milestone 0005).
- The frame template and manifest contract themselves (milestone 0003).
- Any change to structural validation or PNG export (owned by 0001/0002).
- Making content review a blocking gate — it is advisory only.
- A concrete reviewer-agent preset or report file format — settled later in
  requirements/spec.

## Architecture Seams

- Builds on the manifest contract (0003) by consuming the content revision limit.
- Sits between authoring (Seam 1) and validation/export (Seam 2) as an advisory,
  non-blocking review step; the author remains the sole editor of deck HTML.

## Deferred

- Visual (rendered-PNG) review and reports (0005).
- Any escalation of content review into a hard gate.
