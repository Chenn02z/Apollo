# Milestone: Render Validation and MVP Proof

## Status

Draft

## Goal

Make local carousel output reliably inspectable by enforcing deterministic
dimensions, slide-count, and overflow diagnostics, then prove the loop across
the five agreed topics.

## MVP Deliverable

A creator gets clear failures for invalid or overflowing output and can produce
manually reviewed carousels for ACID properties, indexes, caching, REST vs
GraphQL, and embeddings.

## In Scope

- Deterministic image dimensions, expected-count, and overflow checks for v1's
  fixed seven slides and v2's content-derived count `N`.
- Actionable diagnostics in the run/report output.
- Manual content and visual review of the five proof topics.

## Out Of Scope

- Vision-model review, auto-repair, citations, publishing, and analytics.

## Architecture Seams

- Complete the validation boundary in `docs/ARCHITECTURE.md` independently of
  content generation.

## Acceptance Criteria

- Overflow, wrong dimensions, and wrong slide count fail with useful
  diagnostics; v1 expects seven slides and v2 expects the content-derived `N`.
- All five proof topics produce legible 1080×1350 PNGs without manual HTML
  edits: seven for v1, or `N` (6–10) for v2.

## Verification

- Automated deterministic checks on generated v1 and v2 output.
- Manual review of all five proof carousels across the applicable v1/v2 paths.

## Deferred

- Automated visual scoring and repair are post-MVP.

## Open Questions

- The exact legibility-review checklist.
