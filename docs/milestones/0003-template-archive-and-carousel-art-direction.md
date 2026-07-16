# Milestone: Template Archive and Carousel Art Direction

## Status

Draft

## Goal

Plan a coherent carousel visual strategy without allowing an LLM to modify the
deterministic shell or teaching content.

## Proposed Deliverable

- Add one initial repository-owned `database-blueprint` template archive with
  contract, theme assets, examples, and preview.
- Add `carousel-art-director`, invoked by `apollo-render`, to write only
  `runs/<run-id>/carousel-layout.json`.
- The plan records the template, motif, and exactly one supported composition,
  density, visual anchor, and direction for every content slide.
- Deterministic validation rejects unknown templates/capabilities and missing,
  extra, or mismatched slide plans.

## Boundary

The art director does not write HTML, CSS, templates, screenshots, or content.
The one initial template is recorded for reproducibility; multi-template
selection is deferred.

## Handoff

- Next milestone: `0004-constrained-slide-composition.md`.
