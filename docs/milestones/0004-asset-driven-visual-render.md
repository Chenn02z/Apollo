# Milestone: Asset-Driven Visual Render

## Status

Accepted

## Goal

Render one canonical 0003 narrated timeline draft into one ordered 1080×1920
PNG per input timeline segment. The renderer uses deterministic HTML/CSS
templates rasterized by a headless browser. It produces slideshow images and a
render manifest only: no video or audio output.

## Input Contract

**Required:** one 0003 narrated timeline draft JSON, matching the shape of
`docs/samples/*/03-timeline.json`.

Consumed fields:

- `topic`
- `duration_estimate_s`
- `timeline_segments[].start_s`
- `timeline_segments[].end_s`
- `timeline_segments[].visual_instruction`
- `timeline_segments[].subtitle_text`

The renderer validates that `timeline_segments` contains 3-10 segments. A
timeline with 1-2 segments is invalid. Array order determines the slide order;
there is exactly one output slide for each input segment and no duplicate
slides.

## Output Contract

- Ordered PNG images (1080×1920), exactly one per input timeline segment.
- `slides.manifest.json` with source topic, output directory, `image_count`,
  and one `slides[]` entry per input segment containing index, role, file name,
  template, and params.

## CLI Surface

```
apollo render timeline.json -o output/
```

## Slide Roles

Every output slide has an explicit manifest role:

- **intro** — the first input segment.
- **content** — each middle input segment.
- **ending** — the last input segment.

## In Scope

- Input parsing and validation, including the 3-10 segment limit.
- Deterministic keyword/regex/rule template mapping, with no LLM in the render
  path.
- One HTML/CSS template render per input timeline segment using a deterministic
  headless-browser rasterizer.
- Slide text derived from `subtitle_text`, with concise text extracted from
  `visual_instruction` as a fallback.
- One 1080×1920 PNG per input segment, with no duplicate slides.
- Stable file naming: `01-intro.png`, `02-content.png`, ...,
  `NN-ending.png`.
- Render manifest generation with `image_count`, `output_dir`, and `slides[]`.
- Shared visual defaults: bold, high-contrast readable type; safe margins; a
  shared theme; scannable code and cards; no tiny text; and one idea per slide.
- Local-first, non-proprietary render stack.

## Out Of Scope

- Video output or encoding, including ffmpeg, ffprobe, and MP4 output.
- Audio output of any kind, including TTS and narration muxing.
- Subtitle files (`.srt`, `.vtt`, and similar).
- Thumbnail generation.
- Frame-by-frame AI video generation.
- Direct publishing adapters.
- Analytics or feedback ingestion.
- Final export packaging.
- Longer-form or multi-clip support.
- Asset authoring GUI.
- Dynamic asset generation beyond the template vocabulary.

## Architecture Seams

| Seam | Role |
|---|---|
| Renderer asset seam | **Primary.** Bundled HTML/CSS templates and assets consumed by the renderer. |
| Timeline assembly seam | Consumed read-only (0003 output). |
| Slide text seam | `subtitle_text` preferred; `visual_instruction` fallback; no subtitle delivery artifacts. |

## Specs

- `docs/specs/0004-asset-driven-visual-render.md`

## Template Vocabulary

Sample-derived deterministic templates rendered as HTML/CSS:

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

`fallback_text_card` handles unmatched or free-form visual instructions with a
warning and the raw instruction text.

## Acceptance Criteria

1. `apollo render` produces ordered 1080×1920 PNG images and a manifest JSON.
2. The renderer accepts only 3-10 timeline segments and rejects 1-2 segments.
3. Output contains exactly one PNG and exactly one manifest entry per input
   timeline segment, with no duplicate slides.
4. The first slide is `intro`, every middle slide is `content`, and the last
   slide is `ending`.
5. Every segment maps to one template or `fallback_text_card`.
6. All slides use bold, high-contrast readable type, safe margins, the shared
   theme, scannable code/cards, no tiny text, and one idea per slide.
7. Manifest has `image_count`, `output_dir`, and `slides[]` entries with role,
   file name, template, and params.
8. No video, audio, subtitle files, thumbnail generation, or LLM render path.

## Verification

- Unit tests for the 3-10 segment validation and rejection of 1-2 segments.
- Unit tests for exact template mapping across the three sample timelines.
- Unit tests for fallback and parameter extraction.
- CLI smoke test using `docs/samples/caching/03-timeline.json`.
- Image dimension validation: every PNG is 1080×1920.
- Manifest structure test: `image_count` matches input segment and file counts;
  roles, ordering, and stable file names are correct; no duplicate slide is
  present.
- Visual-default test: each template applies the shared theme, safe margins,
  readable high-contrast type, and no tiny text.
- Output assertion: no video, audio, subtitle, or thumbnail artifact is
  generated.

## Sample Mapping Contract

- **Caching (5 slides):** title card; chef side-by-side; `getProfile` code
  snippet; cache flowchart; and key takeaways.
- **Java GC (6 slides):** sandcastle fallback card; JVM STOP diagram;
  object-roots fallback card; `MaxGCPauseMillis` snippet; pause-time line
  chart; and key takeaways.
- **China models (5 slides):** Qwen/Llama side-by-side; code snippet; split
  output; cost bar chart; and key takeaways.

## Deferred

Final export packaging, publishing, and analytics.

## Open Questions

None blocking milestone acceptance.
