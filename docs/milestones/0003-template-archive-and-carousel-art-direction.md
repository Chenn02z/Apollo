# Milestone: Template Archive and Carousel Art Direction

## Status

Accepted

## Goal

Plan a coherent carousel visual strategy without allowing an LLM to modify the
deterministic shell or teaching content.

## Proposed Deliverable

- Add one initial repository-owned `database-blueprint` template archive with
  a machine-readable contract, local theme assets, composition examples, and a
  static preview.
- Add `carousel-art-director`, invoked by `apollo-render`, to write only
  `runs/<run-id>/carousel-layout.json`.
- Record one template and motif for the carousel, plus exactly one composition,
  density, visual anchor, reading direction, and direction note for every
  content slide.
- Use a minimal spatial vocabulary:
  - composition: `minimal`, `editorial`, `split`, `grid`, `flow`, `focus`
  - density: `sparse`, `standard`, `dense`
  - visual anchor: `headline`, `statement`, `diagram`, `sequence`, `contrast`,
    `collection`
  - direction: `centered`, `top-down`, `left-right`, `radial`
- Treat compositions as visual-planning strategies rather than fixed DOM
  variants.
- Deterministic validation rejects unknown templates, motifs, vocabulary values,
  capabilities, or missing, extra, duplicate, and mismatched slide plans.
- Invalid or missing art-direction output stops the render before population or
  export, preserves prior complete artifacts, emits diagnostics, and is never
  retried.

## MVP Deliverable

A validated `carousel-layout.json` for every content slide that selects the
single `database-blueprint` template and guides later composition without
changing validated content or producing HTML.

## Scope Boundary

In scope: the `database-blueprint` archive, art-direction artifact generation,
and deterministic plan validation before population or export. The archive
wraps or reorganizes the existing `database` theme; it does not create a second
visual theme.

Out of scope: HTML, CSS, body fragments, screenshots, content changes,
multi-template selection, generated assets, visual repair/retry loops, and the
`carousel-composer` work reserved for `0004`.

## Archive Shape

`templates/database-blueprint/` contains a machine-readable template contract,
local theme assets, composition examples (visual references rather than closed
HTML layouts), and a static preview.

## Render-Failure and Artifact Policy

The render flow is `validated content → art director → validate
carousel-layout.json → population/export`. Missing or invalid art direction
stops the flow before population or export, leaves prior PNGs and manifest
unchanged, preserves `carousel-content.json`, writes actionable diagnostics,
generates no partial new artifacts, and performs no retry.

## Scenarios

- A valid content run receives one complete, validated slide plan using the
  `database-blueprint` template and a supported motif.
- A plan may render the same source semantic content with different spatial
  compositions when its teaching goal differs.
- A missing, invalid, duplicate, extra, or slide-count-mismatched plan stops
  before deterministic population and export.

## Acceptance Criteria

- `carousel-art-director` writes only `runs/<run-id>/carousel-layout.json` and
  cannot modify content or template/theme files.
- Every content slide has exactly one plan with the accepted vocabulary,
  selected motif, reading direction, and a non-empty `directionNote`.
- Validation rejects unknown template, motif, vocabulary, capability, and slide
  plan cardinality or identity errors deterministically.
- Failed art direction preserves all prior complete render artifacts and does
  not invoke population, export, or retry.

## Handoff

- Intended consumer: `$spec`.
- Proposed spec path: `docs/specs/0003-template-archive-and-carousel-art-direction.md`.
- Next milestone: `0004-constrained-slide-composition.md`.
