# Milestone: Agent-Authored Deck HTML

## Status

Draft

## Goal

Establish that Codex/the authoring agent independently authors each deck's
complete, self-contained `deck.html` — the first half of the Apollo pipeline.
There is no fixed deck template, deterministic layout engine, or slide-type
layout map; the agent freely decides content, visual style, and per-slide
layout within the validity contract.

## MVP Deliverable

Codex/the authoring agent authors one offline `deck.html` with exactly ten
top-level slides in the fixed pedagogical order: hook, definition, mental
model, mechanics, flow, applied example, code/pseudocode, trade-off,
misconception/failure, interviewer follow-up. Each slide is 1080×1350 CSS px,
with no external assets, no network dependencies, and no interactivity or
animation. The ten-slide outline is a model-authored content-planning
artifact, not input to a fixed layout engine.

## Developer Workflow

Implementation loop for the outline → self-contained deck HTML seam.

## In Scope

- Agent-authored, self-contained `deck.html`: the authoring agent chooses
  colors, typography, composition, diagrams, code/table/flow layouts, and
  per-slide layout for the topic.
- Fixed slide dimensions (1080×1350 CSS px) and fixed pedagogical order.
- Self-contained output: no external fonts, scripts, or network calls.
- Broad topics rendered with an interview-relevant angle; narrow topics with
  deeper treatment.

## Out Of Scope

- Authoring the outline content (covered by milestone 0002).
- Validation and PNG export (covered by milestone 0003).
- Any post-MVP feature (web UI, API, batching, PDF, etc.).

## Architecture Seams

- Respects Seam 1 (outline → deck HTML boundary): the ten-slide outline is a
  model-authored content-planning contract; the agent authors the deck HTML
  directly rather than through a fixed layout engine.

## Specs

- `docs/specs/...` (to be created from this Accepted milestone)

## Acceptance Criteria

- `deck.html` contains exactly ten top-level slides.
- Slides follow the fixed pedagogical order.
- Each slide is 1080×1350 CSS px.
- No external assets, network dependencies, interactivity, or animation.
- The authored `deck.html` is self-contained and offline-valid for downstream
  validation and PNG export.

## Verification

- Author a known topic and assert the criteria above.
- Confirm no network/external-asset references remain in `deck.html`.

## Deferred

PNG export, validation gate, and authoring are later milestones. Validation and
the Playwright export live in milestone 0003.

## Open Questions

- None blocking; the outline schema is the confirmed MVP content contract.
