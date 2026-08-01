# Spec: Frame Template Contract

## Status

Verified

## Goal

Establish `templates/frame.html` as the single checked-in standalone 1080×1350
source slide that locks Apollo's visual frame — header, footer, visual feel,
type, and colors — while leaving exactly one CSS-sized
`<div id="body-safe-area">` for free author composition. This settles the
fixed-visual contract that manifest configuration (spec 0004) and later review
milestones (milestones 0006, 0007) build on.

## Scenario

1. `$apollo` reads `templates/frame.html` to obtain the fixed visual frame.
2. It repeats the one-slide template ten times into
   `runs/<run-id>/deck.html`.
3. For each slide, it fills the slide's `<div id="body-safe-area">` with
   authored body content while leaving the header and footer markup and CSS
   identical to the template.
4. The structural validator (`scripts/check-deck.py`) validates the resulting
   deck, excluding the body-safe area from frame validation.

## Architecture Reference

`docs/ARCHITECTURE.md` — Seam 1 (Topic → deck HTML boundary): the frame
template is the fixed visual contract; each slide's body-safe area is the
author's free composition surface. Seam 2 (HTML → validation/PNG export
boundary): the validity contract (exactly ten 1080×1350 slides, no external
assets, no network, no interactivity or animation) is preserved unchanged.

## In Scope

- `templates/frame.html`: one standalone 1080×1350 source slide (not a full
  deck) containing:
  - Locked header markup.
  - Locked footer markup.
  - Shared visual feel, type, and colors.
  - Exactly one CSS-sized `<div id="body-safe-area">` for author body
    content.
- The frame template is the single source of truth for the visual frame.
  Every generated slide's header and footer must match its markup and CSS
  exactly; only body content inside the body-safe area varies between slides
  and between decks.
- The existing validity contract holds: exactly ten 1080×1350 slides, no
  external assets, no network, no interactivity or animation.

## Out Of Scope

- `templates/manifest.json` and revision-limit configuration (spec 0004).
- `$apollo` authoring alignment to repeat the template and fill the
  body-safe area (spec 0004).
- Content review behavior and content-review reports (milestone 0006).
- Visual review behavior and rendered-PNG visual reports (milestone 0007).
- Any reviewer report generation or export changes driven by the manifest.
- Any change to structural validation or PNG export (owned by specs
  0001/0002).

## Architecture Seams

- **Seam 1 (Topic → deck HTML)**: `templates/frame.html` is the fixed visual
  contract. The header, footer, visual feel, type, and colors are locked; the
  author composes body content freely within each slide's CSS-sized
  `<div id="body-safe-area">`. There is no separate outline artifact and no
  deterministic body layout engine. The frame is fixed; the author does not
  restyle it.
- **Seam 2 (HTML → validation/PNG export)**: the frame template must not
  introduce external assets, network dependencies, interactivity, or
  animation. The structural validator excludes the body-safe area from frame
  validation, leaving body content and styling inside it to author
  discretion.

## Contracts

### `templates/frame.html`

- **Location**: `templates/frame.html`.
- **Form**: one standalone 1080×1350 source slide — a single
  `<section class="slide">` element declaring `width: 1080px; height: 1350px`
  via inline `style` or embedded `<style>`, not a full ten-slide deck.
- **Fixed regions**: locked header markup, locked footer markup, shared
  visual feel, type, and colors. These must be present in the template and
  preserved verbatim (markup and CSS) in every generated slide.
- **Author region**: exactly one `<div id="body-safe-area">`, CSS-sized within
  the slide, that the author fills with body content. The template ships this
  div empty or with placeholder content; the author replaces it per slide.
- **Self-contained**: no external assets, no network dependencies, no
  `<script>` elements, no `on*` attributes, no CSS animations/transitions/
  `@keyframes`, no external font `<link>` or `@font-face` with external `src`.
  Styles are inline or embedded `<style>` only. System fonts only.
- **Frame stability**: every generated slide's header and footer must match
  the template markup and CSS exactly. Validation of the frame excludes the
  body-safe area; body content and styling inside it are left to author
  discretion.

### Relationship to the structural validator

- `scripts/check-deck.py` is reused unchanged (owned by spec 0001). It
  validates the generated `deck.html` for exactly ten slides, correct
  dimensions, no external assets, no scripts, no animations — the existing
  rules. It does not validate frame-specific header/footer/body-safe-area
  structure; that is an authoring-skill responsibility, not a parser rule.
- The frame template must be compatible with the existing validator: the
  template's slide element must declare `width: 1080px; height: 1350px` so
  that repeated slides pass `dim_ok` without modification.

## Failure Modes

| Failure | Behavior |
|---------|----------|
| `templates/frame.html` missing | `$apollo` cannot produce a valid deck; the run fails before any deck is written. |
| Template not 1080×1350 | Repeated slides fail `DIMENSIONS` check in `scripts/check-deck.py`. |
| Template contains external URL/font | Repeated slides fail `EXTERNAL_URL` or `EXTERNAL_FONT` check. |
| Template contains `<script>` or `on*` | Repeated slides fail `SCRIPT` or `EVENT_HANDLER` check. |
| Template contains CSS animation/transition | Repeated slides fail `ANIMATION` check. |
| Template missing `<div id="body-safe-area">` | Author has no composition surface; deck is invalid by contract. Not caught by the structural validator — this is an authoring-skill and visual-review responsibility. |
| Generated slide header/footer differs from template | Frame contract violation. Not caught by the structural validator — this is a visual-review responsibility (milestone 0007). |

## Acceptance Criteria

- `templates/frame.html` exists as a single standalone 1080×1350 source slide.
- It contains the locked header, footer, visual feel, type, and colors.
- It contains exactly one CSS-sized `<div id="body-safe-area">`.
- It passes `scripts/check-deck.py` when validated as part of a generated
  ten-slide deck — no external assets, no scripts, no animations, correct
  dimensions.
- A generated `deck.html` that repeats the template ten times and fills each
  body-safe area passes `scripts/check-deck.py` (exit 0).
- Every generated slide's header and footer match the template markup and CSS
  exactly; only body content inside the body-safe area varies.

## Verification

1. **Template self-check**: validate `templates/frame.html` by building a
   one-slide or ten-slide fixture derived from it and running
   `scripts/check-deck.py`. Assert exit 0.
2. **Generated-deck check**: produce a `runs/<run-id>/deck.html` by repeating
   the template ten times with placeholder body content in each
   `body-safe-area`. Run `scripts/check-deck.py` → exit 0.
3. **Frame-identity check** (manual or via visual review): confirm each
   generated slide's header and footer markup and CSS are identical to the
   template. The structural validator does not enforce this; it is an
   authoring-skill and visual-review responsibility.

## Open Questions

- Should `scripts/check-deck.py` gain a rule asserting exactly one
  `<div id="body-safe-area">` per slide and header/footer presence? The
  milestone scopes this as an authoring-skill responsibility, not a parser
  rule. If frame-identity enforcement is needed before milestone 0005, it
  would require a validator extension owned by a follow-up spec.
