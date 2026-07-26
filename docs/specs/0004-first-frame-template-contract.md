# Spec: First-Frame Template Contract

## Status

Accepted

## Goal

Split Apollo's locked visual frame into two immutable standalone templates so
that slide 1 (the first frame) carries a fixed presentation — exactly a
category, a topic, and a commentary — while slides 2–10 keep the free body
composition from milestone 0003. Running `$apollo` on a topic produces
`runs/<run-id>/deck.html` as exactly ten 1080×1350 slides where slide 1 uses a
new `templates/first-frame.html` and slides 2–10 use the extended
`templates/frame.html`. The rail and rotated `get cracked` label render
identically from the templates on every slide, and all validity checks and PNG
export from milestones 0001/0002/0003 keep passing.

## Scenario

1. A developer runs `$apollo` on a topic.
2. `$apollo` reads `templates/first-frame.html` for slide 1 and
   `templates/frame.html` for slides 2–10.
3. For slide 1, it fills the fixed first-frame presentation with exactly a
   category, a topic (default ink, optional fixed-palette inline highlight
   spans), and a commentary — no `#body-safe-area` and no `archetype-*` class.
4. For slides 2–10, it fills each slide's `<div id="body-safe-area">` with free
   body composition, assigning exactly one existing `archetype-*` class per
   slide as today.
5. Slide 10 is authored as a center-center follow-up within its safe area,
   following `$apollo` prompt guidance (not a template rule).
6. The template renders the 8px fixed-position/fixed-length rail and the rotated
   `get cracked` label (left of the rail) identically on every slide; neither
   overlaps body content.
7. `scripts/check-deck.py` validates the resulting `deck.html` and
   `node scripts/export-carousel.mjs <run-id>` rasterizes ten 1080×1350 PNGs;
   both pass unchanged.

## Architecture Reference

`docs/ARCHITECTURE.md` — Seam 1 (Topic → deck HTML boundary): the frame is the
fixed visual contract; each body slide's safe area is the author's free
composition surface. This spec extends Seam 1 by introducing a second fixed
template (`templates/first-frame.html`) for slide 1 while preserving the
milestone-0003 `templates/frame.html` contract for slides 2–10. Seam 2 (HTML →
validation/PNG export boundary): the validity contract (exactly ten 1080×1350
slides, no external assets, no network, no interactivity or animation) is
preserved unchanged; validator, exporter, and manifest are not modified.

## In Scope

- Add `templates/first-frame.html` as one standalone 1080×1350 source slide used
  **only** for slide 1, carrying the fixed first-frame presentation with exactly
  three authored slots: category, topic, commentary. It does **not** carry a
  `#body-safe-area` element or any `archetype-*` class.
- Extend `templates/frame.html` (milestone 0003) so it serves slides 2–10 and
  owns the rail plus rotated `get cracked` label with the same fixed treatment
  as the first frame. Its `#body-safe-area` element and existing `archetype-*`
  class contract are unchanged from milestone 0003; slides 2–10 retain the
  existing archetype classes.
  - Clarification: `templates/frame.html` gains only the rail/`get cracked`
    chrome in this milestone; its `#body-safe-area` and `archetype-*` class
    contract remain unchanged from milestone 0003.
- Define the fixed palette as both templates' sole palette tokens, exactly seven
  inline hex values (see Contracts). No new JSON token files; the two templates
  deliberately duplicate the seven tokens and are kept in lockstep by hand with
  no new CI/build abstraction to synchronize them.
- Fix the typography roles in both templates: Georgia for editorial heading and
  body type; the standard system sans stack
  `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  for component headings; SF Mono/Menlo for labels and code.
- During implementation, copy the rail plus rotated `get cracked` label geometry
  exactly from the reference run
  `runs/run-bd27fe93-c61c-4c91-a9dc-02936267401f/deck.html` into both templates.
  This geometry is not assumed to already exist in `templates/frame.html`; it
  must be transcribed from the reference run.
- Fix the first-frame contract: fixed category/commentary placement, type, and
  color (agent authors wording only); topic defaults to `#1C1C1C`, wraps
  naturally, with allowed inline foreground highlight spans drawn solely from the
  fixed palette. These inline highlight spans are first-frame-only.
- Route `$apollo` authoring through the two templates (slide 1 →
  `first-frame.html`, slides 2–10 → `frame.html`). Template-consumer files are
  in scope: `.agents/skills/apollo/SKILL.md`,
  `.codex/agents/apollo/apollo-designer.toml`, and the `$apollo` routing path.
- In `.codex/agents/apollo/apollo-designer.toml`, remove **only** the stale
  `.archetype-takeaway` prompt mention. No CSS class is deleted from either
  template.

## Out Of Scope

- Any change to the structural validator (`scripts/check-deck.py`), the PNG
  exporter (`scripts/export-carousel.mjs`), or `templates/manifest.json`; all
  remain unchanged.
- Modifying, re-exporting, or re-validating existing runs under `runs/`,
  including the reference run
  `runs/run-bd27fe93-c61c-4c91-a9dc-02936267401f/deck.html`, which remains a
  valid, unmodified example of the prior single-template output.
- Introducing any new JSON token file, CI job, or build step to synchronize the
  duplicated palette tokens.
- Deleting any CSS class from either template (only the stale
  `.archetype-takeaway` prompt mention is removed, from the designer agent).
- Adding a fixed semantic color mapping for body content; per-deck color
  meanings are agent-chosen from the fixed palette (prompt guidance).
- Content-review revisions/reports (milestone 0005) and visual-review
  revisions/reports (milestone 0006), and any escalation of review into a gate.

## Architecture Seams

- **Seam 1 (Topic → deck HTML)**: two fixed templates now define the visual
  contract. `templates/first-frame.html` locks slide 1's category / topic /
  commentary presentation; `templates/frame.html` locks the frame for slides
  2–10 and exposes exactly one CSS-sized `<div id="body-safe-area">` per slide.
  Both templates own the rail and rotated `get cracked` label. The author fills
  fixed slots (first frame) or composes freely in the safe area (body slides);
  the author never restyles the frame, rail, palette, or typography roles. No
  separate outline artifact and no deterministic body layout engine are
  introduced.
- **Seam 2 (HTML → validation/PNG export)**: neither template introduces
  external assets, network dependencies, `<script>`, `on*` handlers, or CSS
  animation/transition. The validator, exporter, and manifest are reused
  unchanged; the existing validity contract holds without extension.

## Contracts

### `templates/first-frame.html`

- **Location**: `templates/first-frame.html`.
- **Form**: one standalone 1080×1350 source slide — a single
  `<section class="slide">` declaring `width: 1080px; height: 1350px` — used for
  slide 1 only.
- **Authored slots**: exactly three — category, topic, commentary.
  - Category: agent-authored plain text; wording only. Fixed placement, type,
    and color from the template.
  - Topic: renders at the default foreground `#1C1C1C`, wrapping naturally. The
    agent may wrap selected inline words in foreground `<span>`s whose color is
    drawn solely from the fixed palette below. No other topic styling, color, or
    background is permitted. These inline highlight spans are first-frame-only.
  - Commentary: agent-authored plain text; wording only. Fixed placement, type,
    and color from the template.
- **No body region / no archetype**: the first frame does **not** contain a
  `#body-safe-area` element or any `archetype-*` class.
- **Chrome**: owns one 8px fixed-position, fixed-length rail plus the rotated
  `get cracked` label to the rail's left, rendered by the template (not the
  agent), never overlapping the presentation content. Color chosen by the
  template from the fixed palette. Geometry transcribed exactly from the
  reference run.

### `templates/frame.html`

- **Location**: `templates/frame.html`; extends milestone 0003.
- **Form**: one standalone 1080×1350 source slide used for slides 2–10.
- **Author region**: exactly one CSS-sized `<div id="body-safe-area">`; its
  existing `archetype-*` class contract is unchanged from milestone 0003. Slides
  2–10 retain and assign the existing archetype classes as today (exactly one per
  slide; no adjacent reuse).
- **Chrome**: owns the same 8px fixed-position, fixed-length rail plus rotated
  `get cracked` label with identical fixed treatment to the first frame,
  rendered by the template and never overlapping body content. Geometry
  transcribed exactly from the reference run.

### Fixed palette (both templates)

The sole palette tokens in both templates, exactly:

`#1C1C1C`, `#506B62`, `#A85F47`, `#5D7094`, `#A9824F`, `#806277`, `#8E6A58`.

- Defined as inline hex in both templates; no new JSON token file. The templates
  remain the source of truth for color.
- The two templates deliberately duplicate these seven tokens and must be kept in
  lockstep by hand. No new CI/build abstraction is added to synchronize them.

### Fixed typography roles (both templates)

- Editorial heading and body type: Georgia.
- Component headings: the standard system sans stack
  `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- Labels and code: SF Mono / Menlo.
- Both templates fix the first-frame treatments within these roles; body
  treatments on slides 2–10 may vary only within these same roles.

### Rail and `get cracked` label (both templates)

- Every slide's template owns one 8px rail at a fixed position and fixed length,
  plus the rotated `get cracked` label positioned to the rail's left.
- Rendered by the template, not the agent; never overlapping body/presentation
  content. Color chosen by the template from the fixed palette. Rails are
  template-fixed with no per-deck variation.
- The rail plus label geometry is copied exactly during implementation from
  `runs/run-bd27fe93-c61c-4c91-a9dc-02936267401f/deck.html`. It is not assumed to
  already exist in `templates/frame.html`.
- Prompt guidance states only that the agent must not inject or restyle the rail
  and its label; the rail is not otherwise agent prompt guidance.

### `$apollo` routing and consumer files

- `$apollo` routes slide 1 → `templates/first-frame.html` and slides 2–10 →
  `templates/frame.html` for every newly authored deck.
- Consumer files updated to reflect the split routing and the first-frame
  contract: `.agents/skills/apollo/SKILL.md` and
  `.codex/agents/apollo/apollo-designer.toml`.
- In `.codex/agents/apollo/apollo-designer.toml`, remove only the stale
  `.archetype-takeaway` prompt mention. No CSS class is deleted from either
  template.

### Preserved external contracts

- `scripts/check-deck.py`, `scripts/export-carousel.mjs`, and
  `templates/manifest.json` are reused unchanged.
- The self-contained contract holds: exactly ten 1080×1350 slides, no external
  assets, no network, no interactivity or animation.
- Existing runs under `runs/` (including the reference run) are not modified,
  re-exported, or re-validated.

## Failure Modes

| Failure | Behavior |
|---------|----------|
| `templates/first-frame.html` missing | `$apollo` cannot author slide 1's fixed presentation; the run fails before a valid deck is written. |
| `templates/frame.html` missing | `$apollo` cannot author slides 2–10; the run fails. |
| First frame carries `#body-safe-area` or an `archetype-*` class | First-frame contract violation; not caught by the structural validator — authoring-skill and visual-review responsibility. |
| Topic styled with color/background outside the fixed palette, or a highlight span used outside the first frame | Contract violation; the only allowed topic styling is default `#1C1C1C` plus fixed-palette inline highlight spans, first-frame-only. |
| A palette value outside the seven fixed tokens appears in a template | Palette contract violation; templates must define exactly the seven tokens as their sole palette. |
| Palette tokens drift between the two templates | Lockstep violation; the duplicated tokens must be hand-synchronized (no CI/build guard exists by design). |
| Rail/label geometry assumed present rather than transcribed | Implementation error; geometry must be copied exactly from the reference run. |
| Rail or label overlaps body/presentation content | Frame contract violation; visual-review responsibility. |
| Template introduces external URL/font, `<script>`, `on*`, or CSS animation | Repeated slides fail the corresponding `scripts/check-deck.py` check. |
| Template slide not 1080×1350 | Repeated slides fail the `DIMENSIONS` check in `scripts/check-deck.py`. |
| Existing run modified or re-exported | Out-of-scope change; the reference run must remain unmodified. |

## Acceptance Criteria

- `templates/first-frame.html` exists as a single standalone 1080×1350 source
  slide with exactly three authored slots (category, topic, commentary) and no
  `#body-safe-area` element and no `archetype-*` class.
- `templates/frame.html` remains a single standalone 1080×1350 source slide for
  slides 2–10 with its milestone-0003 `#body-safe-area` and existing
  `archetype-*` class contract unchanged.
- Both templates define exactly the seven fixed palette tokens as their sole
  palette, as inline hex, with no new JSON token file and no new CI/build
  synchronization.
- Both templates fix the typography roles: Georgia editorial heading/body; the
  system sans stack `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
  Roboto, sans-serif` for component headings; SF Mono/Menlo for labels/code.
- Both templates render one 8px fixed-position/fixed-length rail plus the rotated
  `get cracked` label to its left, with geometry matching the reference run and
  never overlapping content.
- The first frame's topic renders at `#1C1C1C`, wraps naturally, and permits only
  fixed-palette inline highlight spans; category and commentary are agent
  wording within fixed placement/type/color.
- Running `$apollo` produces `runs/<run-id>/deck.html` with slide 1 from
  `first-frame.html` and slides 2–10 from `frame.html`; the deck passes
  `scripts/check-deck.py` (exit 0) and PNG export produces ten 1080×1350 PNGs.
- `.agents/skills/apollo/SKILL.md` and
  `.codex/agents/apollo/apollo-designer.toml` reflect the two-template routing;
  only the stale `.archetype-takeaway` prompt mention is removed, with no CSS
  class deleted.
- `scripts/check-deck.py`, `scripts/export-carousel.mjs`,
  `templates/manifest.json`, and all existing runs are unchanged.

## Verification

- Extend/keep the existing template tests in `tests/test_frame_template.py`
  proportionally so `templates/frame.html` still satisfies its milestone-0003
  contract (dimensions, self-contained rules, one body-safe-area, frame
  identity) after the extension.
- Add one focused first-frame test asserting `templates/first-frame.html` is a
  single 1080×1350 slide, carries exactly the category/topic/commentary slots,
  has no `#body-safe-area` and no `archetype-*` class, defines exactly the seven
  fixed palette tokens, and renders the rail plus `get cracked` label.
- Do not extend `scripts/check-deck.py` or its tests; validation/export coverage
  is unchanged and validated only through the existing `check-deck` and export
  paths.
- Manual smoke: author a deck via `$apollo`, confirm slide 1 uses the first-frame
  presentation and slides 2–10 use body composition, then run
  `scripts/check-deck.py` (exit 0) and `node scripts/export-carousel.mjs
  <run-id>` (ten 1080×1350 PNGs).
- Confirm the reference run and other existing runs are byte-for-byte unchanged.

## Open Questions

- None. All contract points (no body-safe-area/archetype on the first frame,
  retained archetype classes on slides 2–10, exact seven-token inline palette in
  manual lockstep, exact font stacks, rail geometry transcribed from the
  reference run, first-frame-only highlights, stale-mention-only removal,
  untouched existing runs, and unchanged validator/exporter/manifest) are settled
  by the Accepted milestone.

## Handoff

- **producer skill**: `$spec`
- **intended consumer skill**: `$dev-loop`
- **artifact path**: `docs/specs/0004-first-frame-template-contract.md`
- **status**: `Accepted`
- **settled decisions**:
  - Two immutable standalone templates: `templates/first-frame.html` (slide 1)
    and `templates/frame.html` (slides 2–10).
  - First frame carries exactly category / topic / commentary; no
    `#body-safe-area` and no `archetype-*` class. Slides 2–10 retain the existing
    archetype classes unchanged from milestone 0003.
  - Fixed palette = exactly `#1C1C1C`, `#506B62`, `#A85F47`, `#5D7094`,
    `#A9824F`, `#806277`, `#8E6A58`, defined inline as both templates' sole
    palette; no new JSON token file; manual lockstep with no new CI/build.
  - Typography roles fixed: Georgia editorial heading/body; system sans stack
    `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif` for component headings; SF Mono/Menlo labels/code.
  - Topic defaults to `#1C1C1C`; only fixed-palette inline highlight spans are
    allowed, first-frame-only.
  - Both templates own one 8px fixed-position/fixed-length rail plus rotated
    `get cracked` label; geometry transcribed exactly from
    `runs/run-bd27fe93-c61c-4c91-a9dc-02936267401f/deck.html` during
    implementation, not assumed present today.
  - `$apollo` routes slide 1 → first-frame, slides 2–10 → frame; consumer files
    (`.agents/skills/apollo/SKILL.md`,
    `.codex/agents/apollo/apollo-designer.toml`) are in scope; only the stale
    `.archetype-takeaway` prompt mention is removed, no CSS class deleted.
    Slide 10 center-center follow-up is prompt guidance, not template-enforced.
  - Existing runs untouched, not re-exported or re-validated; validator,
    exporter, and manifest unchanged.
- **unresolved blockers**: none; `spec-griller` review passed and the spec is
  Accepted, cleared for `$dev-loop` implementation.
- **docs / specs / milestones the next skill must read**:
  - `docs/milestones/0004-first-frame-template-composition.md`
  - `docs/specs/0003a-frame-template-contract.md`
  - `docs/specs/0003b-manifest-and-frame-usage.md`
  - `docs/WORKFLOWS.md` (handoff + spec status contract)
  - `docs/ARCHITECTURE.md` (Seams 1 and 2)
  - reference run: `runs/run-bd27fe93-c61c-4c91-a9dc-02936267401f/deck.html`
- **agent routing log**:
  - `explorer`: used for milestone/reference/consumer inspection this pass
  - `spec-planner`: not applicable for this scoped single-spec authoring pass
  - `spec-griller`: review passed this pass; gate cleared before acceptance
  - `codex-agent-tracer`: used
- **trace path**: `.agent-trace/spec-0004-first-frame`
- **tests target (proportional)**: keep/extend existing
  `tests/test_frame_template.py` plus one focused first-frame test; no
  `check-deck` extension.
