# Milestone: Asset-Driven Visual Render

## Status

Draft

## Goal

Render the timed draft into a visually intentional short-form clip using
reusable motion-graphics assets instead of AI-video-heavy generation.

## MVP Deliverable

The pipeline can turn one timed clip plan into a rendered visual draft that
matches the narration and subtitle timing with reusable visual assets.

## Developer Workflow

Requirements -> spec authoring -> development loop.

## In Scope

- Asset-driven scene composition for one clip.
- Deterministic visual timing from the shared timeline.
- Reusable motion-graphics asset strategy for cheap polish.

## Out Of Scope

- Direct publishing adapters.
- Analytics or feedback ingestion.
- Longer-form video support.

## Architecture Seams

- Renderer asset seam.
- Timeline assembly seam.

## Specs

- `docs/specs/...`

## Acceptance Criteria

- One narrated timeline draft can be rendered locally into a coherent visual
  clip draft.
- Visual output depends on reusable assets/templates, not frame-by-frame AI
  video generation.
- The render path preserves timing alignment with narration and subtitles.

## Verification

- Future local render command.
- Clip review for timing and visual consistency.

## Deferred

Final export packaging, thumbnailing, publishing, and analytics.

## Open Questions

- What minimum asset library is enough to avoid repetitive or sloppy output?
