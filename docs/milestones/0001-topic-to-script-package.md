# Milestone: Topic To Script Package

## Status

Accepted

## Goal

Turn a topic-only input into one local CLI-produced canonical script-package
JSON document for one 60-90 second technical education clip so the pipeline
has a concrete first deliverable for downstream consumption before timed
timeline assembly begins.

## MVP Deliverable

A local CLI run can accept `topic` and produce exactly one canonical
script-package JSON document for one 60-90 second technical education clip.
No Markdown companion is required. The document contains semantic equivalents
of a schema version, the original topic, exactly one selected clip angle, one
agreed duration target within the 60-90 second MVP band, one contiguous
voiceover script draft, and an ordered untimed visual-beat list for the later
timeline assembly step. Each visual beat has a stable identity, sequence
position, beat goal, associated script text span, and descriptive visual
intent. The ordered untimed visual beats collectively cover the full
voiceover script in sequence while remaining non-timed and non-render-specific.
It does not produce narration audio, subtitle timing, timestamps, timeline IR,
rendered video, thumbnail assets, export packaging, or publishing output.

## Developer Workflow

Requirements -> spec authoring -> development loop.

## In Scope

- Topic-only intake contract.
- One-clip script package contract.
- Teaching-angle selection for one technical education clip.
- Narration or voiceover script text generation.
- Untimed visual beat planning.
- Stable handoff data for the later timed timeline assembly step.
- Clear failure handling for empty topic input.
- Clear failure handling for topics too broad for a single clip.
- Clear failure handling when no usable teaching angle is found.
- Clear failure handling when script-package generation fails.

## Out Of Scope

- Seed links or source-URL inputs.
- External source packages.
- Live source retrieval during this milestone.
- Narration audio generation.
- Subtitle segmentation or timing.
- Timed timeline assembly.
- Final rendered video.
- Thumbnail generation.
- Final export packaging.
- Platform publishing.

## Architecture Seams

- Topic intake contract.
- Research input seam.
- Timed timeline assembly seam owned by milestone `0002`.

## Specs

- `docs/specs/0001-topic-to-script-package.md`

## Acceptance Criteria

- One local run with only `topic` as required input produces exactly one
  canonical script-package JSON document for one clip.
- The document explicitly targets one 60-90 second technical education clip.
- The document includes semantic equivalents of a schema version, the original
  topic, exactly one selected clip angle, one agreed duration target within
  the 60-90 second MVP band, one contiguous voiceover script draft, and an
  ordered untimed visual-beat list usable by milestone `0002`.
- Each visual beat includes a stable identity, sequence position, beat goal,
  associated script text span, and descriptive visual intent.
- The ordered untimed visual beats collectively cover the full voiceover
  script in sequence while remaining non-timed and non-render-specific.
- No extra required inputs are introduced beyond `topic`.
- The document is usable as-is by the next milestone without requiring a human
  rewrite before timed timeline assembly can begin.
- If the input topic is broader than one 60-90 second clip, the flow selects
  exactly one concrete technical-education angle when it can do so from
  topic-only intake without extra user input or external source retrieval.
- If one clear angle cannot be resolved from topic-only intake, the flow fails
  clearly and emits no valid-looking script-package artifact.
- The flow does not emit multiple candidate angles or multi-clip plans.
- Clear failures for empty topics, missing usable angles, or generation
  failure do not emit a misleading script-package artifact.

## Verification

- Future local CLI command to run the topic-to-script-package flow.
- Artifact contract review against the required script package contents and
  untimed boundary.
- Negative-path review for empty topics and topics too broad for a single
  technical education clip.

## Deferred

- Seed-link grounding.
- Timed narration and subtitle work.
- Rendering.
- Thumbnailing.
- Final export.
- Publishing.

## Open Questions

None.
