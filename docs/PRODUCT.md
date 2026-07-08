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

- narrated 60-90 second technical education video
- burned or bundled subtitles
- thumbnail
- final export suitable for TikTok delivery

The pipeline may accept a `concept` as an alternative starting point, using
the Concept Ideation Agent (0001) to produce concrete topics that feed the
downstream stages.

The MVP explicitly excludes:

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
- Prefer deterministic rendering and reusable motion-graphics assets over
  frame-by-frame AI video generation.
- Prefer AI-assisted writing and planning over AI-generated full-motion video.
- Favor local rendering, local subtitles, and local or low-cost narration when
  practical to keep variable API cost low.

## Product Principles

- **Topic-only intake first**: the MVP proves the end-to-end loop with the
  smallest stable input contract.
- **One finished clip beats a flexible platform shell**: ship a complete local
  production path before adding source seeding, publishing, or analytics.
- **Cheap polish over flashy slop**: motion, visuals, and pacing should feel
  intentional even when the pipeline is cost-constrained.
- **Deterministic assets over speculative generation**: reusable templates and
  asset-driven composition are preferred where they improve consistency.
- **Local-first operations**: core rendering should remain runnable on the
  creator's machine.
- **Architecture follows the MVP boundary**: leave only the seams needed to
  support clearly deferred work later.

## Success Metrics

For the short-form MVP, success means:

- under 5 minutes of human input per clip
- local runtime target under 10 minutes for one 60-90 second clip, if feasible
  on the initial machine
- low variable API cost ceiling, with local production steps favored where
  practical
- one exported clip package that is usable without a manual editing pass

## Roadmap Backbone

1. Prove concept ideation: accept a vague concept and produce ranked concrete video topics (0001).
2. Prove script generation: accept a concrete topic and produce a production-ready script package (0002).
3. Assemble a timed narrated draft with subtitle-ready timing and text from
   the generated plan.
4. Replace placeholder visuals with asset-driven motion graphics from the
   narrated timeline draft.
5. Export a complete TikTok-ready clip package locally with no direct posting.
6. Expand only after the MVP loop is stable: grounded source seeding,
   publishing adapters, feedback loops, and broader content families.

## Non-Goals For Now

- direct social publishing
- proprietary editing software in the core pipeline
- generic multi-user product workflows
- broader creator operating system features
- long-form-first video production
- fully autonomous topic ideation or channel strategy management
