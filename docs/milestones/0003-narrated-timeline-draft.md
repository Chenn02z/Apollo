# Milestone: Narrated Timeline Draft

## Status

Accepted

## Goal

Convert the authoritative 0002 script package into a narrated timeline draft
that preserves the script's narration and target audience while adding the
shared timing plan needed before render.

## MVP Deliverable

A local CLI command accepts the authoritative 0002 script package and emits a
single `narrated timeline draft` JSON artifact for one clip, ready to hand to
0004 for visual rendering. No manual timeline rewriting — the CLI output is
the canonical artifact.

## Developer Workflow

Requirements -> spec authoring -> development loop.

## In Scope

- Authoritative 0002 script-package input contract:
  `topic`, `angle`, `narration`, `visual_beats`, `duration_estimate_s`,
  `target_audience`.
- Narrated timeline draft output contract for one clip.
- Timeline drafting that preserves the input narration draft and target
  audience.
- Shared timing plan with subtitle-ready text for later narration, subtitle
  realization, and rendering.
- Structured handoff into 0004.
- Timeline drafting with `deepseek/deepseek-v4-pro` on OpenRouter.

## Out Of Scope

- Re-authoring the script package narration.
- Retargeting the audience defined by 0002.
- Exact narration provider selection or narration-audio generation.
- Final subtitle-file generation.
- Final motion-graphics polish.
- Thumbnail generation.
- Direct platform upload.

## Architecture Seams

- Timeline assembly seam.
- Narration provider seam.
- Subtitle output seam.

## Specs

- `docs/specs/0003-narrated-timeline-draft.md`

## Acceptance Criteria

- One authoritative 0002 script package can be turned into one narrated
  timeline draft.
- The draft preserves the input `narration` and `target_audience` unchanged.
- Timeline timing is shared across narration planning, subtitle planning, and
  render consumption.
- `timeline_segments.start_s` and `end_s` use numeric seconds, with
  fractional precision allowed.
- The output is the canonical pre-render artifact handed to 0004.
- The draft is the authoritative timing source for downstream narration,
  subtitle realization, and 0004 rendering.
- The drafting stage uses `deepseek/deepseek-v4-pro` on OpenRouter.

## Verification

- Future local command to generate a narrated timeline draft from a 0002
  script package.
- Artifact review to confirm narration preservation, target-audience
  continuity, timeline alignment, and numeric-second timing fields.

## Deferred

Narration provider choice, rendered visuals, final subtitle delivery format,
thumbnail generation, and final packaging.

## Non-Blocking Spec Constraints

These design questions must be settled during spec authoring, before
implementation begins. They are not blocking milestone acceptance but are
required constraints for the spec to produce a testable contract:

- **Segment narration reconstruction** — how the spec reconstructs narration
  from input segments.
- **Visual beat alignment** — how visual beats map to timeline segments and
  whether alignment is segment-level or beat-level.
- **`subtitle_text` relationship** — whether each segment carries its own
  `subtitle_text` or derives it from narration.
- **Contiguous timing** — how `start_s` / `end_s` guarantee contiguous,
  gap-free coverage across segments.
- **LLM output scope** — whether the LLM returns only `timeline_segments` or
  also produces narration text, beat metadata, or other fields.

### Flaky-Test Mitigation

The spec must enforce these constraints to keep the test suite deterministic:

- **Unit and CLI tests mock the LLM provider boundary.** No test may call a
  live LLM endpoint for core path assertions.
- **Validation must be deterministic.** All acceptance checks use fixed inputs
  and expected outputs — no model-dependent assertions.
- **Live LLM tests are skipped by default.** Any integration test that calls a
  real provider must be gated behind an opt-in marker (e.g. `pytest -m live`)
  and excluded from the default test run.

## Open Questions

- No blocking open questions for milestone acceptance.
