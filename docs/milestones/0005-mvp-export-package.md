# Milestone: MVP Export Package

## Status

Draft

## Goal

Package the 0004 slideshow image set, manifest, and optional caption
metadata into one self-contained directory ready for manual TikTok
slideshow upload. No video. No subtitles. No thumbnail generation.

## MVP Deliverable

A single local pipeline run can accept `topic` and export one
TikTok-ready slideshow image set package with no required human
editing pass beyond uploading the images to TikTok.

## Developer Workflow

Requirements -> spec authoring -> development loop.

## In Scope

- End-to-end orchestration of the MVP production loop through
  slideshow image export.
- Packaging the 0004 image set and manifest into a clean export
  directory.
- Optional caption metadata (topic, angle, hashtags) for manual
  TikTok upload reference.
- Runtime and cost checks against the MVP targets.

## Out Of Scope

- Video encoding or MP4 output.
- Subtitle files (`.srt`, `.vtt`).
- Thumbnail generation.
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

- One local run from `topic` produces one TikTok-ready slideshow
  image set package (PNGs + manifest + optional caption notes).
- The core flow does not require proprietary editing software.
- Human input stays under the MVP target and runtime/cost checks are
  documented against the target constraints.
- Direct posting remains deferred.

## Verification

- Future end-to-end local export command.
- Runtime and artifact review against the MVP success metrics.

## Deferred

Source seeding, direct publishing, analytics loops, longer-form
workflows, video export, and broader content families.

## Open Questions

- Which parts of the runtime target are feasible locally versus
  best-effort in the first implementation pass?
