# Milestone: Narrated Timeline Draft

## Status

Accepted

## Goal

Convert the authoritative 0002 script package into a narrated timeline draft
that preserves the script's narration and target audience while adding the
shared timing plan needed before render.

## MVP Deliverable

One local run can accept the authoritative 0002 script package and emit a
single `narrated timeline draft` artifact for one clip, ready to hand to 0004
for visual rendering.

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

## Open Questions

- No blocking open questions for milestone acceptance.
