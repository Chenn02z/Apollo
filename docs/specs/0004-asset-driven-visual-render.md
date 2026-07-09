# Spec: Asset-Driven Visual Render

## Status

Accepted

## Goal

Render one canonical 0003 narrated timeline draft JSON into an H.264
MP4 visual draft (1080×1920, 30 fps) with burned-in subtitles and a
`.render.json` manifest — using deterministic, reusable motion-graphics
templates. No LLM in the render path. No frame-by-frame AI video.

## Scenario

```sh
apollo render docs/samples/caching/03-timeline.json -o /tmp/caching-render.mp4
```

The CLI:

1. Validates the timeline JSON fields and timing.
2. Maps each `visual_instruction` to a template via deterministic
   keyword matching.
3. Extracts template parameters from the instruction text.
4. Renders one 1080×1920 RGBA PNG per segment using Pillow and bundled
   asset templates.
5. Generates a temporary SRT from `subtitle_text` / timing and burns it
   into the MP4 via ffmpeg.
6. Encodes the PNG sequence into H.264 MP4 at 30 fps.
7. Muxes `--narration audio.wav` if supplied.
8. Writes `output.render.json` manifest.
9. Cleans up temp files.

## Architecture Reference

`docs/ARCHITECTURE.md`

## Architecture Seams

| Seam | Role |
|---|---|
| Renderer asset seam | **Built in 0004.** Bundled templates and assets consumed by the renderer. |
| Timeline assembly seam | **Honored read-only** (0003 output consumed; no mutation). |
| Narration provider seam | **Honored by optional input only** (`--narration` flag). |
| Subtitle output seam | **Burn-in for visual draft.** Standalone subtitle delivery deferred to 0005. |

## In Scope

- Input contract parsing and validation.
- Deterministic keyword/regex template mapping (no LLM).
- Template parameter extraction via regex/string split.
- Bundled reusable asset/template strategy.
- Scene composition: one 1080×1920 PNG per segment via Pillow.
- Subtitle burn-in from `subtitle_text` via ffmpeg SRT filter.
- Optional audio mux when `--narration` is supplied.
- Render manifest generation.
- Local-first, non-proprietary render stack.

## Out Of Scope

- Frame-by-frame AI video generation.
- LLM or any proprietary API in the render path.
- Standalone subtitle-file export (deferred to 0005).
- Direct publishing adapters.
- Analytics or feedback ingestion.
- Thumbnail generation.
- Final export packaging.
- Longer-form / multi-clip support.
- Narration generation / provider choice.
- Asset authoring GUI.
## Contracts

### Dependencies

- **Pillow**: Python dependency. Used for PNG rendering (ImageDraw,
  ImageFont, Image).
- **ffmpeg**: External tool checked on `PATH`. Used for PNG-to-MP4
  encoding and audio muxing.
- No moviepy, imageio, or OpenCV.

### CLI

```
apollo render <timeline.json | -> [--narration <audio.wav | mp3>] [-o <output.mp4>]
```

- First positional argument: path to timeline JSON, or `-` for stdin.
- `--narration`: optional path to WAV or MP3 audio.
- `-o`: output MP4 path. Default: `output.mp4`.
- Overwrites output files. Uses `-y` for ffmpeg.
- Temp files written to a temp directory; cleaned up in a `finally` block.
- Exit 0 on success, nonzero on validation or render failure.

### Input Contract

Required timeline JSON fields:

| Field | Type | Notes |
|---|---|---|
| `topic` | string | Clip topic |
| `duration_estimate_s` | number | Expected total duration |
| `timeline_segments` | array | Ordered segment objects |
| `timeline_segments[].start_s` | number | Start in seconds |
| `timeline_segments[].end_s` | number | End in seconds |
| `timeline_segments[].visual_instruction` | string | Text for template mapping |
| `timeline_segments[].subtitle_text` | string | Burned into video |
| `timeline_segments[].narration_text` | string | Included in manifest |

Validation rules:

- `timeline_segments` must be non-empty.
- First segment `start_s` must be `0.0`.
- Each segment `start_s` must equal the prior segment's `end_s`
  (contiguous, no gaps or overlaps).
- All timing values must be numeric.
- Final `end_s` must satisfy `|final_end_s - duration_estimate_s| <= 1.0`.
- Optional narration file, if supplied, must be readable WAV or MP3.

### Output Contract

| Artifact | Description |
|---|---|
| MP4 | H.264, 1080×1920 (9:16), 30 fps, one scene per segment, burned subtitles, optional AAC audio at 44100 Hz, duration within 0.1 s of final `end_s` |
| `.render.json` | Manifest (same stem as MP4) |

### Manifest Schema

```json
{
  "source_timeline": "path/to/timeline.json",
  "narration_source": null,
  "output_path": "path/to/output.mp4",
  "duration_s": 70.0,
  "resolution": "1080x1920",
  "codec": "h264",
  "ffmpeg_version": "7.x",
  "segments": [
    {
      "index": 0,
      "start_s": 0.0,
      "end_s": 15.0,
      "visual_instruction": "Title card: ...",
      "template": "title_card",
      "params": {"title": "Example"},
      "warning": null
    }
  ],
  "warnings": []
}
```

`narration_source` is either a path string pointing to the supplied
narration audio file, or `null` when no `--narration` is provided.

### Template Vocabulary

| Template | Keyword triggers (case-insensitive, first match wins) |
|---|---|
| `title_card` | `title card` |
| `key_takeaways` | `key takeaway`, `key takeaways` |
| `code_snippet` | `code snippet` |
| `flowchart` | `flowchart` |
| `chart_bar` | `bar chart` |
| `split_output` | `split screen`, `split output` |
| `side_by_side` | `side-by-side`, `side by side` |
| `diagram` | `diagram` |
| `chart_line` | `line chart`, `graph` |
| `fallback_text_card` | catch-all (no keyword match) |

Matching is case-insensitive. Precedence is top-down: the first
keyword found in `visual_instruction` determines the template.

The `diagram` template is limited to instructions containing the
keyword `diagram`. Complex visual prose that does not include this
keyword falls through to `fallback_text_card`.

### Parameter Extraction

Deterministic regex/string split only. No LLM. The renderer ignores
in-instruction colors and styles unless a template param explicitly
defines labels; theme controls visual styling.

| Template | Extraction rules |
|---|---|
| `title_card` | `title`: first quoted string (single or double quotes), or `topic` field fallback |
| `code_snippet` | `code`: text after the colon in the instruction |
| `diagram` | `description`: full instruction text |
| `flowchart` | `nodes`: split instruction on `->` arrows |
| `chart_bar` | `labels`: split on commas or semicolons; `annotation`: illustrative overlay text |
| `chart_line` | `series`: split on `vs` or `and` |
| `split_output` | `left`: text before `:` or colon-like separator; `right`: text after |
| `side_by_side` | `left`: first half; `right`: second half; `caption`: trailing quoted text if present |
| `key_takeaways` | `heading`: phrase before colon or first sentence; `bullets`: split on commas or periods |
| `fallback_text_card` | `text`: full instruction text |

If extraction fails for any template, emit `fallback_text_card` with a
warning in the manifest.

### Assets Layout

```
repo-root/
  assets/
    templates/
      title_card.json
      key_takeaways.json
      code_snippet.json
      flowchart.json
      chart_bar.json
      chart_line.json
      split_output.json
      side_by_side.json
      diagram.json
      fallback_text_card.json
    primitives/
      theme.json
      fonts/
        <bundled-open-license-font>.ttf
```

- `theme.json`: colors, font sizes, subtitle style, background colors.
- Bundled font: one open-license TTF. If missing, fall back to
  `ImageFont.load_default()` and add a warning to the manifest
  `warnings[]` array.

### Subtitle Contract

- Generate a temporary SRT file from `subtitle_text` and segment
  `start_s` / `end_s`.
- Burn into MP4 via ffmpeg subtitles filter.
- Style derived from `theme.json` (font, size, color).
- Wrap text around 42 characters per line.
- If subtitle text is too long to fit the segment duration, burn anyway
  and emit a warning.
- No standalone subtitle output in this spec.

### Audio Contract

- If `--narration` is omitted: no audio track in MP4.
- If supplied and shorter than timeline duration: pad with silence.
- If supplied and longer than timeline duration: truncate.
- Final MP4 duration always matches the timeline's final `end_s`.
- Warn if audio duration mismatches timeline by more than 0.1 s.

## Fixture Mapping Tables

### docs/samples/caching/03-timeline.json (5 segments)

| Index | visual_instruction | Template | Key params |
|---|---|---|---|
| 0 | `Title card: 'What is Caching?' with a diagram...` | `title_card` | `title`: `What is Caching?` |
| 1 | `Side-by-side comparison: chef prepping...` | `side_by_side` | `left`: chef prepping, `right`: chef fumbling, `caption`: `Caching is like pre-chopping ingredients.` |
| 2 | `Code snippet on screen: function getProfile...` | `code_snippet` | `code`: function body |
| 3 | `Flowchart: Start -> Check Cache? -> Hit?...` | `flowchart` | `nodes`: Start, Check Cache?, Hit?, Yes→Return, No→Query DB→Store→Return |
| 4 | `Text on screen: 'Key Takeaways' with bullet points...` | `key_takeaways` | `heading`: Key Takeaways, `bullets`: 4 items |

### docs/samples/java-garbage-collection/03-timeline.json (6 segments)

| Index | visual_instruction | Template | Key params |
|---|---|---|---|
| 0 | `Animated sandcastle being built, then a giant hand...` | `fallback_text_card` | `text`: full instruction |
| 1 | `Diagram of JVM threads frozen, with a red 'STOP' sign...` | `diagram` | `description`: full instruction |
| 2 | `Web of objects with roots, live objects in green...` | `fallback_text_card` | `text`: full instruction |
| 3 | `Code snippet: -XX:MaxGCPauseMillis=200...` | `code_snippet` | `code`: `-XX:MaxGCPauseMillis=200, with G1 heap regions shown as colored squares` |
| 4 | `Graph comparing pause times: default vs. tuned G1GC...` | `chart_line` | `series`: default vs. tuned G1GC |
| 5 | `Text overlay: 'Key Takeaway: Stop-the-world...` | `key_takeaways` | `heading`: Key Takeaway, `bullets`: 3 items |

### docs/samples/china-open-source-models/03-timeline.json (5 segments)

| Index | visual_instruction | Template | Key params |
|---|---|---|---|
| 0 | `Side-by-side model comparison cards: Qwen 2.5 7B vs...` | `side_by_side` | `left`: Qwen 2.5 7B, `right`: Llama 3 8B |
| 1 | `Python code snippet showing loading two...` | `code_snippet` | `code`: pipeline loading snippet |
| 2 | `Split screen: left shows Qwen output... right shows Llama...` | `split_output` | `left`: Qwen output, `right`: Llama output |
| 3 | `Bar chart comparing inference cost...` | `chart_bar` | `labels`: Qwen, Llama; `annotation`: 4x cost reduction |
| 4 | `Key takeaways slide: 'Chinese open-source...'` | `key_takeaways` | `heading`: Chinese open-source, `bullets`: 3 items |

## Failure Modes

| Failure | Handling |
|---|---|
| Missing required timeline field | Structured error, exit nonzero |
| Non-contiguous or overlapping `start_s`/`end_s` | Structured error, exit nonzero |
| First `start_s` ≠ 0.0 | Structured error, exit nonzero |
| `|final_end_s - duration_estimate_s| > 1.0` | Structured error, exit nonzero |
| Empty `timeline_segments` | Structured error, exit nonzero |
| ffmpeg not on PATH | Structured error, exit nonzero |
| Pillow not installed | Structured error, exit nonzero |
| Unreadable narration file | Structured error, exit nonzero |
| Narration file format not WAV/MP3 | Structured error, exit nonzero |
| Template extraction fails | Emit `fallback_text_card`, add warning to manifest |
| Bundled font missing | Use `ImageFont.load_default()`, warn in manifest |
| Subtitle text too long for segment | Burn anyway, warn in manifest |
| Narration audio shorter than timeline | Pad silence, warn if mismatch > 0.1 s |
| Narration audio longer than timeline | Truncate, warn if mismatch > 0.1 s |
| ffmpeg encode failure | Structured error, exit nonzero |
| Temp file cleanup failure | Log warning, exit nonzero |

## Acceptance Criteria

1. `apollo render timeline.json -o output.mp4` exits 0 and produces a
   playable H.264 MP4 at 1080×1920, 30 fps.
2. `ffprobe` confirms: resolution 1080×1920, codec h264, duration
   within 0.1 s of the final segment's `end_s`.
3. Every segment maps to exactly one template or `fallback_text_card`.
4. Subtitles are burned into the MP4 for every segment.
5. When `--narration` is supplied, AAC audio at 44100 Hz is present;
   when omitted, no audio track exists.
6. Manifest JSON is written with one entry per segment, correct
   timing, template name, params, and source path.
7. No LLM or proprietary API is invoked in the render path.
8. No moviepy, imageio, or OpenCV dependency.
9. Temp files are cleaned up after render (no orphaned artifacts).
10. `docs/samples/caching/03-timeline.json` renders without errors and
    manifest contains 5 segments with correct template assignments.
11. `docs/samples/java-garbage-collection/03-timeline.json` renders
    with 6 segments: segments 0 and 2 use `fallback_text_card`
    (no keyword match), segment 1 uses `diagram`, segment 3 uses
    `code_snippet`, segment 4 uses `chart_line`, and segment 5 uses
    `key_takeaways`.
12. `docs/samples/china-open-source-models/03-timeline.json` renders
    with 5 segments and correct template assignments.

## Verification

- **Template mapping unit test**: assert each of the three sample
  timelines maps all segments to expected templates.
- **Param extraction unit test**: assert extracted params for title,
  code, flowchart, diagram, chart_bar, chart_line, split_output,
  side_by_side, key_takeaways, and fallback.
- **CLI smoke test**:
  `apollo render docs/samples/caching/03-timeline.json -o /tmp/test.mp4`
  exits 0.
- **ffprobe check**:
  `ffprobe -v error -show_entries stream=codec_name,width,height
  -show_entries format=duration -of json /tmp/test.mp4` confirms
  h264, 1080×1920, duration ≈ final `end_s`.
- **Manifest test**: parsed `.render.json` has correct segment count,
  timing, and no unexpected warnings.
- **No-audio test**: render without `--narration`, verify no audio
  stream in ffprobe output.
- **With-audio test**: render with `--narration`, verify AAC stream
  present and duration matches.
- **Dependency check**: `import PIL` and `ffmpeg -version` both
  succeed.
- **Cleanup check**: no temp files remain after a successful render.

## Open Questions

None.
