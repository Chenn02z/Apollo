# Milestone: Polished MVP Proof

## Status

Verified

## Goal

Close the MVP: add the validation gate and PNG export so Apollo delivers a
complete, valid, self-contained result — and fails clean otherwise.

## MVP Deliverable

From a `deck.html` produced by milestone 0001, Apollo runs the existing
structural validator first, then converts `deck.html` into exactly ten
1080x1350 PNGs. Every new Apollo run has a caller-supplied unique run ID under
`runs/`, so all artifacts for a run live in their own folder
(`runs/<run-id>/deck.html` and `runs/<run-id>/slide-01.png` ... `slide-10.png`).
No shared or cwd output folder is used. If the deck is incomplete or invalid,
Apollo stops and reports a clear error rather than producing partial output.

Concrete end-to-end pipeline for a run:

1. Caller supplies a unique `run-id`; artifacts go to `runs/<run-id>/`.
2. The structural validator `scripts/check-deck.py` runs against
   `runs/<run-id>/deck.html` (reused unchanged).
3. `node scripts/export-carousel.mjs <run-id>` renders `runs/<run-id>/deck.html`
   to `runs/<run-id>/slide-01.png` through `slide-10.png` under local/offline
   Playwright with network disabled, a 1080x1350 viewport at device scale 1.

The existing flat `runs/deck.html` is preserved untouched as pre-0002 evidence.

## Developer Workflow

Validation and export stage; final MVP verification.

Invocation (settled):

- Validate: `python scripts/check-deck.py runs/<run-id>/deck.html`
- Export: `node scripts/export-carousel.mjs <run-id>`

One-time local setup may install Node Playwright and Chromium if absent. There
is no global runtime and no auto-install at export time. No Python venv is
required because the implementation choice is Node Playwright.

## Scope Boundary

**In scope (precise):**

- Reuse `scripts/check-deck.py` unchanged for structural validity (exactly 10
  top-level slides, 1080x1350 CSS px, no overflow, no external assets, no
  network, no interactivity/animation).
- The exporter owns rendered-dimension/overflow checks, exact file names, the
  exact PNG count (10), and the exact pixel sizes (1080x1350).
- Atomic output: on any failure the exporter emits a single nonzero clear error
  and leaves no partial slide PNGs for that run.
- Render contract: local/offline Playwright with network disabled, 1080x1350
  viewport, device scale factor 1.

**Out of scope (explicit):**

- Authoring the deck HTML (milestone 0001).
- Any new export format (PDF, video/audio), batching, publishing, or authoring
  work in this milestone.
- Global/runtime daemons, auto-install at export time, or a Python venv.

## Architecture Seams

- Establishes Seam 2 (HTML -> validation/PNG export boundary): a validated
  `deck.html` is the single input for export. The only deterministic rendering
  stage is a local Node Playwright export script that rasterizes slides 1-10
  into `slide-01.png` through `slide-10.png` and validates exact count and
  1080x1350 dimensions; reusable by future formats.

## Specs

- `docs/specs/0002-polished-mvp-proof.md` (proposed spec path, to be created
  from this Accepted milestone).

## Acceptance Criteria

- A valid deck yields exactly ten 1080x1350 PNGs named `slide-01.png` ...
  `slide-10.png` under `runs/<run-id>/`.
- An invalid deck (wrong slide count, overflow, external dependency, or
  structural validator failure) is rejected with a clear nonzero error and no
  partial output.
- Export count and dimensions are verified programmatically.
- Each run uses a caller-supplied unique `run-id` under `runs/`; no shared or
  cwd output folder is written.

## Verification

- Validate a known-good deck and assert ten correct PNGs in `runs/<run-id>/`.
- Validate intentionally broken decks and assert clean failure with no partial
  slide PNGs left behind.
- Confirm the structural validator (`scripts/check-deck.py`) runs before export
  and that the exporter fails clean on validator failure.

## Settled Decisions

- **Run layout**: every Apollo run gets a caller-supplied unique `run-id`;
  artifacts live in `runs/<run-id>/`. The legacy flat `runs/deck.html` stays
  as pre-0002 evidence and is never overwritten by new runs.
- **Implementation choice**: Node Playwright (no Python venv). One-time local
  setup may install Playwright + Chromium; no global runtime, no auto-install
  at export time.
- **Validator reuse**: `scripts/check-deck.py` is reused unchanged; the
  exporter owns rendered checks (dimensions, overflow) and atomic output.
- **Render contract**: local/offline Playwright, network disabled, 1080x1350
  viewport, device scale 1. Exactly ten PNGs, no new formats.

## Deferred

PDF, video/audio, batching, and publishing build on this validated-HTML seam.

## Open Questions

- None. The invocation (validator then
  `node scripts/export-carousel.mjs <run-id>`) is settled in this Accepted
  milestone; the stale punt on invocation is removed.
