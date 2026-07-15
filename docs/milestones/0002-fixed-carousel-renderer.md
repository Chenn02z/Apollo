# Milestone: Constrained HTML Generation And PNG Export

## Status

Draft

## Goal

Use a future Codex-native HTML/render worker to turn approved seven-slide
content artifacts into constrained HTML using one repository-owned 1080×1350
`database` theme pack, then export local PNGs through Playwright.

## MVP Deliverable

A creator receives repository-owned visual assets/templates, a constrained
agent-authored `index.html`, seven PNG slides, and `render-manifest.json` from
a valid content artifact without manual HTML editing.

## In Scope

- Repository-owned visual assets and templates derived from
  `docs/reference/html/index.html` as one local 1080×1350 `database` theme
  pack. The reference remains source material, not raw runtime output.
- One Codex custom HTML/render worker stage after the content artifact is
  available; it is entered by a future Codex skill, not a shell CLI or direct
  LLM API client.
- A constrained HTML output contract: exactly seven sequential identifiable
  slides; approved local theme assets only; no network, scripts, or external
  assets.
- Node + Playwright local screenshot export plus HTML, PNG, and manifest output
  in the run directory.

## Out Of Scope

- An AI theme, theme taxonomy or plugin system, retries, generated imagery,
  vision review, and publishing.

## Architecture Seams

- Implement the content/HTML, theme/HTML, and HTML/export boundaries in
  `docs/ARCHITECTURE.md` without a theme plugin framework.

## Acceptance Criteria

- The HTML-generation agent produces exactly seven sequential identifiable
  slides using approved local `database` theme assets only, with no scripts,
  network access, or external assets.
- Each generated slide is 1080×1350 pixels when rendered.
- A valid seven-slide artifact renders seven consistently themed PNG files via
  Playwright.
- The manifest identifies the rendered run and slide count.

## Verification

- Targeted HTML/export tests plus a manual visual check against the
  reference-derived `database` theme direction.

## Deferred

- Overflow enforcement and the five-topic proof set move to milestone 0003.

## Open Questions

- Exact project-local Node/package commands.
