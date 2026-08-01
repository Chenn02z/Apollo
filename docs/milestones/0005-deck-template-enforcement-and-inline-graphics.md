# Milestone: Deck Template Enforcement And Inline Graphics

## Status

Verified

## Status Notes

- **Accepted by user:** the developer explicitly accepted this plan by replying
  `continue`. Spec authored, implemented, and verified against acceptance criteria.
- **Supersedes a prior boundary:** milestone 0004 deferred validator changes
  ("Validator, exporter, and manifest are unchanged by this milestone"). That
  validator boundary is intentionally superseded here by a follow-up contract:
  slide 1 template routing becomes a hard structural gate in
  `scripts/check-deck.py`. Nothing else about the Seam 2 contract moves.

## Goal

Close the two gaps left open after the two-template split shipped. First, make
slide 1 template routing a real gate instead of a best-effort check that can be
silently skipped when per-slide markers are missing. Second, give the
`apollo-designer` explicit, bounded guidance for authoring self-contained inline
SVG illustrations on slides 2-10, so body composition can carry diagrammatic
meaning without reaching for external or raster assets.

Today the deck can pass validation while slide 1 is routed through the wrong
template, and the design agent has "use graphics" guidance with no concrete,
safe vocabulary for producing them. Both are cheap to settle now and expensive
to unwind after more decks are authored.

## MVP Deliverable

A deck whose slide 1 is routed through the wrong template fails structural
validation with a clear error, and the `apollo-designer` can author
self-contained inline-SVG illustrations on slides 2-10 within a fixed,
authoring-guidance vocabulary — proven by a fresh validated and exported deck.

Verifiable success criteria:

- `scripts/check-deck.py` hard-gates slide 1 template routing: a deck whose
  slide 1 does not carry the first-frame marker, or that carries the
  body-safe-area marker, fails with a nonzero exit and a `TEMPLATE_ROUTING`
  message.
- Missing or unparseable per-slide markers are handled safely: the validator
  never crashes and never silently passes a deck it could not check. An
  inability to collect per-slide markers is reported as a routing failure, not
  skipped.
- Any slide 2-10 carrying the first-frame marker fails validation with a
  `TEMPLATE_ROUTING` message.
- The only other new `scripts/check-deck.py` behavior is fail-closed per-slide
  marker collection and class-token detection of the routing markers. Inline-SVG
  illustration constraints are `apollo-designer` authoring guidance only — not new
  validator checks, and they get no new tests.
- The `apollo-designer` preset carries optional inline-SVG illustration
  guidance scoped to slides 2-10 only. Slide 1 remains template-only: no
  authored illustration, inline SVG, or added graphic of any kind.
- Illustration guidance is optional, not mandatory: a deck with no inline SVG
  is still valid and still passes.
- Illustrations are self-contained inline `<svg>` markup in `deck.html` — no
  external files, no `<img>`, no raster assets, no data-URI images, no sprite
  sheet, no build step.
- Illustration fills and strokes use direct hex values drawn only from the fixed
  palette (`#1C1C1C`, `#506B62`, `#A85F47`, `#5D7094`, `#A9824F`, `#806277`,
  `#8E6A58`). `fill="none"` is allowed.
- Illustrations use no opacity, no gradients, no filters, no `currentColor`, and
  no external or raster references.
- Guidance names agent/avatar, app/terminal window, container/state block, and
  connectors as worked examples of what an illustration can depict. These are
  illustrative, not a closed component set and not a component library — the
  agent may draw other subjects within the same constraints.
- Existing routing tests already cover pass, wrong-slide-1, and
  first-frame-marker-on-body-slide cases; add only focused new routing tests for
  marker mismatch/empty and class-token lists as appropriate. Inline-SVG
  illustration constraints are authoring guidance, not validator checks, so they
  get no new tests.
- A fresh deck is authored, validated, and exported end to end, producing ten
  1080x1350 PNGs under a new `runs/<run-id>/`.
- Existing runs under `runs/` are unchanged: nothing is re-authored,
  re-rendered, re-exported, or revalidated.

## Developer Workflow

Implementation loop: tighten a structural gate in the validator, extend design
agent prompt guidance, add targeted tests, and produce a fresh proof run.

## In Scope

- Hard-gate slide 1 template routing in `scripts/check-deck.py`, including safe
  handling of missing, partial, or unparseable per-slide markers.
- Add optional inline-SVG illustration guidance to
  `.codex/agents/apollo/apollo-designer.toml`, scoped to slides 2-10, with the
  fixed-palette / no-opacity / no-gradient / no-`currentColor` / no-external /
  no-raster constraints and `fill="none"` explicitly allowed.
- Keep slide 1 template-only in that guidance: no authored graphics on the
  first frame.
- Targeted tests for the routing gate, marker mismatch/empty, and class-token
  detection. Inline-SVG illustration constraints are authoring guidance, not
  validator checks, so they get no new tests.
- One fresh authored, validated, and exported deck as proof.

## Out Of Scope

- Any change to `templates/first-frame.html` or `templates/frame.html`.
- Any change to `scripts/export-carousel.mjs` or the PNG export contract.
- An asset pipeline, build step, or bundling of any kind.
- A shared sprite sheet, icon set, symbol library, or reusable component set for
  illustrations.
- `imagegen` or any raster/AI-generated imagery.
- Any new manifest fields or manifest behavior change.
- Content review and visual review behavior or reports (milestones 0006/0007).
- Re-authoring, re-rendering, re-exporting, or revalidating existing runs.
- Turning illustrations into a required deck element or a validated deck feature
  beyond the constraint checks named above.
- A new SVG-specific regex/validator subsystem or any new `scripts/check-deck.py`
  check for inline-SVG illustration constraints (palette, opacity, gradients,
  filters, `currentColor`, external/raster refs). Those stay `apollo-designer`
  authoring guidance; the existing generic rules for external URLs, scripts,
  event handlers, and animations/transitions already apply.

## Scenarios

1. **Correctly routed deck.** A deck routes slide 1 through
   `templates/first-frame.html` and slides 2-10 through `templates/frame.html`.
   `scripts/check-deck.py` passes; export produces ten PNGs. Unchanged from
   today.
2. **Slide 1 routed through the body frame.** The author reuses
   `templates/frame.html` for slide 1, so slide 1 carries `body-safe-area` and
   no first-frame marker. Validation fails with a `TEMPLATE_ROUTING` message and
   a nonzero exit; export never runs.
3. **First-frame marker leaks onto a body slide.** Slide 4 carries the
   first-frame marker. Validation fails with a `TEMPLATE_ROUTING` message naming
   slide 4.
4. **Markers cannot be collected.** The deck's structure prevents per-slide
   marker collection (marker count does not match slide count, or markers are
   absent entirely). The validator does not crash and does not pass silently —
   it reports a routing failure and exits nonzero.
5. **Deck with no illustrations.** The author writes text-and-CSS bodies only.
   Nothing changes: the deck validates, exports, and is fully acceptable.
6. **Deck with inline illustrations.** Slides 3 and 6 carry inline `<svg>`
   illustrations — say a terminal window and a set of connectors between state
   blocks — using only fixed-palette hex fills/strokes plus `fill="none"`.
   Validation passes; the deck is still one self-contained offline file.
7. **Illustration reaches outside the vocabulary.** An illustration uses a
   gradient, an opacity value, `currentColor`, or an external/raster reference.
   Guidance forbids it; this is `apollo-designer` authoring guidance, not a new
   validator check, so a violation is an authoring-skill miss rather than a
   validation failure.
8. **Illustration attempted on slide 1.** The first frame stays template-only;
   guidance rules this out, and slide 1's existing fixed presentation contract
   (exactly category / topic / commentary) is unaffected.

## Acceptance Criteria Candidates

These are candidates for the spec to sharpen into exact contract language; the
spec owns final wording and exact error strings.

- Running `scripts/check-deck.py` on a deck with a mis-routed slide 1 exits
  nonzero and prints a `TEMPLATE_ROUTING` message identifying the problem.
- Running `scripts/check-deck.py` on a deck whose per-slide markers cannot be
  collected exits nonzero with a routing failure rather than passing or raising
  an unhandled exception.
- Running `scripts/check-deck.py` on a correctly routed deck (with and without
  inline SVG) exits zero.
- `.codex/agents/apollo/apollo-designer.toml` states the inline-SVG guidance as
  optional, scoped to slides 2-10, with the full constraint list and with
  agent/avatar, app/terminal window, container/state block, and connectors
  presented as examples rather than an exhaustive set.
- `.codex/agents/apollo/apollo-designer.toml` states slide 1 is template-only.
- Targeted routing tests exist for each routing scenario above plus focused
  marker-mismatch/marker-empty and class-token checks, and they pass. No new
  tests cover inline-SVG illustration constraints — those are guidance only.
- A fresh run directory exists containing a validated `deck.html` and
  `slide-01.png` through `slide-10.png` at 1080x1350.
- `git status` shows no modifications to existing run artifacts.

## Settled Decisions

- Slide 1 template routing is a hard structural gate, not advisory. This
  intentionally supersedes milestone 0004's "validator unchanged" boundary.
- A validator that cannot collect per-slide markers fails closed. Silent skip is
  the specific bug being fixed.
- Inline-SVG illustrations are optional authoring guidance, never a required
  deck element and never a new validity requirement in themselves.
- The only new `scripts/check-deck.py` behavior in this milestone is the routing
  hard gate, fail-closed marker collection, and class-token marker detection.
  Inline-SVG illustration constraints are not validator checks and get no new
  tests; the existing generic rules (external URLs, scripts, event handlers,
  animations/transitions) still apply unchanged.
- Illustrations are limited to slides 2-10. Slide 1 stays template-only.
- Illustrations are self-contained inline `<svg>` in `deck.html`: no external
  files, no raster assets, no data-URI images, no sprite sheet, no build step.
- Illustration color comes from direct hex values in the fixed seven-color
  palette. `fill="none"` is allowed.
- Forbidden in illustrations: opacity, gradients, filters, `currentColor`, and
  external or raster references.
- Agent/avatar, app/terminal window, container/state block, and connectors are
  worked examples only. This milestone does not define a closed component set,
  a component library, or a shared sprite.
- Templates, exporter, manifest, and the asset story are untouched.
- Existing runs are frozen; proof comes from one fresh run.

## Architecture Seams

- **Seam 1 (topic -> deck HTML):** inline-SVG illustration guidance extends what
  the `apollo-designer` may author inside each slide 2-10 body-safe area,
  without changing the templates or the fixed visual contract. Illustrations are
  free body composition, not new template chrome.
- **Seam 2 (HTML -> validation/PNG export):** the slide 1 routing hard gate
  strengthens the validation half of the seam. The export half is untouched;
  `scripts/export-carousel.mjs` and the ten-PNG contract keep their current
  behavior. The self-contained/no-external-assets rule already enforced at this
  seam is exactly why illustrations must be inline SVG.
- The seam boundary itself does not move: authoring stays upstream of
  validation, and validation stays the hard gate in front of export.

## Specs

- Proposed: `docs/specs/0005-deck-template-enforcement-and-inline-graphics.md`

## Verification

- `scripts/check-deck.py` targeted routing tests: existing coverage for pass,
  mis-routed slide 1, and first-frame-marker-on-body-slide, plus new focused
  tests for marker mismatch/empty and class-token lists. Inline-SVG illustration
  constraints are `apollo-designer` guidance, not validator checks, so they get no
  new tests.
- Existing `tests/` suite still passes (`tests/test_check_deck.py`,
  `tests/test_frame_template.py`, `tests/test_manifest.py`).
- One fresh end-to-end run: author `deck.html`, validate with
  `scripts/check-deck.py`, export with `node scripts/export-carousel.mjs
  <run-id>`, confirm ten 1080x1350 PNGs.
- Confirm no existing run artifacts were modified.

## Deferred

- Any shared sprite sheet, icon set, or reusable illustration component library.
- Any asset pipeline, build step, or non-inline graphic format.
- Raster or AI-generated imagery (`imagegen`).
- Illustration guidance for slide 1.
- Any new validator enforcement of inline-SVG illustration constraints (palette,
  opacity, gradients, filters, `currentColor`, external/raster refs). These
  remain `apollo-designer` authoring guidance, not validator checks.
- Content-review and visual-review revisions and reports (0006/0007).

## Open Questions

None blocking. The spec may sharpen exact error strings, the precise marker
detection strategy, and the exact test file layout.

## Handoff

- producer skill: `$requirements`
- intended consumer skill: `$spec`
- artifact path: `docs/milestones/0005-deck-template-enforcement-and-inline-graphics.md`
- status: `Verified`
- settled decisions: see **Settled Decisions** above — routing is a hard gate
  that fails closed on missing markers; inline-SVG illustration guidance is
  optional, slides 2-10 only, fixed-palette direct hex with `fill="none"`
  allowed, no opacity/gradients/`currentColor`/external or raster assets; the
  four named subjects are examples, not a closed set; templates, exporter,
  manifest, asset pipeline, shared sprite, and `imagegen` are all out of scope;
  existing runs stay untouched.
- unresolved blockers: none
- docs / specs / milestones the next skill must read:
  - `docs/milestones/0004-first-frame-template-composition.md` (two-template
    contract this builds on, and the validator boundary now superseded)
  - `docs/ARCHITECTURE.md` (Seam 1 and Seam 2)
  - `docs/CONTEXT.md` (fixed palette, `hybrid visual system`, `validity
    contract`)
  - `docs/WORKFLOWS.md` (handoff + spec status contract)
  - proposed spec: `docs/specs/0005-deck-template-enforcement-and-inline-graphics.md`
  - implementation touchpoints: `scripts/check-deck.py`,
    `.codex/agents/apollo/apollo-designer.toml`, `tests/test_check_deck.py`
- agent routing log:
  - `requirements`: used
  - `explorer`: not applicable for this scoped milestone-authoring pass
  - `spec-planner`: not applicable (spec authoring is the consumer's step)
  - `spec-griller`: not applicable (no spec drafted in this pass)
  - `codex-agent-tracer`: not applicable for this scoped pass
- trace path: `.agent-trace/requirements-0005-template-enforcement`
