# Spec: Narrated Timeline Draft

## Status

Verified

## Goal

Accept the authoritative 0002 script package and produce the canonical
`narrated timeline draft` artifact for one clip. The draft preserves the input
`narration` and `target_audience` unchanged while adding a shared timing plan
that 0004 can render against.

## Scenario

The creator runs:

```sh
apollo timeline script-package.json
```

Where `script-package.json` contains:

```json
{
  "topic": "How Attention Mechanisms Let LLMs Read Whole Paragraphs at Once",
  "angle": "Self-attention explained as a weighted lookup, starting from key-value stores",
  "narration": "Ever wondered how LLMs process an entire sentence at once...",
  "visual_beats": [
    {"timestamp": "0:00", "description": "Title card: topic + hook question"},
    {"timestamp": "0:05", "description": "Split screen: sequential vs parallel processing"},
    {"timestamp": "0:15", "description": "Diagram: query slides across key-value pairs"},
    {"timestamp": "0:25", "description": "Code snippet: simplified attention in Python"},
    {"timestamp": "0:45", "description": "Real-world: how GPT uses this in practice"},
    {"timestamp": "1:05", "description": "Recap: three key takeaways"}
  ],
  "duration_estimate_s": 80,
  "target_audience": "software developers preparing for technical interviews"
}
```

The narration text and timeline segments in this example are abbreviated for readability; real fixtures must use the full narration text and include all segments needed to satisfy validation.

The timeline drafter calls `deepseek/deepseek-v4-pro` once and emits:

```json
{
  "topic": "How Attention Mechanisms Let LLMs Read Whole Paragraphs at Once",
  "angle": "Self-attention explained as a weighted lookup, starting from key-value stores",
  "narration": "Ever wondered how LLMs process an entire sentence at once...",
  "visual_beats": [
    {"timestamp": "0:00", "description": "Title card: topic + hook question"},
    {"timestamp": "0:05", "description": "Split screen: sequential vs parallel processing"},
    {"timestamp": "0:15", "description": "Diagram: query slides across key-value pairs"},
    {"timestamp": "0:25", "description": "Code snippet: simplified attention in Python"},
    {"timestamp": "0:45", "description": "Real-world: how GPT uses this in practice"},
    {"timestamp": "1:05", "description": "Recap: three key takeaways"}
  ],
  "duration_estimate_s": 80,
  "target_audience": "software developers preparing for technical interviews",
  "timeline_segments": [
    {
      "start_s": 0.0,
      "end_s": 7.0,
      "narration_text": "Ever wondered how LLMs process an entire sentence at once",
      "visual_instruction": "Title card: topic + hook question",
      "subtitle_text": "Ever wondered how LLMs process an entire sentence at once"
    },
    {
      "start_s": 7.0,
      "end_s": 18.0,
      "narration_text": "instead of reading one word at a time like older models?",
      "visual_instruction": "Split screen: sequential vs parallel processing",
      "subtitle_text": "instead of reading one word at a time like older models?"
    },
    {
      "start_s": 18.0,
      "end_s": 30.0,
      "narration_text": "The secret is self-attention, which works a lot like a key-value lookup.",
      "visual_instruction": "Diagram: query slides across key-value pairs",
      "subtitle_text": "The secret is self-attention, which works a lot like a key-value lookup."
    },
    {
      "start_s": 30.0,
      "end_s": 50.0,
      "narration_text": "Here's how you'd implement a simplified version in just a few lines of Python.",
      "visual_instruction": "Code snippet: simplified attention in Python",
      "subtitle_text": "Here's how you'd implement a simplified version in just a few lines of Python."
    },
    {
      "start_s": 50.0,
      "end_s": 70.0,
      "narration_text": "GPT uses this exact mechanism to understand your prompts holistically.",
      "visual_instruction": "Real-world: how GPT uses this in practice",
      "subtitle_text": "GPT uses this exact mechanism to understand your prompts holistically."
    },
    {
      "start_s": 70.0,
      "end_s": 81.0,
      "narration_text": "Let's recap the three key takeaways.",
      "visual_instruction": "Recap: three key takeaways",
      "subtitle_text": "Let's recap the three key takeaways."
    }
  ]
}
```

## Architecture Reference

`docs/ARCHITECTURE.md`

Touches approved seams: Timeline assembly seam, Narration provider seam,
Subtitle output seam.

## In Scope

- Accept the authoritative 0002 script package as input.
- Single LLM call per run using `deepseek/deepseek-v4-pro` on OpenRouter.
- Produce one narrated timeline draft for one clip.
- Preserve the input `narration` and `target_audience` unchanged.
- Reuse the script package's authoritative `topic`, `angle`,
  `visual_beats`, and `duration_estimate_s`.
- Add a shared timing plan with subtitle-ready text that later narration,
  subtitle realization, and render stages can consume.
- Standalone operation: 0003 runs from a saved script package without calling
  0001 or 0002 live.

## Out Of Scope

- Rewriting or refining the script package narration.
- Retargeting the clip to a new audience.
- Narration-audio generation or exact narration provider selection.
- Final subtitle-file output format.
- Visual rendering (owned by 0004).
- Thumbnail generation, export packaging, or platform publishing.

## Architecture Seams

- **Timeline assembly seam** (built): 0003 is the canonical boundary between
  the authoritative 0002 script package and 0004 visual rendering. It must
  emit a stable narrated timeline draft artifact rather than renderer-specific
  instructions only. The draft is the authoritative timing source for
  downstream narration, subtitle realization, and 0004 rendering.
- **Narration provider seam** (honored): 0003 prepares timing and text needed
  for later narration generation but does not choose or bind to a concrete
  provider.
- **Subtitle output seam** (honored): 0003 prepares subtitle-ready timing from
  the same shared timeline but does not commit the pipeline to a final
  subtitle delivery format.

## Contracts

### Input (authoritative 0002 script package)

```json
{
  "topic": "string",
  "angle": "string",
  "narration": "string",
  "visual_beats": [
    {
      "timestamp": "string (M:SS from start)",
      "description": "string"
    }
  ],
  "duration_estimate_s": "integer",
  "target_audience": "string"
}
```

All six fields are required. This is the authoritative upstream artifact 0003
consumes.

### Output (`narrated timeline draft`)

```json
{
  "topic": "string (copied from input)",
  "angle": "string (copied from input)",
  "narration": "string (copied from input, unchanged)",
  "visual_beats": [
    {
      "timestamp": "string (copied from input)",
      "description": "string (copied from input)"
    }
  ],
  "duration_estimate_s": "integer (copied from input)",
  "target_audience": "string (copied from input, unchanged)",
  "timeline_segments": [
    {
      "start_s": "number (seconds from clip start, fractional allowed)",
      "end_s": "number (seconds from clip start, fractional allowed)",
      "narration_text": "string",
      "visual_instruction": "string",
      "subtitle_text": "string"
    }
  ]
}
```

### Output Constraints

- **LLM output scope**: the model returns only `timeline_segments`. The CLI
  copies through the passthrough fields — `topic`, `angle`, `narration`,
  `visual_beats`, `duration_estimate_s`, `target_audience` — from the input
  script package unchanged.
- **One segment per visual beat**: there must be exactly one
  `timeline_segment` per `visual_beats` entry, in the same order.
  `visual_instruction` must equal the corresponding `visual_beats[].description`.
  `visual_instruction` for segment `i` is deterministically copied from
  `visual_beats[i].description`, not generated or paraphrased by the LLM.
- **Contiguous timing**: the first segment's `start_s` is `0.0`. Every
  segment's `start_s` must equal the prior segment's `end_s`. The final
  segment's `end_s` must land within `1.0` second of `duration_estimate_s`.
- **Narration preservation**: `narration_text` values are segment-aligned
  slices of the input `narration`. When the `narration_text` values are
  concatenated in segment order and whitespace-normalized, the result must
  equal the input `narration` after whitespace normalization.
- **Whitespace normalization** means trimming leading and trailing whitespace and collapsing internal whitespace sequences (including newlines, tabs, and multiple spaces) to a single space. Both the concatenated `narration_text` values and the input `narration` are normalized before comparison.
- **Subtitle mirroring**: `subtitle_text` must equal `narration_text` for
  each segment.
  `subtitle_text` mirrors `narration_text` in this phase; future
  divergence is deferred to subtitle realization/output work.
- Downstream narration generation, subtitle realization, and 0004 rendering
  must treat this draft as the authoritative timing source. If a downstream
  stage cannot conform to the emitted timing, it is a contract error rather
  than a silent timing drift.

### Agent Responsibilities

- **Model**: `deepseek/deepseek-v4-pro` on OpenRouter.
- **Config namespace**: `timeline.model` defaults to
  `deepseek/deepseek-v4-pro`; `timeline.temperature` is the minimal
  additional model-control setting.
- **Single call**: one prompt per run.
- **Prompt shape**: consume the authoritative script package and return a
  narrated timeline draft that preserves the script's narration and target
  audience while providing only segment timing, narration slices, and
  subtitle-ready text. `visual_instruction` is **not** requested from or
  returned by the LLM; the CLI injects it after the call (see Output
  Constraints).

### Handoff to 0004

0004 consumes the canonical narrated timeline draft JSON (with
`timeline_segments`, authoritative timing, `visual_instruction`,
`narration_text`/`subtitle_text`, and the duration-estimate/context fields)
as its sole pre-render input. 0003 does **not** hand off: narration audio or
TTS artifacts, rendered scenes or video frames, final subtitle files, an
asset library, or template selection. 0003 hands downstream stages timing and text, not final
subtitle artifacts.

## Failure Modes

| Failure | Handling |
|---|---|
| Missing required script-package field | Return structured error, exit nonzero |
| Empty or whitespace-only `narration` | Return structured error, exit nonzero |
| Empty or malformed `visual_beats` array | Return structured error, exit nonzero |
| LLM call fails (network, rate limit, auth) | Retry once, then surface error with exit code |
| LLM returns unparseable or incomplete timeline output | Surface parse/contract error, exit nonzero |
| Output changes `narration` or `target_audience` | Treat as contract violation, exit nonzero |
| Timeline segments overlap or leave gaps | Treat as contract violation, exit nonzero |
| Downstream narration or subtitle stage cannot realize the emitted timing | Treat as downstream contract error, exit nonzero |
| Segment count does not equal `visual_beats` length | Validation error, exit nonzero |
| `visual_instruction` does not match corresponding `visual_beats[].description` (validated after CLI injection) | Validation error, exit nonzero |
| First `start_s` is not `0.0` or any segment `start_s` does not equal prior `end_s` | Contiguity error, exit nonzero |
| Concatenated `narration_text` values (whitespace-normalized) do not equal input `narration` (whitespace-normalized) | Narration-preservation error, exit nonzero |
| Any `subtitle_text` does not equal its segment's `narration_text` | Subtitle-mirroring error, exit nonzero |
| Model not available | Fail fast with model name in error message |

## Acceptance Criteria

- `apollo timeline script-package.json` emits one narrated timeline draft with
  all required fields.
- The output `narration` exactly matches the input `narration`.
- The output `target_audience` exactly matches the input `target_audience`.
- Passthrough fields `topic`, `angle`, `visual_beats`, and
  `duration_estimate_s` are copied from the input unchanged.
- There is exactly one `timeline_segment` per `visual_beats` entry, in the
  same order.
- The first `start_s` is `0.0`; every segment `start_s` equals the prior
  segment `end_s`; the final `end_s` satisfies `|final_end_s - duration_estimate_s| <= 1.0`.
- Concatenated `narration_text` values (whitespace-normalized) equal the
  input `narration` (whitespace-normalized).
- `subtitle_text` equals `narration_text` for every segment.
- `timeline_segments.start_s` and `end_s` are numeric seconds, with fractional
  values allowed.
- The drafting stage uses `deepseek/deepseek-v4-pro` on OpenRouter.
- The output is sufficient for 0004 consumption without manual timeline
  rewriting.

## Verification

- Unit test: mock LLM response, verify required output fields and preservation
  of `narration` and `target_audience`.
- Contract test: invalid or incomplete script-package input fails with a
  structured error.
- Contract test: mutated passthrough fields (`topic`, `angle`, `narration`,
  `visual_beats`, `duration_estimate_s`, `target_audience`) in the output
  fail validation.
- Timeline validation test: output segments are ordered, non-overlapping, and
  cover the expected clip duration, with `|final_end_s - duration_estimate_s| <= 1.0`.
- One-segment-per-beat test: segment count equals `visual_beats` length and
  (post-CLI injection) `visual_instruction` matches `visual_beats[].description`.
- Contiguity test: first `start_s` is `0.0`, each `start_s` equals prior
  `end_s`.
- Narration-preservation test: whitespace-normalized concatenation of
  `narration_text` equals whitespace-normalized input `narration`.
- Subtitle-mirroring test: `subtitle_text` equals `narration_text` per segment.
- Config test: default `timeline.model` resolves to
  `deepseek/deepseek-v4-pro`, and `timeline.temperature` can be supplied
  through the `timeline.*` namespace.
- CLI smoke test: `apollo timeline script-package.json` exits 0 and produces
  parseable narrated-timeline-draft JSON.
