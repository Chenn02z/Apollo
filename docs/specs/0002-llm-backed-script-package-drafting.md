# Spec: LLM-Backed Script Package Drafting

## Status

Accepted

## Goal

Replace deterministic placeholder script-package generation with hosted
LLM-backed drafting while preserving the existing `script package` JSON
contract for downstream timeline assembly.

## Scenario

The creator runs the existing local CLI with one required `topic` value and a
configured `OPENROUTER_API_KEY`. On success, the command emits exactly one
canonical script-package JSON document to stdout containing one selected clip
angle, one target duration, one contiguous voiceover script, and one ordered
untimed visual-beat list for a single 60-90 second technical education clip.
The output is materially topic-specific and is not deterministic placeholder
filler. If hosted drafting fails or returns unusable output, the command emits
no artifact.

## Architecture Reference

This spec follows `docs/ARCHITECTURE.md`.

Touched approved seams:

- Topic intake contract: `topic` remains the only required production input.
- Research input seam: no seed links, source URLs, source packages, or live
  retrieval are introduced in this milestone.
- Drafting provider seam: first implementation uses OpenRouter, but provider
  invocation is isolated so the public CLI and artifact contract remain
  provider-neutral.
- Timeline assembly seam: output keeps the same untimed script-package shape
  already expected by downstream narrated timeline work.

Deferred architecture honored:

- Seed-link grounding remains deferred to milestone `0100`.
- Narration, subtitle timing, timeline IR, rendering, thumbnailing, export
  packaging, publishing, and feedback ingestion remain out of scope.

## In Scope

- Hosted LLM-backed selection of exactly one concrete technical education clip
  angle.
- Hosted LLM-backed generation of one contiguous voiceover script draft for a
  60-90 second clip.
- Hosted LLM-backed generation of an ordered untimed visual-beat list.
- Integration with OpenRouter for the first implementation pass.
- Lightweight provider seam that isolates hosted drafting from the public CLI
  and artifact contract.
- Validation for missing or empty `topic`.
- Validation for missing `OPENROUTER_API_KEY`.
- Validation that model output satisfies the exact v1 script-package contract
  before emission.
- Clear failure behavior that does not emit a valid-looking script package.

## Out Of Scope

- Seed links, source URLs, external research packages, or live retrieval.
- Citations, grounding metadata, or source provenance fields.
- Multiple candidate angles, multi-clip plans, or long-form planning.
- Narration audio.
- Subtitle segmentation or timing.
- Timeline IR with timestamps.
- Rendered video, motion graphics, thumbnail assets, export bundles, or
  publishing output.
- Changes to the public script-package schema.

## Architecture Seams

- Topic intake contract: preserve `topic` as the only required production
  input. No additional interactive prompts or required source inputs may be
  introduced.
- Research input seam: keep drafting topic-only. Do not add retrieval or
  source-material abstractions in this milestone.
- Drafting provider seam: isolate OpenRouter-specific request and response
  handling behind a minimal drafting-provider boundary so provider choice can
  change later without altering CLI input, stdout behavior, or artifact
  fields.
- Timeline assembly seam: emit the same stable untimed handoff artifact used by
  downstream milestones. Visual beats must reference spans of the script and
  preserve order, but must not contain timestamps, durations, renderer
  templates, asset IDs, subtitle timing, or narration metadata.

## Contracts

Input contract:

- Required production input: `topic`, a non-empty string after trimming
  whitespace.
- Required runtime configuration: `OPENROUTER_API_KEY` in the environment.
- No other required production input is allowed.

Output contract:

- On success, the command emits exactly one UTF-8 JSON document to stdout and
  exits `0`.
- Stdout contains only the script-package JSON document. Diagnostics, if any,
  go to stderr.
- The JSON document must use the exact v1 shape below. Additional top-level
  fields and additional nested fields are forbidden.
- The JSON document must include exactly these top-level fields:
  - `schema_version`
  - `topic`
  - `selected_clip_angle`
  - `target_duration_seconds`
  - `voiceover_script`
  - `visual_beats`
- On success, the JSON document must be usable and non-empty:
  - `selected_clip_angle.title` is a non-empty string after trimming
    whitespace.
  - `selected_clip_angle.teaching_goal` is a non-empty string after trimming
    whitespace.
  - `voiceover_script` is a non-empty string after trimming whitespace.
  - `visual_beats` contains at least one item.
  - Each visual beat `goal` is a non-empty string after trimming whitespace.
  - Each visual beat `visual_intent` is a non-empty string after trimming
    whitespace.
  - The visual-beat slice coverage rule must reconstruct the non-empty
    `voiceover_script` exactly.

Normative v1 shape:

```json
{
  "schema_version": "script-package.v1",
  "topic": "original topic string",
  "selected_clip_angle": {
    "title": "one concrete teaching angle",
    "teaching_goal": "what the viewer should understand"
  },
  "target_duration_seconds": 75,
  "voiceover_script": "one contiguous script draft",
  "visual_beats": [
    {
      "id": "beat-001",
      "sequence": 1,
      "goal": "purpose of this beat",
      "script_span": {
        "start_char": 0,
        "end_char": 120
      },
      "visual_intent": "descriptive, non-render-specific visual direction"
    }
  ]
}
```

`selected_clip_angle` must include exactly `title` and `teaching_goal`.
Each `visual_beats` item must include exactly `id`, `sequence`, `goal`,
`script_span`, and `visual_intent`. Each `script_span` must include exactly
`start_char` and `end_char`.

Angle-selection contract:

- A usable selected angle must express exactly one concrete viewer takeaway for
  one technical concept, mechanism, misconception, or comparison that can be
  taught in one contiguous 60-90 second clip.
- If satisfying the topic would require choosing arbitrarily among multiple
  materially different lessons or surveying a whole field or toolchain, the
  flow must fail rather than guess.

Content-quality contract:

- The output must be materially topic-specific and internally consistent across
  `selected_clip_angle`, `voiceover_script`, and `visual_beats`.
- Deterministic placeholder fallback is forbidden once this milestone owns real
  drafting.
- Schema-valid but obviously generic filler that does not resolve a concrete
  clip angle is considered unusable output and must fail closed.

Visual beat contract:

- `id` is stable within the artifact.
- `sequence` starts at `1` and increases by `1`.
- `script_span.start_char` and `script_span.end_char` are zero-based Unicode
  code point offsets into the top-level `voiceover_script`.
- `script_span.start_char` is inclusive. `script_span.end_char` is exclusive.
- Script spans are ordered, non-overlapping, non-empty, and collectively cover
  the full voiceover script in sequence.
- Concatenating the `voiceover_script` slices referenced by visual beats in
  `sequence` order must reproduce the full `voiceover_script` exactly, with no
  gaps or overlaps.
- `visual_intent` describes what should be shown, not how to render it.
- Beats remain untimed: no timestamps, durations, subtitle cue times, renderer
  asset IDs, or scene-template bindings.

Failure contract:

- On failure, the command exits non-zero.
- On failure, diagnostics are emitted only to stderr.
- On failure, stdout is empty.
- Missing `OPENROUTER_API_KEY`, provider timeout, provider rate-limit,
  provider network failure, retry exhaustion, empty topic, unresolved broad
  topic, unusable angle, malformed model output, or schema validation failure
  must all follow this failure I/O contract.

## Failure Modes

- Missing or whitespace-only topic.
- Topic is too broad for one 60-90 second technical education clip and no
  single concrete angle can be selected without more input.
- Missing `OPENROUTER_API_KEY`.
- OpenRouter timeout, rate-limit, authentication, or network failure.
- Retry exhaustion after repeated provider failures or unusable outputs.
- Model output cannot be parsed into the required JSON shape.
- Model output omits required fields, adds forbidden fields, or breaks
  script-span reconstruction.
- Generation cannot produce a usable selected angle.
- Generation cannot produce a non-empty contiguous script.
- Generation cannot produce at least one visual beat with non-empty `goal` and
  `visual_intent`.
- Visual beats do not cover the full non-empty script in order.
- Any attempted fallback emits deterministic placeholder content instead of
  failing closed.
- Any attempted output includes timed timeline, subtitle, narration, render,
  thumbnail, export, publishing, seed-link, or source-retrieval fields.

## Acceptance Criteria

- A local CLI run with only `topic` as required production input, plus a
  configured `OPENROUTER_API_KEY`, emits exactly one UTF-8 JSON script-package
  document to stdout and exits `0`.
- The artifact targets one 60-90 second technical education clip.
- The artifact includes `schema_version`, original `topic`, exactly one
  `selected_clip_angle`, one `target_duration_seconds` value in `[60, 90]`,
  one contiguous `voiceover_script`, and ordered `visual_beats`.
- `selected_clip_angle.title`, `selected_clip_angle.teaching_goal`,
  `voiceover_script`, and each visual beat `goal` and `visual_intent` are
  non-empty after trimming whitespace.
- `visual_beats` contains at least one item.
- Each visual beat includes stable `id`, `sequence`, `goal`, `script_span`,
  and `visual_intent`.
- Visual beats collectively cover the full script in sequence and remain
  untimed.
- The output is materially topic-specific and not deterministic placeholder
  filler.
- The flow does not require source URLs, seed links, external source packages,
  or live retrieval.
- Topics are accepted only when one usable selected angle can be chosen from
  topic-only intake.
- If a clear angle cannot be selected, the command fails clearly and emits no
  output to stdout.
- Empty topic, missing `OPENROUTER_API_KEY`, provider failure, malformed model
  output, schema validation failure, and retry exhaustion all fail clearly and
  emit no stdout output.
- The output contract remains compatible with downstream narrated timeline work
  after the milestone renumbering.

## Verification

- Unit tests for topic validation and missing `OPENROUTER_API_KEY`.
- Provider seam tests that translate timeout, rate-limit, authentication, and
  network failures into the shared failure I/O contract.
- Contract/schema test for a successful provider-backed script-package
  artifact.
- Test that visual beat spans are ordered, non-overlapping, and cover the full
  script.
- Test that concatenating visual-beat script slices in `sequence` order
  reproduces the full `voiceover_script` exactly.
- Tests for malformed model output, schema-invalid model output, unusable
  selected angle, and retry exhaustion.
- Smoke test verifies that a narrowly scoped topic succeeds, exits `0`, emits
  exactly one UTF-8 script-package JSON document to stdout, and emits no
  non-JSON content to stdout when hosted drafting is available.
- Negative-path tests verify that empty topic, overly broad unresolved topic,
  missing `OPENROUTER_API_KEY`, provider failure, malformed model output, and
  retry exhaustion all fail non-zero, emit diagnostics only to stderr, and
  emit nothing to stdout.
- Manual artifact review confirms the selected angle is single-clip sized and
  the voiceover plus visual beats are materially topic-specific rather than
  generic filler.

## Open Questions

None blocking.
