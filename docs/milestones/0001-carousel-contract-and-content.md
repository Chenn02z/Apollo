# Milestone: Carousel Contract and Content

## Status

Accepted

## Goal

Establish Apollo's first Codex-native stage: an `apollo-generate` skill that
turns one nonblank topic into a validated, seven-slide
`carousel-content.json` run artifact.

## MVP Deliverable

A creator invokes the explicit `apollo-generate` Codex skill (or triggers it
implicitly with an equivalent carousel-generation request) for a topic. Codex
creates one run under `runs/<run-id>/`, delegates content writing once to the
configured `carousel-writer` agent, validates the result deterministically,
and reports the run path.

## Settled Decisions

- Apollo is a Codex-native staged workflow. Its stages are Codex skills and
  custom agents, not a standalone CLI or an application that calls an LLM API.
- This stage's entry point is the `apollo-generate` Codex skill. There is no
  `apollo generate` shell command.
- The skill creates `request.json`, delegates exactly once to the sole
  `carousel-writer` custom agent, runs validation, and reports the run path.
- `carousel-writer` is pinned in its runtime configuration to
  `gpt-5.6-terra` with medium reasoning effort. Model selection is not
  delegated to SKILL prose.
- Apollo has no standalone API key or API client for this workflow.
- All workflow artifacts belong only in `runs/<run-id>/`.
- Later product capabilities are also Codex-native stages, each shaped in its
  own milestone and spec.

## In Scope

- An `apollo-generate` skill bundle containing the workflow instructions,
  the v1 carousel-contract reference, and deterministic validation.
- One `.codex/agents/carousel-writer.toml` custom agent configuration. The
  delegated task supplies the topic and v1 contract and authorizes writing
  only `runs/<run-id>/carousel-content.json`.
- `request.json`, written before delegation, recording at least
  `contractVersion`, `topic`, `runId`, `createdAt`, `model`, and `effort`.
- A `carousel-content.json` v1 shape of
  `{version:"1", topic:string, slides: Slide[7]}`. Slides are numbered 1..7
  and use each fixed role once, in order: `hook`, `concept`, `breakdown`,
  `example`, `comparison`, `application`, `takeaway`.
- Each slide has `number`, `role`, `title`, `body`, and `items`; title length
  is 1..70, body is 1..220, and `items` contains 0..3 strings of 1..80
  characters. Markup, CSS, and HTML are forbidden.
- Deterministic validation of artifact location, JSON validity, schema,
  slide count, role/order, field lengths, and the no-markup rule.

## Required Failure Behavior

- A missing or blank topic: do not create a run directory or delegate; report
  a concise failure.
- Run-directory or `request.json` creation failure: do not delegate; report a
  concise failure.
- Agent delegation or agent execution failure: report a concise failure;
  retain `request.json` when it was written; do not accept or report a
  successful content artifact.
- Missing, unreadable, invalid-JSON, misplaced, or contract-invalid agent
  output: delete `runs/<run-id>/carousel-content.json`, retain `request.json`,
  report a concise validation failure, and do not accept or report a successful
  content artifact.
- Validation never repairs content and the skill never retries delegation.
- A successful result is reported only after validation passes and names its
  `runs/<run-id>/` path.

## Out Of Scope

- HTML or PNG rendering, theme packs, visual review, external assets, and all
  later rendering/export stages.
- Citations, research, topic taxonomy, retry or repair loops, caching,
  publishing, or scheduling.
- A standalone Node CLI, standalone LLM API key/client, or alternate content
  producers/models.

## Architecture Seams

- Preserve the content/render artifact boundary: this stage produces only the
  validated content artifact; future Codex-native rendering stages consume it.
- Preserve the run-artifact boundary: stages communicate through files in the
  same `runs/<run-id>/` directory.

## Scenarios

- A creator invokes `apollo-generate` for `ACID properties in databases` and
  receives the validated run path after one writer delegation.
- An equivalent natural-language request activates the same skill and follows
  the same workflow and output contract.
- A blank topic fails before filesystem output or delegation.
- The writer returns malformed or contract-invalid content; validation fails,
  no repair/retry occurs, and the retained request identifies the failed run.
- The writer cannot run; the run remains inspectable through its request but
  is not reported as successful.

## Acceptance Criteria

- An explicit `apollo-generate` invocation and an equivalent implicit trigger
  accept exactly one nonblank topic and never invoke a shell CLI or standalone
  LLM API client.
- The skill writes `runs/<run-id>/request.json` before delegating and writes
  no workflow artifacts outside that run directory.
- The only content-generation delegation is one `carousel-writer` invocation;
  its custom-agent configuration pins `gpt-5.6-terra` and medium reasoning
  effort.
- The delegated writer is constrained to write only
  `runs/<run-id>/carousel-content.json`.
- Valid output satisfies the complete v1 JSON schema, fixed seven-role order,
  length limits, and no-markup rule, then the skill reports that run path.
- Each stated failure mode is concise, does not retry or repair, retains an
  already-created `request.json`, and never reports an unvalidated content
  artifact as successful.
- No HTML/PNG, research/citation, taxonomy, retry/repair, or external-asset
  capability is implemented by this milestone.

## Verification

- Automated checks cover valid generation, request-before-delegation,
  one-delegation behavior, agent configuration, artifact location, schema and
  constraint validation, and every required failure behavior.
- Manually inspect one representative topic's `request.json` and validated
  `carousel-content.json`.

## Proposed Spec

`docs/specs/0001-codex-carousel-content-workflow.md`

## Open Questions

None. This milestone is ready for `$spec`.
