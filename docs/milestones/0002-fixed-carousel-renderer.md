# Milestone: Fixed Carousel Renderer

## Status

Draft

## Goal

Render approved seven-slide content artifacts with one fixed theme and seven
fixed 1080×1350 layouts, exporting local PNGs through Playwright.

## MVP Deliverable

A creator receives `index.html`, seven PNG slides, and `render-manifest.json`
from a valid content artifact without manual HTML editing.

## In Scope

- Node + Playwright local renderer.
- One fixed theme and exactly seven MVP layouts.
- HTML, PNG, and manifest output in the run directory.

## Out Of Scope

- Additional themes/layouts, generated imagery, visual agents, and publishing.

## Architecture Seams

- Implement the content/render and renderer/layout boundaries in
  `docs/ARCHITECTURE.md` without a plugin framework.

## Acceptance Criteria

- Each generated slide is 1080×1350 pixels.
- A valid seven-slide artifact renders seven consistently themed PNG files.
- The manifest identifies the rendered run and slide count.

## Verification

- Targeted renderer tests plus a manual visual check against the reference
  direction.

## Deferred

- Overflow enforcement and the five-topic proof set move to milestone 0003.

## Open Questions

- Exact project-local Node/package commands.
