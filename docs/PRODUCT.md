# Product Backbone

## Product Intent

This workspace supports a local-first content production tool for one creator:
the repo owner. The product exists to turn a single topic into one
TikTok-ready short-form technical education clip that can support the owner's
TikTok and YouTube monetization path.

The first product is an internal creator tool, not a general SaaS platform and
not a publishing system. It should automate the production loop end-to-end
without requiring human editing inside the pipeline.

## First User

- Solo creator: the repo owner.
- Use case: produce short-form technical education content for personal
  channels.
- Business context: internal leverage first, broader productization deferred.

## MVP Boundary

The MVP is one local pipeline that takes `topic` as its only required input and
produces one exported short-form clip package containing:

- 3-10 ordered 1080x1920 PNG slideshow images (intro, content, ending)
- a manifest with slide roles, templates, and metadata
- optional caption notes for manual TikTok slideshow upload
- no video, no audio, no subtitle files

Renderer invariant: the input contains 3-10 segments; it produces exactly one
1080x1920 PNG and one manifest entry per segment, with the first slide `intro`,
each middle slide `content`, and the last slide `ending`—with no duplicated
intro or ending slides.

The pipeline may accept a `concept` as an alternative starting point, using
the Concept Ideation Agent (0001) to produce concrete topics that feed the
downstream stages.

The MVP explicitly excludes:

- thumbnail generation
- direct posting to TikTok, YouTube, or other platforms
- human editing as a required production step
- seed-link or source-URL input
- multi-clip planning or long-form repurposing
- creator collaboration, account management, or audience analytics

## Operating Constraints

- First surface: local CLI.
- First environment: 24 GB RAM Mac with Docker available.
- Core production must avoid proprietary editing software dependencies.
- Cheap, non-sloppy output matters more than maximal generative novelty.
- Prefer deterministic HTML/CSS templates rasterized to images over
  frame-by-frame AI video or video encoding.
- Prefer AI-assisted writing and planning over generative visual output.
- Favor local slide rendering and deterministic packaging when practical to keep
  variable API cost low.

## Product Principles

- **Topic-only intake first**: the MVP proves the end-to-end loop with the
  smallest stable input contract.
- **One finished clip beats a flexible platform shell**: ship a complete local
  production path before adding source seeding, publishing, or analytics.
- **Cheap polish over flashy slop**: visuals, pacing, and slide-to-slide
  rhythm should feel intentional even when the pipeline is cost-constrained.
- **Deterministic assets over speculative generation**: reusable templates and
  asset-driven composition are preferred where they improve consistency.
- **Local-first operations**: core rendering should remain runnable on the
  creator's machine.
- **Architecture follows the MVP boundary**: leave only the seams needed to
  support clearly deferred work later.

## Success Metrics

For the short-form MVP, success means:

- under 5 minutes of human input per clip
- local runtime target under 10 minutes for one slideshow image set, if feasible
  on the initial machine
- low variable API cost ceiling, with local production steps favored where
  practical
- one exported slideshow image set that is usable for manual TikTok upload

## Roadmap Backbone

1. Prove concept ideation: accept a vague concept and produce ranked concrete video topics (0001).
2. Prove script generation: accept a concrete topic and produce a production-ready script package (0002).
3. Assemble a structured timeline draft with visual instructions and
   slide-text-ready fields from the generated plan.
4. Replace placeholder visuals with deterministic HTML/CSS slideshow images
   rendered from the narrated timeline draft.
5. Export a TikTok-ready slideshow image set locally with no direct posting.
6. Expand only after the MVP loop is stable: grounded source seeding,
   publishing adapters, feedback loops, and broader content families.

## Non-Goals For Now

- direct social publishing
- proprietary editing software in the core pipeline
- generic multi-user product workflows
- broader creator operating system features
- long-form-first video production
- fully autonomous topic ideation or channel strategy management
