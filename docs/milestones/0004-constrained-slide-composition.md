# Milestone: Constrained Slide Composition

## Status

Verified

## Goal

Compose varied slide bodies by recombining a closed, repository-owned
HTML/SVG primitive vocabulary while keeping the shell, safety boundaries, and
screenshot export deterministic.

## MVP Deliverable

A valid 7–10-slide run produces exactly `slide-bodies/01.html` through
`slide-bodies/NN.html`: regular files, one deterministic validated-content
binding per slide, assembled into the fixed repository-owned shell and exported
with the existing PNG and manifest safeguards.

## Scope Boundary

- Add `carousel-composer`, invoked by `apollo-render`, whose sole runtime write
  is the exact numbered fragment set under `runs/<run-id>/slide-bodies/`.
- The composer may make novel body arrangements; it does not choose from
  predefined complete slide layouts. It may only recombine the finite
  repository-owned, validated HTML/SVG primitives, classes, and
  `carousel-content.json`/`carousel-layout.json` values.
- The primitive vocabulary must support grid, stack, row, split, cluster,
  center, and flow layout; approved spacing scales and column spans; structured
  text and code; and safe local SVG diagrams, including sequences, timelines,
  comparisons, annotations, connectors, and nodes.
- Composition controls hierarchy, grouping, reading path, whitespace, relative
  emphasis, diagram structure, and symmetric or asymmetric arrangement. It
  cannot invent or alter teaching content, CSS, templates, shell/chrome,
  header/footer, scripts, IDs, URLs, arbitrary classes, inline styles, or
  external assets.
- Replace the legacy visual `variant` field with a layout-neutral slide payload:
  `number`, `role`, `title`, `why`, `glossary`, and a closed `content` object.
  `content.type` is one of `statement`, `collection`, `comparison`, `sequence`,
  `example`, or `checklist`; each type carries its complete semantic units (for
  example, labeled comparison sides, ordered sequence steps, or peer collection
  items). The composer may rearrange and emphasize those units but cannot
  paraphrase, invent, or drop them.
- Deterministic code owns content binding, fragment validation, fixed-shell
  assembly, chrome, export, and browser-derived reserved-body containment;
  overflow or clipping is rejected rather than hidden.
- The carousel plan must vary sparse, standard, and dense compositions as
  planned; prefer no repeated dominant DOM arrangement on adjacent slides and
  no dominant arrangement more than twice; avoid card or equal-column
  monoculture; and use diagram- or flow-led bodies for process, interaction, or
  failure-sequence explanations while retaining a coherent template language.
  Deterministic validation emits a warning or review signal, not a render
  rejection, when a preferred repetition limit is exceeded. A repeated
  arrangement beyond that limit requires the optional per-slide
  `repeatJustification` layout-plan field; its presence documents the reason
  without blocking an otherwise safe render or export.
- Invalid director or composer output fails without retry or repair and leaves
  prior complete render artifacts intact. Protected-write snapshots prevent
  unauthorized writes. New content rejects legacy `variant` fields; no archival
  compatibility renderer is added.

## Verified Handoff

Implemented and verified by
[`0004-constrained-slide-composition.md`](../specs/0004-constrained-slide-composition.md).
The live renderer writes exact run-local `slide-bodies/` fragments, binds them
into one fixed shell, checks reserved-body containment, and publishes the four
renderer artifacts atomically with the manifest last.
