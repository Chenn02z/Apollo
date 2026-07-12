# Architecture

Documents the current intended structure, approved seams, and explicitly
deferred architecture for the first local clip-production pipeline. Keep this
lightweight: the seams exist to protect the MVP boundary, not to pre-build a
platform.

## Current Structure

The current product shape should stay close to the MVP production loop:

1. `concept ideation`: accepts a vague `concept` and produces ranked concrete
   video topics via the Concept Ideation Agent (0001).
2. `topic intake`: accepts a single `{topic, angle}` JSON object (from
   ideation via the pipe adapter or direct CLI input) and resolves a run contract.
3. `research and script generation`: turns the topic into a short-form teaching
   angle, script, and supporting content plan via the Script Agent (0002).
4. `storyboard and timeline drafting`: converts the authoritative script
   package into the canonical pre-render `narrated timeline draft` with
   authoritative ordering, visual instructions, and slide-text-ready fields
   consumed by 0004.
5. `slide text derivation`: derives slide text from timeline segment fields for
   use by the renderer.
6. `asset-driven renderer`: renders deterministic HTML/CSS templates into
   1080x1920 PNG slideshow images against the narrated timeline draft.
7. `export packaging`: emits the slideshow image set, manifest, and optional
   caption metadata for manual TikTok upload.

This is an aspirational component map for the MVP, not a commitment to a large
module tree or framework.

## Approved Seams

- **Concept intake contract**
  - **What**: a boundary that accepts a vague `concept` string and produces
    one or more concrete video topics (configurable via `ideation.topic_count`,
    defaulting to 1) before the topic intake stage.
  - **Why**: allows concept-driven ideation to exist as an optional upstream
    stage without coupling it to topic intake or script generation.
  - **Current path**: the MVP supports concept as an alternative starting
    point; topic-only direct input remains the primary intake. The pipe adapter
    feeds exactly one topic (top-ranked) from ideation into script generation.

- **Topic intake contract**
  - **What**: a narrow run-input boundary that consumes a `{topic, angle}` JSON
    object and can grow later without breaking the caller shape.
  - **Why**: preserves the topic-only MVP while leaving room for optional seed
    links later. The `angle` field is an optional seed hint from ideation that
    the script agent may refine or replace.
  - **Current path**: MVP intake accepts a single `{topic, angle}` object from
    ideation output (via the pipe adapter) or direct CLI input.

- **Research input seam**
  - **What**: a source-material hook between topic intake and script
    generation.
  - **Why**: future source seeding (seed-link grounding) can slot in without
    rewriting downstream script or timeline stages.
  - **Current path**: the MVP operates without seeded links or external source
    packages. The Script Agent (0002) performs lightweight internal knowledge
    synthesis as part of its single LLM call.

- **Timeline assembly seam**
  - **What**: a structured intermediate representation between script output
    and rendering.
  - **Why**: keeps script, slide text, and scene composition aligned through
    one timeline contract.
  - **Current path**: 0003 emits the canonical `narrated timeline draft`
    before 0004 visual rendering. Its
    `timeline_segments.start_s` and `end_s` fields use numeric seconds, with
    fractional precision allowed, and downstream stages must treat that timing
    as authoritative rather than silently drifting. The LLM (0003 model)
    produces segment text and timing; the CLI deterministically copies each
    `visual_beats[i].description` into the corresponding segment's
    `visual_instruction` field — 0003 does not paraphrase or regenerate it.
    0004 consumes this output read-only; `start_s`, `end_s`, and
    `visual_instruction` are the authoritative fields downstream.

- **Renderer asset seam**
  - **What**: a boundary between timeline instructions and reusable HTML/CSS
    templates.
  - **Why**: supports cheap polish and deterministic output without coupling
    the pipeline to one-off scene logic.
  - **Current path**: 0004 renders deterministic HTML/CSS templates to 1080x1920
    PNG slideshow images via a headless browser. Template mapping from
    `visual_instruction` to the template vocabulary uses `fallback_text_card`
    for unmatched text, with no LLM in the render path. `visual_instruction` is
    the segment-level key for the asset lookup. Inputs contain 3-10 segments;
    the renderer emits exactly one PNG and one manifest entry per segment,
    assigning the first `intro`, every middle `content`, and the last `ending`,
    with no duplicated intro or ending slides.

- **Narration provider seam**
  - **What**: a deferred provider boundary for possible future voice generation.
  - **Why**: keeps optional audio experiments out of the slideshow-image MVP.
  - **Current path**: no audio output in the MVP. 0004 does not accept or
    generate narration audio.

- **Subtitle output seam**
  - **What**: a boundary for how subtitle text reaches the final output.
  - **Why**: preserves platform-specific delivery options later without
    changing timing generation.
  - **Current path**: 0004 derives slide text from `subtitle_text` (preferred)
    or `visual_instruction` (fallback) without requiring a new 0003 field.
    No subtitle burn-in, no subtitle file output. Caption metadata and upload
    notes deferred to 0005.

- **Publishing adapter seam**
  - **What**: a post-export handoff boundary for future platform integrations.
  - **Why**: keeps social posting deferred without forcing the export format to
    change later.
  - **Current path**: no direct posting in the MVP.

- **Feedback ingestion seam**
  - **What**: a boundary after export for future performance data or creator
    feedback inputs.
  - **Why**: later analytics and iteration loops can attach without disturbing
    clip generation stages.
  - **Current path**: no analytics or feedback ingestion in the MVP.

## Deferred Architecture

- **Seed-link grounding**
  - Deferred to post-MVP.
  - Left-open seam: research input seam.

- **Direct social publishing**
  - Deferred to post-MVP.
  - Left-open seam: publishing adapter seam.

- **Analytics and feedback ingestion**
  - Deferred to post-MVP.
  - Left-open seam: feedback ingestion seam.

- **Longer-form and multi-clip production**
  - Deferred until the single-clip short-form loop is stable.
  - Left-open seam: timeline assembly seam.

- **Broader topic families and channel-specific variants**
  - Deferred until the base technical-education workflow is proven.
  - Left-open seam: topic intake contract plus renderer asset seam.
