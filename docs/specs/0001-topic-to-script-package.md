# Spec: Topic To Script Package

## Status

Accepted

Recommended target: Accepted after `spec-griller` confirms architecture seam
compliance.

## Goal

Implement the first local CLI pipeline step that accepts topic-only intake and
emits one canonical `script package` JSON document for a single 60-90 second
technical education clip.

## Scenario

The creator runs a local CLI command with one required `topic` value, such as a
technical concept to explain. On success, the command emits exactly one JSON
script-package document to stdout containing the selected teaching angle,
target duration, contiguous voiceover script, and ordered untimed visual beats
for the later timeline assembly milestone.

## Architecture Reference

This spec follows `docs/ARCHITECTURE.md`.

Touched approved seams:

- Topic intake contract: `topic` is the only required input.
- Research input seam: no seed links, source URLs, source packages, or live
  retrieval are introduced.
- Timeline assembly seam: output must be structured enough for later timed
  timeline work while remaining untimed and non-render-specific.

Deferred architecture honored:

- Seed-link grounding remains deferred.
- Narration, subtitle timing, rendering, thumbnailing, export packaging,
  publishing, and feedback ingestion remain out of scope.

## In Scope

- Local CLI entrypoint for topic-to-script-package generation.
- Validation for missing or empty `topic`.
- Selection of exactly one concrete technical education clip angle.
- Generation of one contiguous voiceover script draft for a 60-90 second clip.
- Generation of an ordered untimed visual-beat list.
- Canonical JSON script-package output.
- Clear failure behavior that does not emit a valid-looking script package.

## Out Of Scope

- Seed links, source URLs, external research packages, or live source
  retrieval.
- Multiple candidate angles, multi-clip plans, or long-form planning.
- Narration audio.
- Subtitle segmentation or timing.
- Timeline IR with timestamps.
- Rendered video, motion graphics, thumbnail assets, export bundles, or
  publishing output.
- Human editing workflows inside the pipeline.

## Architecture Seams

- Topic intake contract: implement a narrow run input with `topic` as the only
  required production input. This milestone does not include an output-path
  flag or any other file-write behavior.
- Research input seam: keep generation topic-only. Do not add source-fetching
  abstractions or URL parameters in this milestone.
- Timeline assembly seam: produce a stable untimed handoff artifact. Visual
  beats must reference spans of the script and preserve order, but must not
  contain timestamps, durations, renderer templates, asset IDs, subtitle
  timing, or narration metadata.

## Contracts

Input contract:

- Required: `topic`, a non-empty string after trimming whitespace.
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
- Empty topic, unusably broad topic, missing angle, or generation failure must
  follow this failure I/O contract.

## Failure Modes

- Missing or whitespace-only topic.
- Topic is too broad for one 60-90 second technical education clip and no
  single concrete angle can be selected without more input.
- Generation cannot produce a usable selected angle.
- Generation cannot produce a non-empty contiguous script.
- Generation cannot produce at least one visual beat with non-empty `goal` and
  `visual_intent`.
- Visual beats do not cover the full non-empty script in order.
- Output serialization fails.
- Any attempted output includes timed timeline, subtitle, narration, render,
  thumbnail, export, or publishing fields.

## Acceptance Criteria

- A local CLI run with only `topic` as required input emits exactly one UTF-8
  JSON script-package document to stdout and exits `0`.
- The artifact targets one 60-90 second technical education clip.
- The artifact includes `schema_version`, original `topic`, exactly one
  `selected_clip_angle`, one `target_duration_seconds` value in `[60, 90]`, one
  contiguous `voiceover_script`, and ordered `visual_beats`.
- `selected_clip_angle.title`, `selected_clip_angle.teaching_goal`,
  `voiceover_script`, and each visual beat `goal` and `visual_intent` are
  non-empty after trimming whitespace.
- `visual_beats` contains at least one item.
- Each visual beat includes stable `id`, `sequence`, `goal`, `script_span`, and
  `visual_intent`.
- Visual beats collectively cover the full script in sequence and remain
  untimed.
- The flow does not require source URLs, seed links, external source packages,
  or live retrieval.
- Topics are accepted only when one usable selected angle can be chosen from
  topic-only intake.
- If a clear angle cannot be selected, the command fails clearly and emits no
  output to stdout.
- Empty topic and generation failure paths fail clearly and emit no stdout
  output.
- The output can be consumed by milestone `0002` without a human rewrite before
  timed timeline assembly begins.

## Verification

- Unit tests for topic validation.
- Contract/schema test for a successful script-package artifact.
- Test that visual beat spans are ordered, non-overlapping, and cover the full
  script.
- Test that concatenating visual-beat script slices in `sequence` order
  reproduces the full `voiceover_script` exactly.
- CLI smoke test verifies that a narrowly scoped topic such as `binary search`
  succeeds, exits `0`, emits exactly one UTF-8 script-package JSON document to
  stdout, and emits no non-JSON content to stdout.
- Success-path tests verify non-empty `selected_clip_angle.title`,
  `selected_clip_angle.teaching_goal`, `voiceover_script`, and each visual beat
  `goal` and `visual_intent`, plus at least one visual beat.
- Negative-path tests for empty topic, too-broad unresolved topic, no usable
  angle, and generation failure.
- Negative-path test verifies that a survey-sized topic such as `computer
  science` fails non-zero, emits diagnostics only to stderr, emits nothing to
  stdout.
- Review output fields to confirm no timed timeline, narration audio, subtitle
  timing, render, thumbnail, export, publishing, seed-link, or source-retrieval
  scope leaked into the artifact.

## Open Questions

None blocking.

Implementation may choose the exact local CLI command name according to
existing project conventions, but it must preserve `topic` as the only required
production input.
