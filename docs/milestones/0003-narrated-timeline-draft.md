# Milestone: Narrated Timeline Draft

## Status

Draft

## Goal

Convert the script package into a timed clip draft with aligned narration and
subtitle timing.

## MVP Deliverable

The pipeline can generate a timed draft for one clip that includes narration
audio and subtitle data aligned to a shared timeline.

## Developer Workflow

Requirements -> spec authoring -> development loop.

## In Scope

- Timeline assembly contract.
- Narration provider integration for one clip.
- Subtitle timing generation from the same clip timeline.

## Out Of Scope

- Final motion-graphics polish.
- Thumbnail generation.
- Direct platform upload.

## Architecture Seams

- Timeline assembly seam.
- Narration provider seam.
- Subtitle output seam.

## Specs

- `docs/specs/...`

## Acceptance Criteria

- One script package can be turned into a timed narration and subtitle draft.
- Narration and subtitle timing come from the same underlying clip plan.
- The result is ready for renderer consumption without manual timeline editing.

## Verification

- Future local command to generate the narrated timeline draft.
- Artifact review for timing alignment.

## Deferred

Reusable motion-graphics rendering, thumbnail generation, and final packaging.

## Open Questions

- How should narration quality versus runtime be traded off on the first
  machine?
