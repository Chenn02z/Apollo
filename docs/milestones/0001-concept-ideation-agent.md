# Milestone: Concept Ideation Agent

## Status

Accepted

## Goal

Accept a vague concept and produce a ranked list of concrete video topics so the
creator can feed the best candidates into downstream script generation without
manual brainstorming.

## MVP Deliverable

A local CLI run can accept a vague concept (e.g. "LLMs") and produce a ranked
list of 5–10 concrete short-form video topics, each with a one-line teaching
angle.

## Developer Workflow

Requirements -> spec authoring -> development loop.

## In Scope

- Vague-concept input contract.
- Ideation Agent: single LLM call producing structured ranked topic output.
- Ranked topic output contract (title + one-line angle per candidate).
- Handoff into Script Agent (0002).

## Out Of Scope

- Script generation (owned by 0002).
- Topic selection UI beyond the ranked list.
- Channel-strategy-aware filtering or audience analytics.
- Multi-batch ideation or iterative refinement loops.

## Architecture Seams

- Topic intake contract (feeds into 0002 from ideation output).
- Research input seam (lightweight: concept scoping is a form of research).

## Specs

- `docs/specs/`

## Acceptance Criteria

- One local run from a vague concept yields a ranked list of 5–10 concrete
  video topics with angles.
- The output is structured and predictable enough to feed directly into the
  Script Agent (0002).
- The Ideation Agent's cost is a single LLM call per run.

## Verification

- Future CLI command to run the concept-to-topics flow.
- Output review against the milestone contract.
- Feed output into 0002 to confirm handoff compatibility.

## Deferred

Script generation, rendering, narration, subtitles, thumbnailing, and final
export.

## Open Questions

*Deferred to spec phase, non-blocking for milestone acceptance.*

- What ranking signal best balances creator intent with topic diversity?
- Should the agent surface its reasoning (why each topic works) or just the
  ranked list?
