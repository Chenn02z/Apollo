# Spec: Asset-Driven Visual Render

## Status

Accepted

## Goal

Render one canonical 0003 narrated timeline draft JSON into one ordered
1080×1920 PNG slideshow image per input timeline segment, plus a
`slides.manifest.json`. Rendering uses deterministic HTML/CSS templates and a
headless browser. There is no LLM in the render path and no video, audio,
subtitle-file, or thumbnail output.

## Scenario

```sh
apollo render docs/samples/caching/03-timeline.json -o /tmp/caching-slides/
```

The CLI:

1. Validates the timeline JSON and requires 3-10 timeline segments. Timelines
   with 1-2 segments fail validation.
2. Uses input array order to assign roles: the first segment is `intro`, each
   middle segment is `content`, and the final segment is `ending`.
3. Maps every segment's `visual_instruction` to one deterministic template.
4. Extracts template parameters from the instruction text.
5. Renders one HTML page for each input segment with text derived from
   `subtitle_text`, or from `visual_instruction` when subtitle text is absent.
6. Rasterizes each page to one 1080×1920 PNG via a headless browser.
7. Writes one stable file name per segment: `01-intro.png`,
   `02-content.png`, ..., `NN-ending.png`.
8. Writes `slides.manifest.json` with source topic, output directory,
   `image_count`, and one `slides[]` entry per segment.
9. Cleans up any temp files.

## Architecture Reference

`docs/ARCHITECTURE.md`

## Architecture Seams

| Seam | Role |
|---|---|
| Renderer asset seam | **Built in 0004.** Bundled HTML/CSS templates and assets consumed by the renderer. |
| Timeline assembly seam | **Honored read-only.** 0003 output is consumed without mutation. |
| Slide text seam | `subtitle_text` is preferred and `visual_instruction` is the fallback; no subtitle delivery artifacts are produced. |

## In Scope

- Input contract parsing and 3-10 segment validation.
- Deterministic keyword/regex template mapping with no LLM.
- Template parameter extraction.
- Bundled reusable HTML/CSS templates rasterized by a headless browser.
- One PNG per input segment with `intro`, `content`, and `ending` roles.
- Slide text derivation from `subtitle_text` or `visual_instruction`.
- Render manifest generation.
- Shared visual defaults: bold, high-contrast readable type; safe margins; a
  shared theme; scannable code and cards; no tiny text; and one idea per slide.
- Local-first, non-proprietary render stack.

## Out Of Scope

- Video output or encoding, including ffmpeg, ffprobe, and MP4 output.
- Audio output of any kind, including TTS and narration muxing.
- Subtitle files (`.srt`, `.vtt`, and similar).
- Thumbnail generation.
- Frame-by-frame AI video generation.
- LLM or proprietary API in the render path.
- Direct publishing adapters.
- Analytics or feedback ingestion.
- Final export packaging.
- Longer-form or multi-clip support.
- Narration generation or provider choice.
- Asset authoring GUI.

## Contracts

### Dependencies

- **Node.js runtime** (or similar): required for the headless browser.
- **Headless browser library**: for example Puppeteer or Playwright, used to
  rasterize HTML/CSS templates to 1080×1920 PNGs.
- No ffmpeg, ffprobe, moviepy, imageio, or OpenCV.

### CLI

```
apollo render <timeline.json | -> [-o <output-dir>]
```

- The first positional argument is a timeline JSON path or `-` for stdin.
- `-o` selects the output directory; default: `./output/`.
- The command writes PNGs and `slides.manifest.json` to the output directory.
- Existing files in that output directory may be overwritten.
- Temp files are written to a temp directory and cleaned up in a `finally`
  block.
- Exit 0 on success and nonzero on validation or render failure.

### Input Contract

Required timeline JSON fields:

| Field | Type | Notes |
|---|---|---|
| `topic` | string | Clip topic |
| `duration_estimate_s` | number | Expected total duration |
| `timeline_segments` | array | Ordered segment objects |
| `timeline_segments[].start_s` | number | Start in seconds |
| `timeline_segments[].end_s` | number | End in seconds |
| `timeline_segments[].visual_instruction` | string | Text for deterministic template mapping |
| `timeline_segments[].subtitle_text` | string | Preferred source for slide text |

Validation rules:

- `timeline_segments` must contain 3-10 entries; 1-2 entries are invalid.
- The first segment's `start_s` must be `0.0`.
- Each segment's `start_s` must equal the prior segment's `end_s`.
- All timing values must be numeric.
- The final `end_s` must satisfy
  `|final_end_s - duration_estimate_s| <= 1.0`.

### Output Contract

| Artifact | Description |
|---|---|
| PNG images | 1080×1920 (9:16), exactly one per input segment, with stable file names |
| `slides.manifest.json` | Source topic, output directory, image count, and one slide entry per input segment |

No duplicate slide may be emitted for a segment. The command emits no video,
audio, subtitle, or thumbnail artifact.

### Slide Roles

| Role | Assignment |
|---|---|
| `intro` | First input timeline segment. |
| `content` | Every middle input timeline segment. |
| `ending` | Final input timeline segment. |

### Manifest Schema

```json
{
  "source_timeline": "path/to/timeline.json",
  "topic": "What is Caching?",
  "output_dir": "path/to/output/",
  "image_count": 5,
  "resolution": "1080x1920",
  "slides": [
    {
      "index": 1,
      "file": "01-intro.png",
      "role": "intro",
      "segment_index": 0,
      "template": "title_card",
      "params": {"title": "What is Caching?"},
      "warning": null
    },
    {
      "index": 2,
      "file": "02-content.png",
      "role": "content",
      "segment_index": 1,
      "template": "side_by_side",
      "params": {"left": "chef prep", "right": "chef fumbling"},
      "warning": null
    },
    {
      "index": 3,
      "file": "03-content.png",
      "role": "content",
      "segment_index": 2,
      "template": "code_snippet",
      "params": {"code": "getProfile"},
      "warning": null
    },
    {
      "index": 4,
      "file": "04-content.png",
      "role": "content",
      "segment_index": 3,
      "template": "flowchart",
      "params": {"heading": "Cache hit/miss"},
      "warning": null
    },
    {
      "index": 5,
      "file": "05-ending.png",
      "role": "ending",
      "segment_index": 4,
      "template": "key_takeaways",
      "params": {"heading": "Key takeaways"},
      "warning": null
    }
  ],
  "warnings": []
}
```

### Template Vocabulary

| Template | Keyword triggers (case-insensitive, first match wins) | Key params |
|---|---|---|
| `title_card` | `title`, `intro`, `welcome`, `opening` | `title`, `subtitle` |
| `side_by_side` | `side-by-side`, `side by side`, `comparison`, `vs`, `versus` | `left`, `right`, `caption`, `heading` |
| `code_snippet` | `code`, `snippet`, `python`, `javascript`, `java`, `terminal`, `command` | `code`, `language`, `heading` |
| `diagram` | `diagram`, `architecture`, `overview`, `structure` | `description`, `heading` |
| `flowchart` | `flow`, `flowchart`, `pipeline`, `sequence`, `step` | `steps[]`, `heading` |
| `chart_bar` | `bar chart`, `bars`, `histogram` | `labels[]`, `values[]`, `heading`, `annotation` |
| `chart_line` | `line chart`, `graph`, `trend`, `timeline` | `series[]`, `heading`, `annotation` |
| `split_output` | `split`, `split screen`, `output` | `left`, `right`, `heading` |
| `key_takeaways` | `takeaway`, `key point`, `summary`, `recap` | `heading`, `bullets[]` |
| `fallback_text_card` | _(no match)_ | `text` |

### Text Derivation

1. Use a non-empty `subtitle_text` as the primary slide text.
2. Otherwise, derive concise text from `visual_instruction`.
3. `title_card` uses `topic` as its title and slide text as its subtitle.
4. `key_takeaways` uses slide text as its heading or bullets.

### Visual Defaults

Every template must use the shared theme and safe margins. Type must be bold,
high-contrast, and readable at slideshow viewing size. Code and card layouts
must be scannable. Tiny text is prohibited. Each slide communicates one idea.

### Slide File Naming

- `01-intro.png`
- `02-content.png`
- `03-content.png`
- ...
- `NN-ending.png`

The index is zero-padded to two digits. File ordering and `segment_index` are
identical to input timeline segment ordering.

## Template Examples

### docs/samples/caching/03-timeline.json (5 segments)

| Index | Slide content | Template | Key params |
|---|---|---|---|
| 0 | Title card | `title_card` | `title`: What is Caching? |
| 1 | Chef side-by-side | `side_by_side` | `caption`: Caching is like pre-chopping ingredients |
| 2 | `getProfile` code snippet | `code_snippet` | `code`: getProfile |
| 3 | Cache flowchart | `flowchart` | `heading`: Cache hit/miss |
| 4 | Key takeaways | `key_takeaways` | `heading`: Key takeaways |

### docs/samples/java-garbage-collection/03-timeline.json (6 segments)

| Index | Slide content | Template | Key params |
|---|---|---|---|
| 0 | Sandcastle fallback card | `fallback_text_card` | `text`: sandcastle instruction |
| 1 | JVM STOP diagram | `diagram` | `heading`: JVM STOP |
| 2 | Object-roots fallback card | `fallback_text_card` | `text`: object roots instruction |
| 3 | `MaxGCPauseMillis` snippet | `code_snippet` | `code`: MaxGCPauseMillis |
| 4 | Pause-time line chart | `chart_line` | `heading`: Pause time |
| 5 | Key takeaways | `key_takeaways` | `heading`: Key takeaways |

### docs/samples/china-open-source-models/03-timeline.json (5 segments)

| Index | Slide content | Template | Key params |
|---|---|---|---|
| 0 | Qwen/Llama side-by-side | `side_by_side` | `left`: Qwen, `right`: Llama |
| 1 | Code snippet | `code_snippet` | `code`: model comparison snippet |
| 2 | Split output | `split_output` | `left`: Qwen, `right`: Llama |
| 3 | Cost bar chart | `chart_bar` | `heading`: Cost comparison |
| 4 | Key takeaways | `key_takeaways` | `heading`: Key takeaways |

## Failure Modes

| Failure | Handling |
|---|---|
| Missing required timeline field | Structured error, exit nonzero |
| Segment count below 3 or above 10 | Structured error, exit nonzero |
| Non-contiguous or overlapping `start_s`/`end_s` | Structured error, exit nonzero |
| First `start_s` is not `0.0` | Structured error, exit nonzero |
| `|final_end_s - duration_estimate_s| > 1.0` | Structured error, exit nonzero |
| Headless browser not available | Structured error, exit nonzero |
| Template extraction fails | Emit `fallback_text_card`, add warning to manifest |
| Font or asset missing | Use system fallback, warn in manifest |
| Rasterization fails | Structured error, exit nonzero |
| Temp file cleanup failure | Log warning, exit nonzero |

## Acceptance Criteria

1. `apollo render timeline.json -o output/` produces ordered 1080×1920 PNGs
   and `slides.manifest.json`.
2. The command accepts 3-10 segments and rejects timelines with 1-2 segments.
3. There is exactly one PNG and one manifest `slides[]` entry per input
   timeline segment, with no duplicate slides.
4. Manifest roles are `intro` for the first segment, `content` for each middle
   segment, and `ending` for the last segment.
5. Every segment maps to exactly one template or `fallback_text_card`.
6. All templates use the shared theme, safe margins, bold high-contrast
   readable type, scannable code/cards, no tiny text, and one idea per slide.
7. No video, audio, subtitle file, or thumbnail is generated.
8. Temp files are cleaned up after render.
9. The caching sample produces exactly five slides: title card, chef
   side-by-side, `getProfile` code snippet, cache flowchart, and key
   takeaways.
10. The Java GC sample produces exactly six slides: sandcastle fallback card,
    JVM STOP diagram, object-roots fallback card, `MaxGCPauseMillis` snippet,
    pause-time line chart, and key takeaways.
11. The China models sample produces exactly five slides: Qwen/Llama
    side-by-side, code snippet, split output, cost bar chart, and key
    takeaways.

## Verification

- **Segment-count test:** accept 3 and 10 segments; reject 1, 2, and 11.
- **Template mapping test:** assert the exact five/six/five mappings for the
  three sample timelines.
- **Param extraction test:** assert the caching title, chef caption,
  `getProfile`, and cache hit/miss parameters.
- **CLI smoke test:**
  `apollo render docs/samples/caching/03-timeline.json -o /tmp/test-slides/`
  exits 0 and yields five images.
- **Image dimension check:** every PNG is 1080×1920.
- **Manifest test:** `image_count` equals segment and PNG counts; roles,
  ordering, file names, and `segment_index` are correct; no duplicate slide is
  present.
- **Visual-default test:** rendered templates meet shared-theme, safe-margin,
  high-contrast, no-tiny-text, scannability, and one-idea requirements.
- **Output exclusion test:** no video, audio, subtitle, or thumbnail artifact
  is generated.
- **Cleanup check:** no temp files remain after a successful render.

## Open Questions

None.
