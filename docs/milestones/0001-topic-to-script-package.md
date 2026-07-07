# Milestone: Topic To Script Package Scaffold

## Status

Verified

## Goal

Prove the local CLI entrypoint, topic-only intake validation, and canonical
script-package contract with deterministic placeholder drafting so later
milestones can build against a stable handoff shape before hosted drafting is
introduced.

## MVP Deliverable

A local CLI run can accept `topic` and produce exactly one canonical
script-package JSON document for one 60-90 second technical education clip.
No Markdown companion is required. The document contains the v1 schema shape,
the original topic, exactly one deterministic placeholder clip angle, one
agreed duration target within the 60-90 second MVP band, one contiguous
placeholder voiceover script draft, and an ordered untimed visual-beat list.
Each visual beat has a stable identity, sequence position, beat goal,
associated script text span, and descriptive visual intent. The ordered
untimed visual beats collectively cover the full voiceover script in sequence
while remaining non-timed and non-render-specific. This milestone validates
the artifact contract and local CLI behavior; it does not yet claim hosted or
production-ready drafting quality.

## Developer Workflow

Requirements -> spec authoring -> development loop.

## In Scope

- Topic-only intake contract.
- Local CLI scaffold for script-package emission.
- One-clip script package contract.
- Deterministic placeholder angle selection for one technical education clip.
- Deterministic placeholder voiceover script generation.
- Deterministic untimed visual beat planning.
- Exact contract validation for the later hosted drafting replacement.
- Clear failure handling for empty topic input.
- Clear failure handling for topics too broad for a single clip.
- Clear failure handling when no usable teaching angle is found.
- Clear failure handling when deterministic script-package generation fails.

## Out Of Scope

- Hosted LLM or provider-backed drafting.
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
- Drafting provider seam owned by milestone `0002`.
- Timed timeline assembly seam owned by milestone `0003`.

## Specs

- `docs/specs/0001-topic-to-script-package.md`

## Acceptance Criteria

- One local run with only `topic` as required input produces exactly one
  canonical script-package JSON document for one clip.
- The document explicitly targets one 60-90 second technical education clip.
- The document includes semantic equivalents of a schema version, the original
  topic, exactly one selected clip angle, one agreed duration target within
  the 60-90 second MVP band, one contiguous voiceover script draft, and an
  ordered untimed visual-beat list in the artifact shape that milestone
  `0002` must preserve.
- The selected angle, voiceover script, and visual beats are deterministic
  placeholder scaffold content, not hosted model output.
- Each visual beat includes a stable identity, sequence position, beat goal,
  associated script text span, and descriptive visual intent.
- The ordered untimed visual beats collectively cover the full voiceover
  script in sequence while remaining non-timed and non-render-specific.
- No extra required inputs are introduced beyond `topic`.
- The artifact shape is stable enough for downstream contract work and is the
  contract that milestone `0002` must preserve when hosted drafting replaces
  placeholder generation.
- If the input topic is broader than one 60-90 second clip, the flow selects
  exactly one concrete technical-education angle when it can do so from
  topic-only intake without extra user input or external source retrieval.
- If one clear angle cannot be resolved from topic-only intake, the flow fails
  clearly and emits no valid-looking script-package artifact.
- The flow does not emit multiple candidate angles or multi-clip plans.
- Clear failures for empty topics, missing usable angles, or generation
  failure do not emit a misleading script-package artifact.

## Verification

- Local `topic-to-script-package` CLI command emits the contract-compliant
  JSON scaffold.
- Automated tests cover contract shape, script-span reconstruction, and clear
  failure behavior for empty, broad, and unangleable topics.

## Deferred

- Hosted LLM-backed drafting.
- Seed-link grounding.
- Timed narration and subtitle work.
- Rendering.
- Thumbnailing.
- Final export.
- Publishing.

## Open Questions

None.
