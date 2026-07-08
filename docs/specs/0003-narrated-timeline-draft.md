# Spec: Narrated Timeline Draft

## Status

Accepted

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
      "start_s": 0,
      "end_s": 5,
      "narration_text": "Ever wondered how LLMs process an entire sentence at once...",
      "visual_instruction": "Title card: topic + hook question",
      "subtitle_text": "Ever wondered how LLMs process an entire sentence at once..."
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

- `narration` must exactly match the input narration draft.
- `target_audience` must exactly match the input target audience.
- `timeline_segments` must be ordered, non-overlapping, and cover the clip
  from `0.0` to the final segment end.
- Each segment must include narration, visual, and subtitle text tied to one
  shared timing range.
- `start_s` and `end_s` are numeric seconds; fractional precision is allowed.
- The final segment end must land within `1.0` second of
  `duration_estimate_s`.
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
  audience while aligning narration slices, visual instructions, and
  subtitle-ready text on one timeline.

### Handoff to 0004

0004 consumes the narrated timeline draft as its canonical pre-render input.
0003 does not hand 0004 narration audio, rendered scenes, or a final subtitle
file. 0003 hands downstream stages subtitle-ready timing and text, not final
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
| Timeline segments overlap or leave large gaps | Treat as contract violation, exit nonzero |
| Downstream narration or subtitle stage cannot realize the emitted timing | Treat as downstream contract error, exit nonzero |
| Model not available | Fail fast with model name in error message |

## Acceptance Criteria

- `apollo timeline script-package.json` emits one narrated timeline draft with
  all required fields.
- The output `narration` exactly matches the input `narration`.
- The output `target_audience` exactly matches the input `target_audience`.
- The output includes ordered `timeline_segments` with shared timing for
  narration text, visual instruction, and subtitle text.
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
- Contract test: mutated narration or target audience in model output fails
  validation.
- Timeline validation test: output segments are ordered, non-overlapping, and
  cover the expected clip duration, with the final `end_s` within `1.0`
  second of `duration_estimate_s`.
- Config test: default `timeline.model` resolves to
  `deepseek/deepseek-v4-pro`, and `timeline.temperature` can be supplied
  through the `timeline.*` namespace.
- CLI smoke test: `apollo timeline script-package.json` exits 0 and produces
  parseable narrated-timeline-draft JSON.
