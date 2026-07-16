# Milestone: Fixed Carousel Renderer

## Status

Verified

## Goal

Turn one validated v1 content artifact into a fixed, local seven-slide HTML
carousel and PNG export without manual HTML editing.

## MVP Deliverable

For a valid `runs/<run-id>/carousel-content.json`, `apollo-render` produces
`index.html`, `slides/slide-01.png` through `slides/slide-07.png`, and a
success `render-manifest.json` in that run directory.

## In Scope

- A Codex-native `apollo-render` skill that validates the v1 content artifact
  before delegating once to `carousel-renderer`.
- One `carousel-renderer` agent that writes only `index.html` using the local,
  reference-derived `database` theme and vendored local font files.
- A fixed HTML contract: seven ordered 1080×1350 roots with
  `data-slide="1"` through `data-slide="7"`; inline CSS is allowed.
- Static HTML scanning and Playwright export with all routes aborted.
- Local Node/npm and Playwright setup, with `package-lock.json` committed.
- A success manifest containing its version, run ID, source content version,
  1080×1350 dimensions, ordered artifact paths, and slide count.

## Out Of Scope

- Theme selection, theme plugins, remote or generated assets, retries,
  repair, visual review, overflow validation, publishing, and a shell CLI.

## Contracts And Failure Behavior

- `apollo-render` accepts only a valid v1 `carousel-content.json` at
  `runs/<run-id>/carousel-content.json`. Invalid input fails before delegation.
- `carousel-renderer` writes only `runs/<run-id>/index.html`; deterministic
  local export writes the PNGs and manifest.
- Export stages all PNGs, then atomically replaces the complete renderer
  artifact set only after all seven screenshots succeed.
- HTML may use vendored local theme/font assets only. It must not contain
  script elements, event-handler attributes, network URLs, `@import`, or
  non-theme assets.
- The renderer takes no retry or repair pass.
- On an HTML-contract or export failure, retain the input and any generated
  HTML for inspection. Preserve the prior complete renderer artifacts, or
  leave no success manifest; a manifest must never point to altered or partial
  PNGs.

## Acceptance Criteria

- A valid v1 artifact results in exactly seven ordered PNGs at 1080×1350 and
  a success manifest whose run ID, source version (`"1"`), dimensions, slide
  count, and ordered paths match the run artifacts.
- Invalid content prevents agent delegation and produces no success manifest.
- A failed export cannot expose partial PNGs through a previous success
  manifest.
- The static scan rejects prohibited HTML constructs and non-local assets;
  Playwright aborts every route during export.
- The repository documents the supported Node LTS policy and uses
  `npm ci` followed by `npx playwright install chromium` for local setup;
  dependency changes include the committed `package-lock.json`.
- Rendered output follows the locally derived `database` visual direction;
  `docs/reference/html/index.html` remains source material, never runtime
  output or a remote asset source.

## Verification

- Targeted tests cover valid export, pre-delegation input rejection, HTML
  contract rejection, manifest creation, and failed exports preserving the
  prior complete artifact set or leaving no success manifest.
- Run the documented npm/Playwright setup and a seven-slide export; inspect
  dimensions, manifest paths, and that route interception saw no allowed
  network request.

## Settled Decisions

- npm + Playwright is the local renderer toolchain; Chromium is the required
  browser.
- Typography is vendored locally; runtime rendering never fetches fonts or
  other assets.
- Milestone 0003 owns overflow validation and the five-topic proof set.

## Open Questions

None.
