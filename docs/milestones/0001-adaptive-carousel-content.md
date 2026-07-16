# Milestone: Adaptive Carousel Content

## Status

Verified

## Goal

Create a local run that ends at validated, adaptive 7–10-slide
`carousel-content.json` for a technical interview-preparation topic.

## Delivered

- `apollo-generate` creates the request and inspectable content artifacts.
- `carousel-writer` and `carousel-reviewer` provide bounded authoring, review,
  and candidate revision: at most three writer attempts per candidate, two
  promoted revisions, and three reviews.
- Validation preserves the last valid content on a failed candidate and keeps
  missing or invalid review output non-blocking.

## Boundary

This milestone ends at validated `carousel-content.json`. The current content
contract still contains closed variant fields for the implemented renderer;
they are not removed by this historical milestone.

## Verification

- User-Verified for content generation, review, revision, and the validated
  content handoff.

## Handoff

- Next milestone: `0002-template-archive-and-carousel-art-direction.md`.
