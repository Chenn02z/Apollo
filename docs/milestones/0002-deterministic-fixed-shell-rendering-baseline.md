# Milestone: Deterministic Fixed-Shell Rendering Baseline

## Status

Implemented

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

- Code and targeted checks exist, but this baseline is not user-Verified.

## Acceptance Criteria

- Validated content with 7–10 slides is the sole source of the exported slide
  count; export creates ordered `slides/slide-01.png` through the final slide,
  each 1080×1350, plus a matching `render-manifest.json`.
- Only the fixed local `database` shell and one of its six closed variants are
  rendered. Content slots are escaped; scripts, external resources, network
  activity, unsupported markup, shell drift, and overflow fail the render.
- A failed export does not publish a partial artifact set or replace a valid
  prior manifest.
- A user visually inspects a representative successful run's PNGs for readable
  fixed chrome, intact layout, and acceptable appearance across all six
  variants. This criterion is required before the milestone can become
  `Verified`.

## Verification Procedure

1. Run `npm run test:renderer`.
2. Run `apollo-render` on a validated 7–10-slide artifact and inspect its
   ordered PNGs and manifest for the criteria above.
3. Record the inspected run and user decision; retain `Implemented` until that
   visual verification passes, then update the milestone to `Verified`.

## Handoff

- Next milestone: `0003-template-archive-and-carousel-art-direction.md`.
