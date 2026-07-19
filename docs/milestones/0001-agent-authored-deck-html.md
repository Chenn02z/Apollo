# Milestone: Agent-Authored Deck HTML

## Status

Accepted

## Goal

Establish that the active Codex model directly authors each deck's complete,
self-contained `deck.html` — the first half of the Apollo pipeline. There is no
fixed deck template, deterministic layout engine, or slide-type layout map; the
model freely decides content, visual style, and per-slide layout within the
validity contract. Direct authoring is normal product behavior, not a special
case.

The MVP is one topic into `$apollo`, producing one self-contained ten-slide
`deck.html`. No separate outline artifact is produced or consumed; the fixed
pedagogical order is an internal content-planning constraint that guides the
model's authoring, not a visual template or a layout engine input. `$apollo`
will be implemented as a reusable skill at `.agents/skills/apollo/SKILL.md`
during implementation, with no dedicated Apollo agent preset. The implementer
role is limited to building support tooling and never authors normal carousel
content.

## MVP Deliverable

The active Codex model directly authors one offline `deck.html` from a single
topic, with exactly ten top-level slides in the fixed pedagogical order: hook,
definition, mental model, mechanics, flow, applied example, code/pseudocode,
trade-off, misconception/failure, interviewer follow-up. Each slide is
1080x1350 CSS px, with no external assets, no network dependencies, and no
interactivity or animation. The pedagogical order is an internal
content-planning constraint, not a visual template.

## Developer Workflow

Implementation loop for the topic -> self-contained deck HTML seam.

## In Scope

- Direct, model-authored, self-contained `deck.html`: the model chooses
  colors, typography, composition, diagrams, code/table/flow layouts, and
  per-slide layout for the topic.
- Fixed slide dimensions (1080x1350 CSS px) and fixed pedagogical order as an
  internal content-planning constraint.
- Self-contained output: no external fonts, scripts, or network calls.
- Broad topics rendered with an interview-relevant angle; narrow topics with
  deeper treatment.
- Support tooling: structural validation and export tooling only. This is
  narrowly scoped — it must never author content, layout, colors, typography,
  diagrams, or a layout engine. Tooling inspects and checks authored HTML; it
  does not shape the deck.

## Out Of Scope

- Authoring carousel content — that is always the active Codex model's job, and
  the implementer role must never author normal carousel content.
- Validation and PNG export correctness (authoritative checks live in milestone
  0002).
- Any post-MVP feature (web UI, API, batching, PDF, etc.).

## Architecture Seams

- Respects the topic -> deck HTML boundary: the model authors `deck.html`
  directly from the topic, guided by the fixed pedagogical order as an internal
  constraint, rather than through a fixed outline artifact or layout engine.

## Specs

- `docs/specs/...` (to be created from this Accepted milestone)

## Acceptance Criteria

- `deck.html` contains exactly ten top-level slides.
- Slides follow the fixed pedagogical order.
- Each slide is 1080x1350 CSS px.
- No external assets, network dependencies, interactivity, or animation.
- The authored `deck.html` is self-contained and offline-valid for downstream
  validation and PNG export.

## Verification

The check split between `0001` and `0002`:

- `0001` checks structural validity of the authored output: valid and
  self-contained HTML, exactly ten top-level slides, no external resource URLs,
  and no animations or interactivity.
- `0002`'s Playwright pass is authoritative for rendered 1080x1350 dimensions,
  overflow, and exactly ten PNGs; `0001` does not assert those.

## Deferred

PNG export and authoritative validation live in milestone 0002.

## Blocking Choices (Settled)

- **Outline contract.** No separate outline artifact is produced or consumed;
  the fixed pedagogical order is an internal content-planning constraint, not a
  visual template. (Previously milestone 0002, now absorbed into `0001`.)
- **Verification split.** `0001` carries a lightweight self-check (valid/self-
  contained HTML, exactly ten top-level slides, no external resource URLs, no
  animations/interactivity); authoritative rendered-dimension, overflow, and
  ten-PNG validation stays in `0002`.
- **`$apollo` shape.** Implemented as a reusable skill at
  `.agents/skills/apollo/SKILL.md` during implementation, with no dedicated
  Apollo agent preset.
