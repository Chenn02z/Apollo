# Milestone: Asset-Driven Visual Render

## Status

Accepted

## Goal

Render the canonical 0003 narrated timeline draft into a visually
intentional short-form visual draft using reusable motion-graphics
templates — not frame-by-frame AI video.

## Input Contract

**Required:** one 0003 narrated timeline draft JSON, matching the
shape of `docs/samples/*/03-timeline.json`.

Consumed fields:
- `topic`
- `duration_estimate_s`
- `timeline_segments[].start_s`
- `timeline_segments[].end_s`
- `timeline_segments[].visual_instruction`
- `timeline_segments[].subtitle_text`
- `timeline_segments[].narration_text`

`start_s` / `end_s` are authoritative.

**Optional:** `--narration <audio-file>` WAV or MP3. If omitted the
output is silent but still valid. 0004 does not generate narration/TTS.

## Output Contract

- `output.mp4` — H.264 MP4, 1080×1920 (9:16), one scene per timeline
  segment, burned subtitles from `subtitle_text`, optional narration
  audio if supplied, duration equals the final segment's `end_s`.
- `output.render.json` manifest — source timeline path, optional
  narration source, output path, duration, resolution, per-segment
  template and params.

## CLI Surface

```
apollo render timeline.json [--narration audio.wav] -o output.mp4
```

## In Scope

- Input contract parsing and validation.
- Deterministic keyword/regex/rule template mapping (no LLM in render
  path).
- Bundled reusable asset/template strategy.
- Scene composition from timeline segments.
- Subtitle burn-in from `subtitle_text`.
- Optional audio mux when `--narration` is supplied.
- Render manifest generation.
- Local-first, non-proprietary render stack.

## Out Of Scope

- Frame-by-frame AI video generation.
- Direct publishing adapters.
- Analytics or feedback ingestion.
- Thumbnail generation.
- Final export packaging.
- Longer-form / multi-clip support.
- Narration generation / provider choice.
- Standalone subtitle-file export.
- Asset authoring GUI.
- Dynamic asset generation beyond the template vocabulary.

## Architecture Seams

| Seam | Role |
|---|---|
| Renderer asset seam | **Primary.** Bundled templates and assets consumed by the renderer. |
| Timeline assembly seam | Consumed read-only (0003 output). |
| Narration provider seam | Optional input only. |
| Subtitle output seam | Burn-in for visual draft; standalone delivery deferred to 0005. |

## Specs

- `docs/specs/0004-asset-driven-visual-render.md`

## Template Vocabulary

Sample-derived deterministic templates:

- `title_card`
- `side_by_side`
- `code_snippet`
- `diagram`
- `flowchart`
- `chart_bar`
- `chart_line`
- `split_output`
- `key_takeaways`
- `fallback_text_card`

`fallback_text_card` handles unmatched or free-form visual instructions
with a warning and the raw instruction text.

## Acceptance Criteria

1. `apollo render` creates a playable MP4 and a manifest JSON.
2. Output duration is within 0.1 s of the final segment's `end_s`.
3. Every segment maps to a template or `fallback_text_card`.
4. Subtitles are burned in per segment.
5. No proprietary editor dependency; no frame-by-frame AI video.
6. Optional narration audio is present when `--narration` is supplied
   and absent when omitted.
7. Manifest has one entry per segment and includes the source path.
8. No re-segmentation or timing drift from source `start_s` / `end_s`.

## Verification

- Unit tests for template mapping across `docs/samples/*/03-timeline.json`.
- Unit tests for fallback and param extraction.
- CLI smoke test using `docs/samples/caching/03-timeline.json`.
- Duration / ffprobe test.
- Manifest structure test.
- No-audio / with-audio tests.
- Dependency and toolchain check.

## Non-Blocking Spec Constraints

These are settled for milestone acceptance but left to the spec for
exact implementation detail:

- Template parameter extraction strategy.
- Rendering backend choice.
- Subtitle burn approach.
- Audio muxing approach.
- Multi-keyword precedence rules.
- Fallback text card rendering.
- Asset / template file format and storage layout.
- Resolution and codec confirmation.

## Deferred

Standalone subtitle delivery (0005), final export packaging,
thumbnailing, publishing, analytics.

## Open Questions

None blocking milestone acceptance.
