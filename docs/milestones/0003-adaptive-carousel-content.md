# Milestone: Adaptive Carousel Content

## Status

Verified

## Goal

Produce deeper technical carousels by letting the content artifact use the
number of slides its distinct teaching beats need.

## MVP Deliverable

For a technical topic, a creator uses apollo-generate then apollo-render to
produce a 7–10-slide carousel. Its closed role sequence follows the topic's
teaching beats, and its slides provide concrete explanations rather than
generic advice or recap copy.

## In Scope

- One content-to-render workflow.
- A content-derived slide count from 7 through 10, inclusive; no user-facing
  count setting.
- Roles: hook, overview, concept, example, deep-dive, interview, and takeaway.
  Hook is first, overview is second and occurs exactly once, and takeaway is
  last. Intermediate roles may repeat; interview is optional.
- Concrete teaching content, assessed by writer policy and manual review rather
  than deterministic validation.
- Bounded plain-text fields and deterministic overflow diagnostics.

## Out Of Scope

- More than 10 slides, configurable slide counts, or unbounded copy.
- Research/citations, visual review or repair, new themes, publishing, and
  analytics.

## Acceptance Criteria

- A valid artifact has 7–10 ordered slides; 6- and 11-slide artifacts fail
  validation with actionable errors.
- Each carousel starts with hook, has one second-position overview, and ends
  with takeaway.
- Fields have bounded plain-text content and reject markup.
- The renderer writes one ordered 1080×1350 PNG per slide and a matching
  manifest.
- Overflow fails with an actionable diagnostic instead of clipping or silently
  shrinking readability.
- Manual ACID review covers Atomicity, Consistency, Isolation, Durability, a
  concurrency example, and a final takeaway.

## Verification

- Targeted validation checks cover 7/10 bounds, invalid counts, role placement,
  field limits, markup rejection, and rejection before rendering.
- Targeted render checks cover 7/10 exports, dimensions, manifest ordering, and
  overflow diagnostics.
- Manually inspect an ACID carousel against the concrete-content rubric.

## Settled Decisions

- Ten slides is the hard maximum; content selects its count from teaching
  beats.
- Additional depth comes from focused slides, not dense paragraphs.
- Semantic concreteness is a writer-policy and manual-proof concern, not a
  deterministic validator concern.

## Handoff

- Producer: $dev-loop
- Consumer: $context
- Status: Verified
- Implemented spec: docs/specs/0003-adaptive-carousel-content.md
- Unresolved blockers: None.
