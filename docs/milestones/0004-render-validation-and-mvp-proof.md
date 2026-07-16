# Milestone: Render Validation and MVP Proof

## Status

Accepted

## Goal

Make the v2 carousel pipeline reliably produce inspectable, unclipped output,
then prove it with five fresh sequential runs across the agreed topics without
changing v1.

## MVP Deliverable

A creator gets five successful, validated v2 carousels for ACID properties,
indexes, caching, REST vs GraphQL, and embeddings, with exactly those five
successful run folders remaining under `runs/`.

## In Scope

- V2-only reliability work; preserve v1 behavior and artifacts.
- A deterministic, reference-derived v2 shell: shared header, title, and
  footer chrome plus closed `hero`, `fact`, `list`, `quote`, `comparison`, and
  `levels` variants. `docs/reference/html/index.html` is visual and semantic
  source material only, never raw or network-backed runtime HTML.
- Layout-aware v2 content budgets justified by each variant's actual capacity,
  with named escaped slots and shared header/title/footer classes and fonts.
- Adaptive 7–10-slide proof content with required variant-specific support, not
  a repeated bare title-and-short-body layout.
- Deterministic v2 image dimensions, content-derived expected-count, and
  overflow checks that reject every overflow, including one pixel and hidden or
  clipped overflow.
- Five fresh, sequential v2 proof runs: ACID properties, indexes, caching,
  REST vs GraphQL, and embeddings.
- Delete a failed attempt's run folder before continuing the proof sequence.
- Record findings and fixes in `docs/specs/0004-v2-pipeline-reliability.md`.

## Out Of Scope

- Vision-model review, automatic retry or repair, citations, publishing, and
  analytics.

## Architecture Seams

- Strengthen the v2 content/HTML and validation boundaries in
  `docs/ARCHITECTURE.md` without changing the verified v1 path.

## Acceptance Criteria

- V2 content validation rejects copy that exceeds layout budgets justified by
  the fixed shell's actual capacity.
- The v2 renderer maps validated content into the repository-owned fixed shell
  and slots without relying on an ambiguous free-form content region.
- V2 overflow, wrong dimensions, and wrong slide count fail with useful
  diagnostics; any overflow, including one pixel or hidden/clipped content,
  fails.
- Each of the five named proof topics produces a deterministically valid,
  capacity-compliant, non-bare 1080×1350 v2 PNG set with a content-derived
  7–10-slide count and no manual HTML edits.
- Proof runs are sequential and fresh; after each failure its specific run
  folder is deleted before the next attempt, and `runs/` ends with exactly five
  successful proof-run folders.

## Verification

- Automated deterministic v2 checks for content budgets, fixed-slot structure,
  dimensions, count, and all overflow modes.
- Run the five v2 proof topics sequentially and confirm deterministic validity,
  capacity compliance, and exactly five successful run folders under `runs/`;
  no manual-legibility checklist is a gate.

## Deferred

- Automated visual scoring and repair remain post-MVP.
