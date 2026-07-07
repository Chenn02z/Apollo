# Milestone: LLM-Backed Script Package Drafting

## Status

Accepted

## Goal

Replace deterministic placeholder script-package generation with real hosted
LLM drafting while preserving the existing script-package contract for
downstream timeline assembly.

## MVP Deliverable

A local CLI run with `topic` as the only required production input, plus
configured hosted LLM access, produces exactly one non-placeholder canonical
script-package JSON document for one 60-90 second technical education clip.
The document preserves the existing v1 artifact shape: schema version, the
original topic, exactly one selected clip angle, one agreed duration target
within the 60-90 second MVP band, one contiguous voiceover script draft, and
an ordered untimed visual-beat list. Each visual beat remains non-timed and
non-render-specific. Hosted drafting failures do not emit a valid-looking
artifact.

## Developer Workflow

Requirements -> spec authoring -> development loop.

## In Scope

- Hosted LLM generation for one selected clip angle.
- Hosted LLM generation of one contiguous voiceover script draft.
- Hosted LLM generation of an ordered untimed visual-beat list.
- Schema validation before artifact emission.
- Explicit failure handling for missing `OPENROUTER_API_KEY`.
- Explicit failure handling for provider timeout, rate-limit, and network
  failures.
- Explicit failure handling for malformed model output, unusable angle
  selection, and retry exhaustion.
- Preservation of the existing script-package handoff contract.

## Out Of Scope

- Live research or retrieval.
- Seed links or source materials.
- Citations or grounding metadata.
- Narration audio.
- Subtitle timing.
- Timeline IR.
- Rendering, thumbnails, export packaging, or publishing.
- Changes to the public script-package schema.

## Architecture Seams

- Topic intake contract.
- Research input seam remains unused and deferred to milestone `0100`.
- Drafting provider seam.
- Timeline assembly seam handoff preserved for milestone `0003`.

## Specs

- `docs/specs/0002-llm-backed-script-package-drafting.md`

## Acceptance Criteria

- One local run with only `topic` as required production input emits exactly
  one canonical script-package JSON document when hosted LLM access is
  configured.
- The output is materially topic-specific and not placeholder filler.
- The selected angle is single-clip sized within the 60-90 second MVP band.
- The output preserves the existing script-package contract expected
  downstream.
- Visual beats cover the script in order and remain untimed and
  non-render-specific.
- Empty topics fail clearly and emit no valid-looking artifact.
- Overly broad topics with no resolvable single angle fail clearly and emit no
  valid-looking artifact.
- Missing `OPENROUTER_API_KEY` fails clearly and emits no valid-looking
  artifact.
- Provider timeout, rate-limit, or network failure fails clearly and emits no
  valid-looking artifact.
- Malformed or schema-invalid model output fails clearly and emits no
  valid-looking artifact.
- No fallback to deterministic placeholder output is allowed once this
  milestone owns real drafting.

## Verification

- Future local CLI command to run hosted drafting with a configured
  `OPENROUTER_API_KEY`.
- Automated tests with mocked provider responses for success, malformed
  output, provider failure, and retry exhaustion paths.
- Manual artifact review that checks topic specificity and ordered untimed
  visual-beat coverage.

## Deferred

- Seed-link grounding.
- Timed narration and subtitle work.
- Rendering.
- Thumbnailing.
- Final export.
- Publishing.

## Open Questions

None.
