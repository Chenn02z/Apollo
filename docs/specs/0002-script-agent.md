# Spec: Script Agent

## Status

Verified

## Goal

Accept a concrete topic (from 0001 ideation output or direct CLI input) and
produce a short-form technical education script package targeted at software
developers preparing for interviews. The script package contains a refined
teaching angle, narration draft, and planned visual beats for one 60–90 second
clip.

## Scenario

The creator runs:

```sh
apollo script '{"topic":"How Attention Mechanisms Let LLMs Read Whole Paragraphs at Once","angle":"Visual breakdown of self-attention as a weighted lookup table"}'
```

Or pipes from ideation:

```sh
apollo ideate "LLMs" | apollo script -
```

The Script Agent calls `deepseek/deepseek-v4-pro` once and emits a script
package:

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

## Architecture Reference

`docs/ARCHITECTURE.md`

Touches approved seams: Topic intake contract, Research input seam, Timeline assembly seam.

## In Scope

- Accept a `{topic, angle}` JSON input (from 0001 or direct CLI).
- Single LLM call per run using `deepseek/deepseek-v4-pro`.
- Produce a structured script package: topic, refined angle, narration
  draft, visual beats with timestamps, duration estimate, target audience.
- Content must be geared toward software developers preparing for
  technical interviews — concrete, concept-driven, assumes coding
  knowledge but explains the target concept from first principles.
- The input `angle` is a seed hint that the script agent may refine or
  replace entirely. The output `angle` is the authoritative refined
  teaching angle.
- Standalone operation: script generation runs without the ideation stage.
- Configurable model and prompt parameters via `script.*` config keys.

## Out Of Scope

- Concept ideation (owned by 0001).
- Final rendered video, narration audio, subtitle files, thumbnail.
- Timeline assembly (consumes this output, not produced here).
- Platform publishing.
- Seed-link grounding or source-material enrichment.
- Multi-clip or series planning.
- Post-generation editing or human review UI.

## Architecture Seams

- **Topic intake contract** (consumed): the script agent reads a
  `{topic, angle}` JSON object. `topic` is required; `angle` is an
  optional seed from 0001 that the script agent may refine or replace.
  This is the stable input boundary that lets 0001 or direct CLI feed
  into script generation.
- **Research input seam** (honored): the agent performs a lightweight
  internal knowledge synthesis step as part of the LLM prompt before
  scripting. It does not call external search tools. The seam exists so
  that future source seeding (seed-link grounding) can inject material
  into the prompt without rewriting the script generation logic.
- **Timeline assembly seam** (built): the output `visual_beats` array
  includes absolute timestamps (M:SS from start) and descriptions. This
  is the contract that timeline assembly (future milestone) will consume.
  Format: `[{timestamp: string, description: string}]`.

## Contracts

### Input

```json
{
  "topic": "string (required, concrete short-form video topic)",
  "angle": "string (optional seed hint, refined or replaced by script agent)"
}
```

CLI accepts JSON on stdin (with `-`) or as a quoted argument. When piped
from 0001, the pipe adapter always feeds a single `{topic, angle}` object.

### Output (script package)

```json
{
  "topic": "string (echoed from input, unchanged)",
  "angle": "string (refined teaching angle — authoritative output, may differ from input seed)",
  "narration": "string (full narration draft, speakable prose, no markdown)",
  "visual_beats": [
    {
      "timestamp": "string (M:SS from start)",
      "description": "string (what appears on screen)"
    }
  ],
  "duration_estimate_s": "integer",
  "target_audience": "string"
}
```

### Handoff from 0001

The ideation output `{topic, angle}` maps directly to this input. The pipe
adapter in the CLI layer ensures a single object is passed even when 0001
produces multiple topics.

### Agent Responsibilities

- **Model**: `deepseek/deepseek-v4-pro` on OpenRouter.
- **Single call**: one prompt per run.
- **Prompt shape**: given a concrete topic and optional angle seed, produce
  a 60–90 second teaching script for software developers preparing for
  interviews. The script must:
  - Hook with a relatable developer pain point or curiosity gap.
  - Break down the concept from first principles, assuming coding
    knowledge but no prior familiarity with the specific concept.
  - Include at least one concrete code example or analogy a developer
    would recognize.
  - Close with key takeaways phrased for interview recall.
- **Temperature**: low (deterministic-ish).

### Output Constraints

- Narration: 135–225 words (150 wpm × 60–90s), speakable prose, no
  markdown, no bullet lists, no parentheticals.
- Visual beats: minimum 4 entries, start at 0:00, end at or near the
  duration estimate, cover the full timeline without gaps.
- Duration: 60–90 seconds.

## Failure Modes

| Failure | Handling |
|---|---|
| Missing `topic` field | Return structured error, exit nonzero |
| Empty or whitespace-only topic | Return structured error, exit nonzero |
| LLM call fails (network, rate limit, auth) | Retry once, then surface error with exit code |
| LLM returns unparseable output | Surface raw + parse error, exit nonzero |
| Duration estimate outside 60–90s | Warn on stderr, still emit output (soft constraint) |
| Model not available | Fail fast with model name in error message |
| Input JSON is malformed | Return structured parse error, exit nonzero |

## Acceptance Criteria

- Accepts ideation output pipe: `apollo ideate "LLMs" | apollo script -`
  produces a complete script package with all required fields.
- Standalone run: `apollo script '{"topic":"DNS explained"}'` produces a
  complete script package (angle may be synthesized by the agent).
- Narration text is speakable prose: no markdown, no bullet lists, no
  parentheticals.
- Visual beats contain at least 4 entries covering the full estimated
  duration.
- Duration estimate falls within 60–90 seconds.
- Content targets software developers: technical terminology is correct,
  examples assume coding knowledge.
- A single LLM call is made per run.
- The `deepseek/deepseek-v4-pro` model is used and configurable.

## Verification

- Unit test: mock LLM response, verify output schema (all required fields
  present, types correct, no markdown in narration).
- Integration test: live LLM call with a concrete topic, assert all
  required fields present and well-formed.
- Contract test: pipe 0001 output into 0002 input parser, verify no
  schema violations.
- Duration test: assert narration word count is ~135–225 words
  (150 wpm × 60–90s) — soft assertion, warns on violation.
- CLI smoke test: `apollo script '{"topic":"How HTTPS Works"}'` exits 0
  and produces parseable script-package JSON.

## Open Questions

- What config keys for model/prompt tuning? `script.model`,
  `script.temperature`, `script.max_duration_s`, `script.min_duration_s`
  — defer exact shape to implementation but keep them namespaced under
  `script.*`.
