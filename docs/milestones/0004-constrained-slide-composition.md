# Milestone: Constrained Slide Composition

## Status

Draft

## Goal

Compose distinct slide bodies from approved template primitives while keeping
the shell, safety boundaries, and screenshot export deterministic.

## Proposed Deliverable

- Add `carousel-composer`, invoked by `apollo-render`, to write only
  `runs/<run-id>/slide-bodies/<nn>.html`.
- Validate allowed tags, attributes, classes, URLs, inline styles, event
  handlers, and local SVG before deterministic fixed-shell assembly.
- Retain browser-layout, network-blocking, PNG, and atomic-manifest safeguards.
- Invalid art-director or composer output fails with actionable diagnostics;
  there is no automatic retry or repair loop.

## Boundary

The composer cannot change validated content, template CSS, header/footer,
shell, scripts, or external resources. Remove current closed variants only
after this milestone is Verified; archival runs need no compatibility renderer.

