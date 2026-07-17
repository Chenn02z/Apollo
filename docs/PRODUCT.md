# Apollo Product

## Product Intent

Apollo is a Codex-native staged workflow that turns a technical topic into an
adaptive 7–10-slide, interview-oriented PNG carousel. It gives a
technical-content creator a repeatable way to produce clear, consistently
themed educational slides without manually editing HTML.

## Target User And Pain

The initial user is a creator producing technical interview-preparation
content. They need concise, accurate-enough-for-manual-review slides with
consistent visual presentation; composing each carousel by hand is slow and
visually inconsistent.

## MVP Boundary

The workflow lets the `apollo-generate` Codex skill receive a topic and create
`request.json` and `carousel-content.json`, with versioned, evidence-backed,
non-blocking review artifacts. An `approve_with_warnings` or `reject` review
can trigger up to two candidate rewrites by the content writer.
Initial content and each candidate get up to three writer attempts; each
validated candidate is promoted and followed by another review (three reviews
total). Validation removes an invalid selected artifact, while an unavailable
or invalid review ends that loop without blocking the run.
`apollo-render` validates content, prepares an external protected-boundary
snapshot, invokes `carousel-art-director` exactly once to create
`carousel-layout.json`, validates the plan and boundary, then invokes
`carousel-composer` to write exact `slide-bodies/` fragments. Deterministic
code binds escaped content into one fixed database shell, verifies reserved-body
containment in Playwright, and atomically publishes fragments, `index.html`,
one 1080×1350 PNG per content slide in `slides/`, and `render-manifest.json`
last.

The validated content artifact alone selects 7–10 slides. The workflow uses a
custom-agent content pass with at most two review-driven rewrites, followed by
deterministic rendering, with no formal source/citation workflow.
HTML uses only the
approved local `database` theme assets and templates; it has no scripts,
network access, or external assets. Playwright captures slides and
deterministic validation checks structure, overflow, dimensions, export, and
manifest data before publication. Apollo has no standalone LLM API client or
runtime API key.

## Product Principles

- **Codex-native stages.** Skills enter the workflow and custom agents perform
  bounded work; Playwright owns deterministic image production.
- **Meaning before pixels.** A writer and reviewer create validated structured
  content; the art director produces a validated carousel-wide layout plan;
  the composer writes constrained fragments; deterministic local tooling binds
  layout-neutral semantic units without changing their teaching content.
- **One idea per slide.** Keep technical explanations concise, diagram-led,
  and suitable for a phone screen.
- **One visual identity first.** The reference-derived `database` theme pack
  and `database-blueprint` archive retain a single selected template
  per carousel while allowing distinct planned body layouts.
- **Inspectable local output.** Every run leaves its input, content, HTML,
  images, and manifest together.
- **Reference-derived assets, not raw reuse.**
  `docs/reference/html/index.html` informs the `database` theme pack but is not
  raw runtime output.

## Explicit Post-MVP Cutoff

- unbounded retry or repair loops
- generated image assets, an AI theme, a theme taxonomy or plugin system, and
  caching
- analytics, web UI, authentication, and hosted workflows

## Success Metric

The five proof topics render adaptive 7–10-slide PNG carousels at the required
dimensions with no deterministic overflow failures and no manual HTML editing.

## Milestone Ladder

1. `0001-adaptive-carousel-content` — Verified: writer, reviewer, bounded
   revisions, and validated adaptive 7–10-slide content artifacts.
2. `0002-deterministic-fixed-shell-rendering-baseline` — Verified: historical
   six-variant shell, deterministic validation, PNG export, and atomic
   publication baseline.
3. `0003-template-archive-and-carousel-art-direction` — Verified:
   `database-blueprint` archive, closed spatial art direction, and validated
   `carousel-layout.json` plans.
4. `0004-constrained-slide-composition` — Verified: layout-neutral semantic
   content, validated constrained body fragments, locked deterministic shell
   assembly, and export integration.

Research/citations, visual review/repair, and publishing/scheduling are
deferred roadmap ideas, not active milestones.
