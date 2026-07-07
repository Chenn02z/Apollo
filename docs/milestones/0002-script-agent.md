# Milestone: Script Agent

## Status

Accepted

## Goal

Turn a concrete topic into a usable short-form teaching script package so the
product has a structured handoff from planning into timeline assembly.

## MVP Deliverable

A local CLI run can accept a concrete topic (manually or from 0001 ideation
output) and produce a script package containing the selected teaching angle,
narration draft, and planned visual beats for one short-form technical clip.

## Developer Workflow

Requirements -> spec authoring -> development loop.

## In Scope

- Concrete-topic input contract.
- Script Agent: LLM-powered script generation for one clip.
- Script package output contract (angle, narration draft, visual beat plan).
- Structured handoff from scripting into timeline assembly.
- Standalone operation (no dependency on 0001 ideation agent).

## Out Of Scope

- Concept ideation (owned by 0001).
- Final rendered video.
- Thumbnail generation.
- Platform publishing.

## Architecture Seams

- Topic intake contract.
- Research input seam.
- Timeline assembly seam.

## Specs

- `docs/specs/`

## Acceptance Criteria

- One local run from a concrete topic yields a stable script package for one
  clip.
- The output contains enough structure for later narration, subtitles, and
  scene timing.
- Seed links remain deferred and optional.
- The Script Agent's cost is a single LLM call per run.

## Verification

- Future CLI command to run the topic-to-script flow.
- Output review against the milestone contract.

## Deferred

Rendering, narration output, subtitles, thumbnailing, and final export.

## Open Questions

*Deferred to spec phase, non-blocking for milestone acceptance.*

- What script structure best balances teaching clarity with downstream timing?
