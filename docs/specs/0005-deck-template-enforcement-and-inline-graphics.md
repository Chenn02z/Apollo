# Spec: Deck Template Enforcement And Inline Graphics

## Status

Verified

## Goal

Turn slide 1 template routing into a structural hard gate that fails closed when
per-slide markers are missing or unparseable, and give `apollo-designer` bounded
optional guidance for authoring self-contained inline-SVG illustrations on
slides 2-10. A deck whose slide 1 is mis-routed fails validation with a clear
`TEMPLATE_ROUTING` message; illustration constraints stay authoring guidance,
not validator checks, so they get no tests.

## Scenario

1. A developer authors `runs/<run-id>/deck.html` where slide 1 uses
   `templates/first-frame.html` (carries `first-frame-body`, no `body-safe-area`)
   and slides 2-10 use `templates/frame.html` (carry `body-safe-area`, no
   `first-frame-body`), optionally with inline-SVG illustrations inside each
   slide 2-10 `body-safe-area`.
2. `scripts/check-deck.py deck.html` exits 0: slide 1 routing is confirmed,
   marker collection is consistent with slide count, and any inline SVG respects
   the fixed palette and the no-opacity/no-gradient/no-`currentColor`/no-external
   guidance (guidance is not enforced by the validator).
3. If slide 1 lacks `first-frame-body`, or carries `body-safe-area`, or any
   slide 2-10 carries `first-frame-body`, or `slide_markers` is empty / its count
   differs from the slide count, the checker exits 1 with one or more
   `TEMPLATE_ROUTING` lines and never passes a deck it could not route-check.

## Architecture Reference

`docs/ARCHITECTURE.md` — Seam 1 (Topic → deck HTML): `apollo-designer` may now
compose self-contained inline SVG inside each slide 2-10 `body-safe-area` without
altering the templates or the fixed visual contract; slide 1 stays template-only.
Seam 2 (HTML → validation/PNG export): this spec strengthens the validation half
of the seam — the slide 1 routing gate — and explicitly supersedes the "Validator,
exporter, and manifest are unchanged" boundary that milestone/spec 0004 carried.
The export half, `scripts/export-carousel.mjs`, and the ten-PNG contract are
untouched. All other seams, including the self-contained/no-external-assets rule,
remain unchanged.

## In Scope

- Hard-gate slide 1 template routing in `scripts/check-deck.py`:
  - Fail closed when `slide_markers` is empty, or when `len(slide_markers) !=
    len(slides)`. A routing failure is reported, not skipped, whenever the
    validator cannot confirm per-slide marker membership.
  - Use class-token membership (whitespace-split class list) for detecting a
    `section.slide` and a `first-frame-body` element; match `body-safe-area` by
    exact `id`. No element may route on a partial/suffix class match.
  - Class-token membership applies to BOTH existing detections: the section-slide
    enumeration (a `class` containing the token `slide`) and the first-frame-body
    marker (a `class` containing the token `first-frame-body`); `body-safe-area`
    detection stays an exact `id` match, unchanged.
  - Slide 1 must contain `first-frame-body` and must not contain
    `body-safe-area`; each slide 2-10 must not contain `first-frame-body`.
  - Existing `TEMPLATE_ROUTING` error strings may be preserved; define clear
    mismatch (count != slides) and empty (zero detected marker sets) routing
    errors so each failure mode is individually diagnosable.
- Add optional inline-SVG illustration authoring guidance to
  `.codex/agents/apollo/apollo-designer.toml`, scoped to slides 2-10
  `body-safe-area` only:, as a new section inside the existing
  `developer_instructions` block — placed immediately after `Aesthetic direction`
  and immediately before `Content discipline`:
  - Fills and strokes use direct hex values drawn only from the fixed seven-color
    palette (`#1C1C1C`, `#506B62`, `#A85F47`, `#5D7094`, `#A9824F`, `#806277`,
    `#8E6A58`). `fill="none"` is allowed.
  - Forbidden: opacity, gradients, filters, `currentColor`, `<img>`, `<use>`,
    raster, and any external reference.
  - Slide 1 stays template-only: no authored illustration, inline SVG, or added
    graphic of any kind.
  - Agent/avatar, app/terminal window, container/state block, and connectors are
    worked examples, not a closed component set or library — other subjects are
    permitted within the same constraints.
- Add focused `tests/test_check_deck.py` cases only for marker count
  mismatch/empty and class-token membership. Existing routing tests are preserved.
- Produce one fresh proof run: author `deck.html`, validate, export ten
  1080×1350 PNGs under a new `runs/<run-id>/`.

## Out Of Scope

- Any new validator check for inline-SVG illustration constraints (palette,
  opacity, gradients, filters, `currentColor`, external/raster refs). These are
  `apollo-designer` authoring guidance only and get no tests; a deck with no
  inline SVG is still valid and still passes.
- SVG-specific validator regexes/checks/tests of any kind. The existing generic
  external-URL, external-font, `<script>`, `on*` event handler, and
  animation/transition rules are unchanged and continue to apply.
- Changes to `templates/`, `scripts/export-carousel.mjs`, or the manifest.
- Re-authoring, re-rendering, re-exporting, or re-validating any existing
  `runs/` artifact.
- A shared sprite sheet, icon set, reusable illustration component library, asset
  pipeline, build step, non-inline graphic format, raster or AI-generated imagery
  (`imagegen`), and illustration guidance for slide 1.
- Content-review and visual-review revisions and reports (milestones 0006 / 0007).

## Architecture Seams

- **Seam 1 (Topic → deck HTML)**: inline-SVG illustration guidance extends what
  `apollo-designer` may author inside each slide 2-10 `body-safe-area` as free
  body composition, without changing the templates or the fixed visual contract.
  Illustrations are free body composition, not new template chrome; slide 1
  remains template-only.
- **Seam 2 (HTML → validation/PNG export)**: the slide 1 routing hard gate
  strengthens the validation half only. The export half is unchanged; the
  self-contained/no-external-assets rule already enforced at this seam is exactly
  why illustrations must be inline SVG. The seam boundary itself does not move:
  authoring stays upstream of validation, and validation stays the hard gate in
  front of export.

## Contracts

### `scripts/check-deck.py` routing gate (new behavior ONLY)

- **Fail-closed marker collection**: the empty and count-mismatch
  `TEMPLATE_ROUTING` checks execute outside and before the aligned per-slide
  routing checks. If `len(slide_markers) != len(slides)` (count mismatch, e.g. an
  unclosed/malformed slide that never appends its marker set), report the mismatch
  and skip the per-slide routing checks, because the marker sets are unreliable.
  If `len(slide_markers) == 0` (zero detected marker sets) while slides are present,
  report one empty-specific `TEMPLATE_ROUTING` message to avoid duplicate routing
  noise, and skip the per-slide routing checks. Neither condition may be skipped or
  silently passed. The independent `SLIDE_COUNT` check remains separate and may
  also report.
- **Class-token membership**: detect a slide via `section.slide` and a
  `first-frame-body` element via class-token membership over a whitespace-split
  class list (so `class="slide large"` and `class="x first-frame-body y"` both
  match) — this is BOTH detections: section-slide enumeration (token `slide`) and
  the first-frame-body marker (token `first-frame-body`). Match `body-safe-area`
  by exact `id` attribute only (unchanged).
- **Slide 1 rules**: must contain `first-frame-body`; must not contain
  `body-safe-area`. Violations emit `TEMPLATE_ROUTING` lines and exit 1.
- **Slides 2-10 rules**: must not contain `first-frame-body`. A violation emits a
  `TEMPLATE_ROUTING` line and exits 1.
- **Error clarity**: define distinct `TEMPLATE_ROUTING` messages for the empty
  (zero marker sets) and mismatch (count != slides) cases; existing
  missing-`first-frame-body` / `body-safe-area`-present / body-slide-has-`first-frame-body`
  strings may be preserved where they already exist.
- **Untouched**: all existing generic rules (external URL, external font,
  `<script>`, `on*` handler, animation/transition) and the non-routing exit logic
  are unchanged. No SVG-specific regex/check is added.

### `apollo-designer` inline-SVG guidance (authoring only)

- **Scope**: slides 2-10 `body-safe-area` only. Slide 1 is template-only.
- **Placement**: a new section inside the existing `developer_instructions` block
  of `.codex/agents/apollo/apollo-designer.toml`, immediately after
  `Aesthetic direction` and immediately before `Content discipline`.
- **Color**: direct hex fill/stroke from the fixed palette only; `fill="none"`
  allowed.
- **Forbidden**: opacity, gradients, filters, `currentColor`, `<img>`, `<use>`,
  raster, external references.
- **Subjects**: agent/avatar, app/terminal window, container/state block,
  connectors are examples, not a closed set or library.
- **Not enforced**: these are prompt guidance; violating them is not a validator
  failure and produces no test.

### Proof run

- One fresh `runs/<run-id>/deck.html`, validated and exported to ten 1080×1350
  PNGs. Existing `runs/` artifacts are unchanged.

## Failure Modes

- **Unclosed/malformed slide**: a `<section class="slide">` that is never closed
  leaves `cur_markers` unset, so its marker set is never appended. This yields
  `len(slide_markers) < len(slides)` — a count mismatch — which must fail closed
  as a `TEMPLATE_ROUTING` mismatch, not crash and not silently pass.
- **Zero detected marker sets**: a deck whose slides are present but produce no
  appended marker sets (e.g. markers not detected under the new token/ID rules)
  must fail closed as a `TEMPLATE_ROUTING` empty-routing error, reported
  alongside — not in place of — the existing slide-count check when slide count
  is also off. It is never skipped.
- **Mis-routed slide 1**: slide 1 lacking `first-frame-body` or carrying
  `body-safe-area` is a `TEMPLATE_ROUTING` failure.
- **first-frame-body on a body slide**: any slide 2-10 carrying
  `first-frame-body` is a `TEMPLATE_ROUTING` failure.
- **Guidance violation**: an inline-SVG illustration that breaks palette/opacity/
  gradient/`currentColor`/external rules is NOT a validator failure — it is an
  `apollo-designer` authoring-guidance deviation and must not be reported as a
  `TEMPLATE_ROUTING` or any other check error.

## Acceptance Criteria

- `scripts/check-deck.py` exits 1 with `TEMPLATE_ROUTING` when slide 1 lacks
  `first-frame-body` or carries `body-safe-area`, and when any slide 2-10 carries
  `first-frame-body`.
- `scripts/check-deck.py` exits 1 with a `TEMPLATE_ROUTING` empty or mismatch
  message when `slide_markers` is empty or its count differs from the slide
  count, including the unclosed-slide case; it never crashes and never silently
  passes a deck it could not route-check.
- Routing detection uses class-token membership for `section.slide` and
  `first-frame-body` and exact `id` for `body-safe-area`.
- `.codex/agents/apollo/apollo-designer.toml` carries optional inline-SVG
  guidance scoped to slides 2-10 only, with the fixed-palette / `fill="none"` /
  no-opacity/no-gradient/no-filter/no-`currentColor`/no-external/no-raster
  constraints; slide 1 stays template-only.
- A deck with no inline SVG remains valid and passes.
- Templates, exporter, manifest, and the generic validator rules are unchanged.

## Verification

- `tests/test_check_deck.py`: preserve existing pass, mis-routed-slide-1, and
  first-frame-marker-on-body-slide routing tests. Add focused new tests only for:
  - marker count mismatch — construct so `len(slide_markers) != len(slides)`,
    including an unclosed/malformed slide (a `<section class="slide">` left open
    so its markers never append); assert `TEMPLATE_ROUTING` mismatch and exit 1;
  - empty markers — a deck with present slides but zero appended marker sets;
    assert `TEMPLATE_ROUTING` empty-routing error and exit 1 (proves routing is
    not skipped when markers are empty);
  - class-token membership — slides with multi-token classes (`class="slide
    large"`) and first-frame-body with sibling classes (`class="x first-frame-body
    y"`) still route correctly; exact `id="body-safe-area"` still matches while a
    non-matching id does not.
  - Do NOT add any SVG-specific validator test; illustration constraints get no
    tests.
- Existing `tests/` suite still passes (`tests/test_check_deck.py`,
  `tests/test_frame_template.py`, `tests/test_manifest.py`).
- One fresh end-to-end run: author `deck.html`, validate with
  `scripts/check-deck.py`, export with `node scripts/export-carousel.mjs
  <run-id>`, confirm ten 1080×1350 PNGs. Confirm no existing `runs/` artifact was
  modified.

## Handoff

- **producer skill**: `$spec`
- **intended consumer skill**: `$dev-loop`
- **artifact path**: `docs/specs/0005-deck-template-enforcement-and-inline-graphics.md`
- **status**: `Verified`
- **settled decisions**:
  - Slide 1 routing is a fail-closed structural gate; empty/count-mismatch
    `TEMPLATE_ROUTING` checks run outside and before the aligned per-slide routing
    checks and skip per-slide checks when marker sets are unreliable or empty.
  - Class-token membership applies to BOTH detections: section-slide enumeration
    (token `slide`) and the first-frame-body marker (token `first-frame-body`);
    `body-safe-area` stays an exact `id` match.
  - Inline-SVG illustration guidance is authoring-only, added as a new section inside
    `developer_instructions` in `apollo-designer.toml` after `Aesthetic direction`
    and before `Content discipline`; no validator regex/tests.
  - No SVG validator regex/tests; spec numbering 0005/0006/0007 preserved.
- **unresolved blockers**: none
- **docs / specs / milestones the next skill must read**:
  - `docs/WORKFLOWS.md` (handoff + spec status contract)
  - `docs/ARCHITECTURE.md` (Seams 1 and 2)
- **agent routing log**:
  - `explorer`: not applicable for this scoped single-spec authoring pass
  - `spec-planner`: used
  - `spec-griller`: used; review passed and gate cleared before acceptance
  - `codex-agent-tracer`: not applicable for this scoped pass
- **trace path**: `.agent-trace/spec-0005-deck-template`

## Open Questions

None. (Exact error-string wording, the precise marker-detection strategy, and the
exact test layout were settled by the spec-planner; the handoff to `$dev-loop`
is `Accepted` after the `$spec-griller` review passed this pass.)
