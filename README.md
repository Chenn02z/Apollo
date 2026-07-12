# Autonomous Clip Production Workspace

Local-first workspace for building an autonomous content production tool for
one creator. The product goal is narrow: take a single `topic` and produce one
TikTok-ready short-form technical education clip package.

This repo is the product workspace, not a generic harness template. It holds
the product docs, milestone ladder, agent workflow rules, and the code that
will implement the pipeline.

## MVP Boundary

The MVP is one local pipeline with `topic` as the only required input. It
should export one TikTok-ready slideshow image set containing:

- 3-10 ordered 1080x1920 PNG images (intro, content, ending)
- a manifest with slide roles, templates, and metadata
- optional caption notes for manual TikTok slideshow upload

Renderer invariant: the input contains 3-10 segments; it produces exactly one
1080x1920 PNG and one manifest entry per segment, with the first slide `intro`,
each middle slide `content`, and the last slide `ending`—with no duplicated
intro or ending slides.

No video. No audio. No subtitle files.

The MVP does not include:

- thumbnail generation
- direct posting to TikTok, YouTube, or other platforms
- analytics, audience feedback loops, or channel strategy tooling
- required human editing inside the production pipeline
- multi-user workflows or broader creator-platform features

## Current Constraints

- First surface: local CLI on the creator's machine
- First target machine: 24 GB RAM Mac
- Docker is available
- Core production must avoid proprietary editing software
- The quality bar is cheap polish, not flashy full-motion AI video
- Prefer deterministic HTML/CSS templates rasterized to images over
  frame-by-frame generation or video encoding

## Workflow

This workspace uses a milestone-driven build loop:

1. Shape or refine a milestone in `docs/milestones/`.
2. Convert an accepted milestone into an implementation spec in `docs/specs/`.
3. Implement through the repo's agent workflow in `AGENTS.md`.
4. Verify the scoped behavior before calling the work done.
5. Run context alignment when terminology, boundaries, or workflow decisions
   settle.

Key docs:

- `docs/PRODUCT.md` for product intent, constraints, and roadmap
- `docs/CONTEXT.md` for canonical terminology and workflow boundaries
- `docs/ARCHITECTURE.md` for approved seams and deferred structure
- `docs/WORKFLOWS.md` for handoff and status contracts

## Repository Layout

```text
.
├── AGENTS.md
├── user-journeys.html
├── .agents/skills/
├── .codex/agents/
└── docs/
    ├── ARCHITECTURE.md
    ├── PRODUCT.md
    ├── CONTEXT.md
    ├── WORKFLOWS.md
    ├── AGENT_ROLES.md
    ├── DOCS_POLICY.md
    ├── milestones/
    └── specs/
```
