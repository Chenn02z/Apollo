# Spec: Polished MVP Proof

## Status

Verified

## Goal

Add the Playwright PNG export stage so that a structurally valid `deck.html`
produced by milestone 0001 becomes exactly ten correctly sized, predictably
named PNGs under a caller-supplied `runs/<run-id>/` folder — or Apollo stops
with a single clear error and leaves no partial output. This closes Seam 2 and
the MVP pipeline.

## Scenario

1. The active Codex model, driven by the `$apollo` skill, has authored
   `runs/<run-id>/deck.html` for a topic (milestone 0001).
2. `$apollo` (the caller) validates it:
   `python scripts/check-deck.py runs/<run-id>/deck.html`. The static
   validator rejects any external dependency before any render. Exit 1 stops
   the pipeline before any export work.
3. `$apollo` (the caller) exports it:
   `node scripts/export-carousel.mjs <run-id>`.
4. The exporter loads `runs/<run-id>/deck.html` in an offline Playwright
   Chromium instance at a 1080×1350 viewport, device scale 1, screenshots
   slides 1–10 into `runs/<run-id>/slide-01.png` …
   `runs/<run-id>/slide-10.png`, verifies exactly ten 1080×1350 PNGs, and
   cleans up atomically on any failure.

## Architecture Reference

`docs/ARCHITECTURE.md` – Seam 2 (HTML → validation/PNG export boundary). This
spec implements the export half: rasterization, rendered-dimension/overflow
checks, exact file names/count/sizes, and atomic output. Seam 1 (topic → deck
HTML) is owned by milestone 0001 and is not touched here.

## In Scope

- `scripts/export-carousel.mjs`: a Node ES-module CLI that takes a single
  `<run-id>` argument and exports `runs/<run-id>/deck.html` to
  `runs/<run-id>/slide-01.png` … `runs/<run-id>/slide-10.png`.
- `package.json`: project manifest declaring the export script and the
  `playwright` dependency. No other scripts or tooling.
- One-time local setup (environment prerequisite, not auto-run at export
  time): `npm install` plus `npx playwright install chromium`. If Chromium
  is absent at export time the exporter reports a setup error and exits; it
  does not attempt to install. No global runtime, no Python venv.
- Exporter-owned checks (run after rasterization):
  1. **Exact count** — exactly ten PNGs exist in `runs/<run-id>/` matching
     `slide-01.png` … `slide-10.png`.
  2. **Exact PNG pixel dimensions** — every emitted PNG decodes to 1080×1350
     px. Element CSS bounding boxes are not sufficient proof; the final PNG
     bytes are decoded and checked.
  3. **No overflow** — no slide element reports scroll dimensions exceeding
     its client dimensions (integral DOM comparison; no sub-pixel tolerance).
     The exporter reports the first offending slide index and scroll box.
  4. **No external resources at render time** — the Playwright browser
     context is created with `offline: true`; any blocked request fails the
     run. No route interception is installed. The static validator is
     responsible for rejecting external dependencies before the render; the
     offline context is the render-time backstop.
- Atomic output: the exporter deletes any existing
  `slide-01.png`…`slide-10.png` under `runs/<run-id>/` before starting a new
  export, and on any failure deletes only that current run's expected names
  (`slide-01.png`…`slide-10.png`) so no partial slides remain. It never
  removes `deck.html` or files belonging to other runs.
- Run-id layout: artifacts live only under `runs/<run-id>/`. The exporter
  never writes to `runs/` flat, the cwd, or any other run's folder. The
  legacy `runs/deck.html` is never read or overwritten by new runs.

## Out Of Scope

- Authoring or modifying `deck.html` content — owned by milestone 0001 and the
  `$apollo` skill.
- `scripts/check-deck.py` and `tests/test_check_deck.py` — reused unchanged;
  this spec must not edit them.
- New export formats (PDF, video, audio), batching, or publishing.
- Global/runtime daemons, auto-install at export time, or a Python venv.
- A general carousel/preview server or live-reload loop.
- Editing the `runs/deck.html` legacy file or asserting against it.
- A simulated missing-Chromium test — Chromium presence is an environment
  prerequisite, not a mandatory test case. Setup/runtime error handling still
  exists in the exporter code.

## Architecture Seams

- **Seam 2**: this spec builds the single deterministic rendering stage. Input
  is one validated `deck.html`; output is exactly ten named PNGs plus
  rendered-side checks. Future formats reuse the same validated-HTML input
  without touching the exporter's authoring boundary.
- **Seam 1**: untouched. The exporter is agnostic to how `deck.html` was
  authored; it only consumes the file on disk.

## Contracts

### Caller

The caller is the active Codex model running the `$apollo` skill. `$apollo`
authors `runs/<run-id>/deck.html`, then runs the validator, then runs the
exporter. The exporter never invokes the validator itself; the caller owns the
validate-then-export ordering.

### CLI contract

- `node scripts/export-carousel.mjs <run-id>`
- Exactly one positional argument: `run-id`, which must match
  `^[A-Za-z0-9_-]{1,128}$`. Invalid `run-id` →
  `EXPORT_ERROR: invalid run-id` and exit 2.
- No flags, no config file, no env-var tuning in the MVP.

### File layout contract

- Input: `runs/<run-id>/deck.html` (must already exist).
- Output: `runs/<run-id>/slide-01.png` … `runs/<run-id>/slide-10.png`.
- Before export begins, the exporter deletes any existing files matching
  `slide-01.png`…`slide-10.png` under `runs/<run-id>/`.
- No other files are written by the exporter.

### Render contract

- Engine: local Playwright Chromium (headless).
- Browser context: created with `offline: true`. No route interception is
  installed; the offline flag alone blocks all outbound network.
- Viewport: `{ width: 1080, height: 1350 }`, `deviceScaleFactor: 1`.
- Slide selection: the exporter screenshots each `section.slide` direct child
  of `<body>` in document order, one Playwright element screenshot per slide.
- Readiness: `page.goto('file://…/deck.html')` resolves on page load only.
  No `document.fonts.ready`, no `requestAnimationFrame` flush. 0001 bans
  external fonts and animations, so no font/animation readiness wait is
  required.

### Overflow check contract

- For each `section.slide`, evaluate in-page:
  `el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight`.
  DOM scroll dimensions are integral; no sub-pixel or +1 px tolerance is
  applied. If true, print
  `EXPORT_ERROR: overflow slide-0N scrollWxH=<w>x<h>` and trigger cleanup.

### PNG dimension verification contract

- After writing each PNG, verify its exact pixel dimensions and assert
  exactly 1080×1350 px. A mismatch prints
  `EXPORT_ERROR: slide-0N <w>x<h> expected 1080x1350` and triggers cleanup.
- Dimension verification uses a dependency-free parser with no image
  decoding library: read the first 24 bytes of the PNG file and parse the
  `IHDR` chunk width as bytes 16–19 and height as bytes 20–23,
  big-endian unsigned integers. No image library dependency is added for
  this check. Element CSS bounds are not accepted as proof of emitted PNG
  dimensions.

### Atomic cleanup contract

- Before any screenshot, the exporter deletes any existing
  `slide-01.png`…`slide-10.png` under `runs/<run-id>/`.
- On any failure it removes every file in `slide-01.png`…`slide-10.png` that
  exists under `runs/<run-id>/`, then exits nonzero. It never removes
  `deck.html` or files belonging to other runs.

### Exit codes

- `0`: exactly ten valid PNGs written and verified.
- `1`: render, dimension, count, or overflow failure (after cleanup).
- `2`: usage error (bad/missing `run-id`, missing `deck.html`, or missing
  Playwright/Chromium environment prerequisite).

### Relationship to the structural validator

- The static validator (`scripts/check-deck.py`) runs first and rejects
  external dependencies, wrong slide count, missing dimensions, scripts,
  animations, and event handlers before any render.
- The exporter re-validates the hard render-time guarantees (exact PNG pixel
  dimensions, overflow, no-network via `offline: true`) that the static
  checker cannot prove.
- If `deck.html` is absent the exporter exits 2 with
  `EXPORT_ERROR: missing runs/<run-id>/deck.html`.

## Failure Modes

- **Missing `deck.html`**: exit 2, no PNGs written.
- **Invalid `run-id`** (empty, fails `^[A-Za-z0-9_-]{1,128}$`): exit 2.
- **Validator not run / validator failure forwarded**: out of scope for the
  exporter to detect; `$apollo` owns the validate-then-export ordering. The
  verification step asserts the caller runs the validator first and that a
  validator failure leaves zero PNGs.
- **Render crash / Chromium missing**: `EXPORT_ERROR: render <detail>` or
  `EXPORT_ERROR: playwright not installed`, exit 2, cleanup runs. Chromium
  presence is an environment prerequisite, not a simulated test case.
- **Wrong slide count at render time** (fewer/more than 10 `section.slide`):
  `EXPORT_ERROR: slide count <n> expected 10`, exit 1, cleanup runs.
- **Dimension mismatch**: per-slide error, exit 1, cleanup runs.
- **Overflow**: per-slide error, exit 1, cleanup runs.
- **Network request attempted**: blocked by `offline: true`; treated as
  render failure, exit 1, cleanup runs.
- **Partial write crash mid-export**: any `slide-*.png` already written is
  removed before exit.

## Acceptance Criteria

- A valid `runs/<run-id>/deck.html` yields exactly ten PNGs named
  `slide-01.png`…`slide-10.png` under `runs/<run-id>/`, each decoding to
  1080×1350 px.
- An invalid deck (wrong slide count, overflow, external dependency, or a
  deck that fails `scripts/check-deck.py`) is rejected with a nonzero exit and
  zero `slide-*.png` files left in `runs/<run-id>/`.
- Export count and dimensions are verified programmatically by the exporter
  itself and again by the verification tests.
- Each run writes only to `runs/<run-id>/`; no shared or cwd output folder is
  written. `runs/deck.html` is never modified.
- `scripts/check-deck.py` and `tests/test_check_deck.py` remain byte-identical
  to their pre-0002 state.

## Verification

- Test path: `test/render-carousel.test.mjs` using Node's built-in test runner
  (`node --test`), consistent with the repo's existing Node test conventions.
  The `test/` directory is created by this spec (no existing `test/` dir
  today; `tests/` holds the Python checker tests). Playwright is the only
  added dependency, declared in `package.json`.
- Tests use minimal inline deck setup: each case builds a small HTML string
  inline in the test, writes it to a temporary `runs/<test-id>/deck.html`
  under the OS tmpdir, and removes that temp folder in cleanup. No shared
  fixtures, no repo `runs/` writes.
- **Good path**: inline known-good ten-slide deck → run validator (assert
  exit 0) → run exporter → assert ten PNGs exist, each 1080×1350, names
  `slide-01.png`…`slide-10.png`.
- **Validator-gate path**: inline broken deck (wrong slide count) → run
  validator (assert exit 1) → assert exporter is not invoked and zero PNGs
  exist.
- **Export-failure cleanup paths** (inline decks):
  - Deck with overflow on slide 3 → export exits nonzero, zero `slide-*.png`.
  - Deck with 11 `section.slide` → exporter catches count != 10 at render
    time, exits nonzero, zero `slide-*.png`.
  - Deck that attempts a network fetch → blocked by `offline: true`, export
    exits nonzero, zero PNGs.
- **Dimension path**: inline deck with one slide styled 800×1350 that the
  static checker misses → exporter's PNG decode catches the mismatch, zero
  PNGs remain.
- **Pre-export delete**: place stale `slide-01.png`…`slide-10.png` in the temp
  run folder, run a good export, assert the stale files were replaced (not
  appended to) and exactly ten valid PNGs remain.
- **Run isolation**: two runs with different run-ids produce artifacts only
  in their own tmpdir folders; no cross-run leakage.
- Tests run real Chromium (no mocking) to prove the offline render contract.
  A missing-Chromium simulation is not a mandatory test; if Chromium is absent
  in the environment, the good-path test is skipped with a clear message.

## Open Questions

- None blocking. The milestone settles invocation, run layout, implementation
  choice (Node Playwright), and render contract. Re-grill may confirm the
  inline PNG `IHDR` parser is the right dependency-free dimension check.
