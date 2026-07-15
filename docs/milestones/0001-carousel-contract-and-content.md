# Milestone: Carousel Contract and Content

## Status

Draft

## Goal

Define the local `apollo generate "<topic>"` request and produce a bounded,
seven-slide `carousel-content.json` artifact suitable for deterministic
rendering.

## MVP Deliverable

A creator can invoke the CLI for a topic and inspect a request artifact plus
seven-slide content artifact without hand-authoring slide copy.

## In Scope

- CLI topic input and a local run directory.
- Request and content artifact contracts.
- Content limits that preserve one primary idea per slide.

## Out Of Scope

- HTML, PNG rendering, citations, research agents, and visual review.

## Architecture Seams

- Establish the content/render artifact boundary described in
  `docs/ARCHITECTURE.md`.

## Acceptance Criteria

- A topic produces valid request and seven-slide content artifacts.
- Each slide follows the agreed content limits and has a defined layout-ready
  role.

## Verification

- Automated artifact-schema checks.
- Manual inspection of one representative topic.

## Deferred

- Rendering and image validation move to later MVP milestones.

## Open Questions

- Content model/provider configuration and exact schema constraints.
