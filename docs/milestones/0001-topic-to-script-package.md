# Milestone: Topic To Script Package

## Status

Draft

## Goal

Turn a topic-only input into a usable short-form teaching script package so the
product has a concrete first deliverable before rendering work begins.

## MVP Deliverable

A local CLI run can accept `topic` and produce a script package containing the
selected angle, narration draft, and planned visual beats for one short-form
technical clip.

## Developer Workflow

Requirements -> spec authoring -> development loop.

## In Scope

- Topic-only input contract.
- Script-generation output contract for one clip.
- A structured handoff from scripting into timeline assembly.

## Out Of Scope

- Final rendered video.
- Thumbnail generation.
- Platform publishing.

## Architecture Seams

- Topic intake contract.
- Research input seam.
- Timeline assembly seam.

## Specs

- `docs/specs/...`

## Acceptance Criteria

- One local run from `topic` yields a stable script package for one clip.
- The output contains enough structure for later narration, subtitles, and
  scene timing.
- Seed links remain deferred and optional.

## Verification

- Future CLI command to run the topic-to-script flow.
- Output review against the milestone contract.

## Deferred

Rendering, narration output, subtitles, thumbnailing, and final export.

## Open Questions

- What script structure best balances teaching clarity with downstream timing?
