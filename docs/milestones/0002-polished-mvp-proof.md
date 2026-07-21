# Milestone: Polished MVP Proof

## Status

Draft

## Goal

Close the MVP: add the validation gate and PNG export so Apollo delivers a
complete, valid, self-contained result — and fails clean otherwise.

## MVP Deliverable

From a `deck.html` produced by milestone 0001, Apollo validates the
validity contract and exports exactly ten 1080×1350 PNGs named
`slide-01.png` through `slide-10.png`. If the deck is incomplete or invalid,
Apollo stops and reports the error rather than producing partial output.

## Developer Workflow

Validation and export stage; final MVP verification.

## In Scope

- Validate the `deck.html` validity contract: exactly 10 top-level slides; each
  1080×1350 CSS px; no overflow; no external assets or network dependencies;
  no interactivity or animation.
- Export exactly ten 1080×1350 PNGs with predictable numbering
  (`slide-01.png`–`slide-10.png`).
- Fail clean on any validity breach or export mismatch.

## Out Of Scope

- Authoring the deck HTML (milestone 0001).
- Post-MVP formats (PDF, video/audio), batching, publishing, and analytics.

## Architecture Seams

- Establishes Seam 2 (HTML → validation/PNG export boundary): a validated
  `deck.html` is the single input for export. The only deterministic rendering
  stage is a local Playwright export script that rasterizes slides 1–10 into
  `slide-01.png` through `slide-10.png` and validates exact count and 1080×1350
  dimensions; reusable by future formats.

## Specs

- `docs/specs/...` (to be created from this Accepted milestone)

## Acceptance Criteria

- A valid deck yields exactly ten correct-size PNGs with the right names.
- An invalid deck (wrong slide count, overflow, external dependency) is rejected
  with a clear error and no partial output.
- Export count and dimensions are verified programmatically.

## Verification

- Validate a known-good deck and assert ten correct PNGs.
- Validate intentionally broken decks and assert clean failure.
- No invented commands: rely on local export tooling present in the session.

## Deferred

PDF, video/audio, batching, and publishing build on this validated-HTML seam.

## Open Questions

- The export stage is a deterministic local Playwright script (rasterize slides 1–10 to `slide-01.png`–`slide-10.png`, validate count and dimensions); the precise invocation is a recorded maturity gap, not invented here.
