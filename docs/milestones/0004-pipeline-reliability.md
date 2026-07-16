# Milestone: Pipeline Reliability and MVP Proof

## Status

Accepted

## Goal

Make the carousel pipeline reliably produce inspectable, unclipped output, then
prove it with five fresh sequential runs across the agreed topics.

## MVP Deliverable

A creator gets five successful, validated carousels for ACID properties,
indexes, caching, REST vs GraphQL, and embeddings, with exactly those five
successful run folders remaining under runs/.

## In Scope

- A deterministic, reference-derived shell with shared header, title, and
  footer chrome plus closed hero, fact, list, quote, comparison, and levels
  variants.
- Layout-aware content budgets with named escaped slots.
- Adaptive 7–10-slide proof content that is not a repeated bare title-and-body
  layout.
- Bounded writer recovery: up to three total attempts for initial content and
  each review-requested candidate, without changing the review or promotion caps.
- Deterministic dimensions, content-derived expected count, and overflow checks
  that reject every overflow, including one pixel and hidden or clipped content.
- Five fresh, sequential proof runs and exact failed-folder cleanup.
- Findings and fixes recorded in docs/specs/0004-pipeline-reliability.md.

## Out Of Scope

- Vision-model review, unbounded automatic retry or repair loops, citations,
  publishing, and analytics.

## Acceptance Criteria

- Content validation rejects copy that exceeds the fixed shell's actual
  capacity.
- The renderer maps validated content into repository-owned slots without a
  free-form content region.
- Overflow, wrong dimensions, and wrong slide count fail with useful
  diagnostics.
- Each proof topic produces a deterministically valid, capacity-compliant,
  non-bare 1080×1350 PNG set with a content-derived 7–10-slide count.
- Proof runs are sequential and fresh; runs/ ends with exactly five successful
  proof-run folders.

## Verification

- Automated checks for content budgets, fixed-slot structure, dimensions, count,
  and all overflow modes.
- Run the five proof topics sequentially and confirm exactly five successful
  run folders under runs/.

## Deferred

- Automated visual scoring and repair remain post-MVP.
