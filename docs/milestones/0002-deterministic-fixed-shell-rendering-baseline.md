# Milestone: Deterministic Fixed-Shell Rendering Baseline

## Status

Verified

## Goal

Render validated content through the current fixed local shell and publish safe
1080×1350 PNG slides deterministically.

## MVP Deliverable

For a validated 7–10-slide content artifact, `apollo-render` produces an
inspectable local run containing the populated fixed-shell `index.html`, one
ordered 1080×1350 PNG per content slide, and `render-manifest.json`.

## Scope Boundary

**In:** the repository-owned `database` theme pack; its six closed variants;
escaped deterministic HTML population; structural, shell-fidelity, overflow,
resource, and browser checks; atomic PNG and manifest publication.

**Out:** template archives, art direction, generated body fragments, visual
repair loops, alternate themes, external assets or network access, publishing,
and any manual HTML editing.

## Implemented Behavior

- The local `database` theme pack provides fixed header/footer chrome and six
  closed body variants: hero, fact, list, quote, comparison, and levels.
- Deterministic population escapes content slots. HTML and browser checks reject
  unsafe resources, scripts, clipping, altered shell typography, overflow, and
  external network activity.
- Playwright exports ordered PNGs and a manifest atomically.

## Verification State

- User-Verified on run `5ff4bf18-fd88-4e58-9da9-2481064879ce`.
- `npm run test:renderer` passed 17/17 targeted checks.

## Acceptance Criteria

- Validated 7–10-slide content was the sole source of the exported slide
  count; export created ordered `slides/slide-01.png` through the final slide,
  each 1080×1350, plus a matching `render-manifest.json`.
- Only the fixed local `database` shell and its six closed variants were
  rendered. Escaped content slots and checks rejected scripts, external
  resources, network activity, unsupported markup, shell drift, and overflow.
- Failed export checks did not publish a partial artifact set or replace a
  valid prior manifest.
- The user visually inspected run `5ff4bf18-fd88-4e58-9da9-2481064879ce` and
  approved its PNGs for readable fixed chrome, intact layout, and acceptable
  appearance across all six variants.

## Verification Procedure

1. Ran `npm run test:renderer`; all 17 checks passed.
2. Rendered validated run `5ff4bf18-fd88-4e58-9da9-2481064879ce` and inspected
   its ordered PNGs and manifest.
3. Recorded the user's approval and updated the milestone to `Verified`.

## Handoff

- Next milestone: `0003-template-archive-and-carousel-art-direction.md`.
