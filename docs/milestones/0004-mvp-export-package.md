# Milestone: MVP Export Package

## Status

Draft

## Goal

Complete the end-to-end local MVP so one topic produces one TikTok-ready clip
package with no required human editing pass.

## MVP Deliverable

A single local pipeline run can accept `topic` and export one final clip
package containing the rendered video, subtitles in the chosen delivery form,
and a thumbnail for manual upload.

## Developer Workflow

Requirements -> spec authoring -> development loop.

## In Scope

- End-to-end orchestration of the MVP production loop.
- Final export packaging for manual upload.
- Thumbnail generation as part of the clip package.
- Runtime and cost checks against the MVP targets.

## Out Of Scope

- Direct social publishing.
- Seed-link input.
- Analytics and feedback ingestion.

## Architecture Seams

- Publishing adapter seam.
- Feedback ingestion seam.
- All previously established MVP seams remain in force.

## Specs

- `docs/specs/...`

## Acceptance Criteria

- One local run from `topic` produces one TikTok-ready clip package.
- The core flow does not require proprietary editing software.
- Human input stays under the MVP target and runtime/cost checks are documented
  against the target constraints.
- Direct posting remains deferred.

## Verification

- Future end-to-end local export command.
- Runtime and artifact review against the MVP success metrics.

## Deferred

Source seeding, direct publishing, analytics loops, longer-form workflows, and
broader content families.

## Open Questions

- Which parts of the runtime target are feasible locally versus best-effort in
  the first implementation pass?
