# Milestone: Codex Topic-to-Deck

## Status

Draft

## Goal

Make the authoring surface real: from a single software-engineering topic in
Codex, produce the structured ten-slide outline that milestone 0001's agent-authored deck HTML realizes.

## MVP Deliverable

A user invokes Apollo (`$apollo`) with one software-engineering topic. Codex's
available model authors the ten-slide outline directly — no external model, no
API integration, no runtime. The outline matches the fixed pedagogical order and
feeds the agent-authored deck HTML from milestone 0001.

## Developer Workflow

Authoring stage of the Apollo workflow in Codex.

## In Scope

- Accept a single topic as the workflow input.
- Author the ten-slide outline in the fixed pedagogical order.
- Choose an interview-relevant angle for broad topics; deeper treatment for
  narrow topics.
- Hand the outline to the agent-authored deck stage (milestone 0001) without a separate
  model/API layer.

## Out Of Scope

- Authoring the deck HTML (milestone 0001).
- Validation and PNG export (milestone 0003).
- Any post-MVP authoring backend or web/editor UI.

## Architecture Seams

- Establishes the authoring side of Seam 1 (outline → deck HTML boundary):
  the outline it produces is a model-authored content-planning contract the agent realizes as deck HTML.

## Specs

- `docs/specs/...` (to be created from this Accepted milestone)

## Acceptance Criteria

- The workflow takes exactly one topic and produces a ten-slide outline.
- The outline follows the fixed pedagogical order.
- No external model/API is configured or called; authoring uses the available
  Codex model.
- The outline is consumable by the milestone 0001 agent-authored deck stage.

## Verification

- Run the workflow on a sample topic and confirm a valid ten-slide outline.
- Confirm no external API or model integration is introduced.

## Deferred

Rendering, validation, and PNG export are separate milestones. The reference
HTML remains untracked visual guidance, not an authoring dependency.

## Open Questions

- None blocking; Codex is the confirmed authoring surface.
