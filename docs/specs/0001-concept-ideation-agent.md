# Spec: Concept Ideation Agent

## Status

Accepted

## Goal

Accept a vague concept string from the creator and produce exactly one concrete
short-form video topic (with a one-line teaching angle) ready for handoff to
the Script Agent (0002). The output count is configurable but defaults to 1.

## Scenario

The creator runs:

```sh
apollo ideate "LLMs"
```

The Ideation Agent calls `deepseek/deepseek-v4-flash` once and emits a single
`{topic, angle}` JSON object:

```json
{"topic": "How Attention Mechanisms Let LLMs Read Whole Paragraphs at Once", "angle": "Visual breakdown of self-attention as a weighted lookup table"}
```

## Architecture Reference

`docs/ARCHITECTURE.md`

Touches approved seams: Concept intake contract, Topic intake contract, Research input seam.

## In Scope

- Accept a vague `concept` string via CLI or programmatic call.
- Single LLM call per run using `deepseek/deepseek-v4-flash`.
- Return a structured output: one `{topic, angle}` JSON object when
  `topic_count=1` (default); a JSON array of `{topic, angle}` objects
  when `topic_count > 1`.
- Configurable topic count via `ideation.topic_count`, defaulting to 1.
- The output topic must be a self-contained concrete short-form video idea
  (no external context required by downstream).
- Standalone operation: the ideation stage runs independently of script
  generation.

## Out Of Scope

- Multi-topic ranked lists beyond the configurable count.
- Topic selection UI or interactive refinement.
- Script generation (owned by 0002).
- Channel-strategy-aware filtering, audience analytics, or trend analysis.
- Iterative refinement loops or multi-batch ideation.
- Source-link or seed-material grounding.

## Architecture Seams

- **Concept intake contract** (honored): the CLI entry point or function
  call accepts a freeform `concept` string as its only required input.
- **Topic intake contract** (built): the output `{topic, angle}` JSON
  object is the stable handoff format consumed by 0002. When
  `topic_count > 1`, the output is a JSON array of such objects; the
  pipe adapter in the CLI layer selects the first element when feeding
  0002. This keeps the per-topic contract identical regardless of count.
- **Research input seam** (lightweight): concept scoping is a form of
  research, but this stage does not perform web searches or source
  grounding.

## Contracts

### Input

```json
{
  "concept": "string (required, e.g. 'LLMs', 'Kubernetes', 'DNS')"
}
```

Configuration (env or config file):

```json
{
  "ideation.topic_count": 1
}
```

### Output (topic_count=1, default)

```json
{
  "topic": "string (concrete short-form video title)",
  "angle": "string (one-line teaching approach)"
}
```

### Output (topic_count > 1)

```json
[
  {"topic": "string", "angle": "string"},
  {"topic": "string", "angle": "string"}
]
```

### Handoff to 0002

When `topic_count=1`, the output pipes directly into 0002's input:

```sh
apollo ideate "LLMs" | apollo script -
```

When `topic_count > 1`, the CLI pipe adapter selects the first (top-ranked)
topic from the array and feeds it to 0002. 0002 itself never receives an
array — it always consumes a single `{topic, angle}` object.

The `angle` field is a seed hint; 0002 may refine or replace it.

### Agent Responsibilities

- **Model**: `deepseek/deepseek-v4-flash` on OpenRouter.
- **Single call**: one prompt per run.
- **Prompt shape**: given a vague concept, produce `ideation.topic_count`
  concrete short-form video topics, each with a one-line teaching angle,
  ranked by suitability for a technical education TikTok clip.
- **Temperature**: low (deterministic-ish output for reproducibility).

## Failure Modes

| Failure | Handling |
|---|---|
| Empty or whitespace-only concept | Return structured error, exit nonzero |
| LLM call fails (network, rate limit, auth) | Retry once, then surface error with exit code |
| LLM returns unparseable output | Surface raw + parse error, exit nonzero |
| LLM returns fewer topics than requested | Return what was produced (minimum 1), warn on stderr |
| Model not available | Fail fast with model name in error message |

## Acceptance Criteria

- A local CLI run `apollo ideate "LLMs"` produces a single valid
  `{topic, angle}` JSON object on stdout.
- Running with `ideation.topic_count=3` produces a JSON array of 3
  `{topic, angle}` objects.
- The output is parseable by the Script Agent's input contract.
- A single LLM call is made per run (no multi-turn or retry beyond the
  failure-mode retry).
- The `deepseek/deepseek-v4-flash` model is used and configurable.

## Verification

- Unit test: mock LLM response, verify JSON output shape for both
  `topic_count=1` and `topic_count=3`.
- Integration test: live LLM call with a known concept, assert structured
  output.
- Contract test: feed ideation output into 0002's input parser.
- CLI smoke test: `apollo ideate "Sorting Algorithms"` exits 0 and
  produces parseable JSON.

## Open Questions

- Should `topic_count` be a CLI flag (`--count`) or config-only? Defer to
  implementation: CLI flag overrides config, config defaults to 1.

## Notes

- The original milestone (0001) called for 5–10 ranked topics. This spec
  deliberately overrides that to a configurable count defaulting to 1, per
  product decision: the MVP handoff feeds exactly one topic from ideation
  into script generation.
