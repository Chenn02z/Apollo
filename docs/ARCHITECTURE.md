# Architecture

Documents the current intended structure, approved seams, and explicitly
deferred architecture for the first local clip-production pipeline. Keep this
lightweight: the seams exist to protect the MVP boundary, not to pre-build a
platform.

## Current Structure

The current product shape should stay close to the MVP production loop:

1. `topic intake`: accepts the topic-only CLI input and resolves a run
   contract.
2. `research and script drafting`: turns the topic into a short-form teaching
   angle, script package, and supporting content plan.
3. `storyboard and timeline assembly`: converts the script into timed visual
   beats, subtitle segments, and render instructions.
4. `asset-driven renderer`: composes reusable motion-graphics assets and
   deterministic layouts into video scenes.
5. `narration and subtitle generation`: produces voiceover audio and subtitle
   data aligned to the timeline.
6. `export packaging`: emits the final video, thumbnail, and any delivery
   metadata needed for manual upload.

This is an aspirational component map for the MVP, not a commitment to a large
module tree or framework.

## Approved Seams

- **Topic intake contract**
  - **What**: a narrow run-input boundary that requires `topic` and can grow
    later without breaking the caller shape.
  - **Why**: preserves the topic-only MVP while leaving room for optional seed
    links later.
  - **Current path**: MVP intake should treat topic as the only required field.

- **Research input seam**
  - **What**: a source-material hook between topic intake and script
    generation.
  - **Why**: future source seeding can slot in without rewriting downstream
    script or timeline stages.
  - **Current path**: the MVP operates without seeded links or external source
    packages.

- **Drafting provider seam**
  - **What**: a provider boundary around hosted script-package drafting.
  - **Why**: preserves flexibility in hosted drafting choice without changing
    the public CLI or script-package artifact contract.
  - **Current path**: milestone `0002` begins with OpenRouter-backed drafting
    while preserving provider-neutral downstream handoffs.

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
