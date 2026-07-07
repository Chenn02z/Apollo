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
4. `storyboard and timeline assembly`: converts the script into timed visual
   beats, subtitle segments, and render instructions.
5. `asset-driven renderer`: composes reusable motion-graphics assets and
   deterministic layouts into video scenes.
6. `narration and subtitle generation`: produces voiceover audio and subtitle
   data aligned to the timeline.
7. `export packaging`: emits the final video, thumbnail, and any delivery
   metadata needed for manual upload.

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
  - **Why**: keeps narration, subtitles, thumbnails, and scene composition
    aligned through one timeline contract.
  - **Current path**: one local clip pipeline targeting 60-90 second exports.

- **Renderer asset seam**
  - **What**: a boundary between timeline instructions and reusable visual
    assets/templates.
  - **Why**: supports cheap polish and deterministic output without coupling
    the pipeline to one-off scene logic.
  - **Current path**: visuals should favor reusable motion-graphics assets over
    frame-by-frame AI video generation.

- **Narration provider seam**
  - **What**: a provider boundary for voice generation.
  - **Why**: preserves flexibility between local and low-cost hosted narration
    approaches without affecting export packaging.
  - **Current path**: the MVP should favor local or low-variable-cost narration
    where practical.

- **Subtitle output seam**
  - **What**: a boundary that allows subtitles to be rendered into the video or
    shipped alongside it from the same timing source.
  - **Why**: preserves platform-specific delivery options later without
    changing timing generation.
  - **Current path**: subtitles are part of the MVP clip package.

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
