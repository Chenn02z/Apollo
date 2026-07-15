# Spec: Fixed Carousel Renderer

## Status

Accepted

## Goal

Turn one valid v1 content run into a fixed local `database`-theme HTML
carousel, exactly seven 1080×1350 PNGs, and a success manifest without manual
HTML editing or network access.

## Scenario

A creator has a valid `runs/<run-id>/carousel-content.json` and invokes
`apollo-render`. The skill first runs
`node scripts/validate-carousel-content.mjs runs/<run-id>`. Only when that
validator succeeds does it delegate once to `carousel-renderer`, which writes
`runs/<run-id>/index.html`. Deterministic local export statically rejects
unsafe or non-local HTML, screenshots all seven slides with Playwright while
aborting every route, then publishes the seven PNGs and success manifest.

## Architecture Reference

This spec implements the renderer portion of the approved MVP flow in
[`docs/ARCHITECTURE.md`](../ARCHITECTURE.md):
`carousel-content.json → apollo-render → carousel-renderer → HTML/PNG/manifest`.
It uses the approved local `database` theme source pack and defers render validation
such as overflow checks to milestone 0003.

## In Scope

- An `apollo-render` Codex skill that accepts one run directory, runs the
  existing content validator before delegation, and delegates exactly once.
- One `carousel-renderer` agent authorized to write only
  `runs/<run-id>/index.html`.
- A fixed repository-owned `assets/database/` theme source pack derived from
  `docs/reference/html/index.html`, with vendored fonts embedded as inline font
  data in the rendered HTML.
- The `carousel-renderer` agent preset and minimal repository-level
  renderer/export setup needed to create the run artifacts.
- A constrained HTML contract: exactly seven ordered 1080×1350 slide roots
  with `data-slide="1"` through `data-slide="7"`; inline CSS is allowed.
- Deterministic static HTML scanning, Playwright Chromium export with all
  network routes aborted, staged PNG publication, and a success manifest.
- Local Node 22 LTS setup documentation, npm dependencies, and committed
  `package-lock.json`.

## Out Of Scope

- Theme selection, theme plugins, remote or generated assets, retries,
  repair, visual review, overflow validation, publishing, or a shell CLI.
- Changes to the v1 content contract or validator, standalone LLM API clients,
  runtime API keys, research, citations, caching, hosted execution, web UI,
  authentication, scheduling, or analytics.

## Architecture Seams

- **Run artifact boundary:** read only the selected run's validated input.
  Generate HTML for inspection and stage candidate PNGs outside the published
  `slides/` set. Before altering published slides, remove the success manifest;
  replace the complete slide set, then write a manifest last. If publication
  fails, restore the prior complete set and manifest, or leave no manifest.
- **Content/HTML boundary:** `apollo-render` validates the existing v1
  artifact before its only delegation. `carousel-renderer` converts that
  layout-ready copy into HTML and makes no export, content-generation, or
  visual-repair decisions.
- **Theme/HTML boundary:** the renderer uses one fixed local `database` theme
  source pack only. The emitted HTML is self-contained: it contains exactly
  seven identifiable slide roots, inline styles, and only an allowed inline
  font-data URL. `assets/database/` is source-only at runtime; emitted HTML has
  no external, file, or other subresource reference.
- **HTML/export boundary:** deterministic local export owns static HTML
  enforcement and PNG creation. Playwright aborts every route; it does not
  choose content, layout, or assets.
- **Validation boundary:** this stage validates v1 input before delegation and
  HTML/export contracts during rendering. Overflow and broader rendered-output
  validation remain independent milestone 0003 work.

## Contracts

### Invocation and input validation

`apollo-render` accepts exactly one `runs/<run-id>/` directory. Before any
agent delegation it runs `node scripts/validate-carousel-content.mjs <run-dir>`
and treats a nonzero exit as invalid input. The validator defines all required
input artifacts. Invalid input produces no delegation, no export, and no
success manifest. The renderer neither rewrites nor repairs the content
artifact.

### Delegation and HTML ownership

After successful pre-delegation validation, `apollo-render` delegates exactly
once to `carousel-renderer` with the run path, content contract, fixed
`database` theme contract, and seven-slide HTML contract. The agent may write
only `runs/<run-id>/index.html`; it has no authority to write images, manifests,
assets, or files outside that run. It receives no retry or repair pass.

The repository supplies the `carousel-renderer` preset at
`.codex/agents/carousel-renderer.toml`. Its delegated read scope is the selected
run's validated content plus `assets/database/` and the supplied contract; its
write scope is only `runs/<run-id>/index.html`.

`index.html` must contain one `#carousel` element whose direct children matching
`#carousel > section.carousel-slide[data-slide]` are exactly seven slide roots
in DOM order. Their `data-slide` values must be the string sequence `"1"`
through `"7"`; no other element may have `data-slide`. Each matching root must
render at exactly 1080×1350 CSS pixels, measured with
`getBoundingClientRect().width` and `.height` before screenshot. It must be
self-contained: styles are inline and any vendored font is encoded only as
`url(data:font/woff2;base64,...)` in inline CSS. It has no `src` or `href`
attributes and no other CSS `url(...)` form.
`docs/reference/html/index.html` is visual source material, never copied as
runtime output or treated as an asset source.

### Static HTML contract

Before export, deterministic scanning requires all styling to be in inline
`<style>` elements and permits CSS URLs only when the complete URL value is
`data:font/woff2;base64,<base64-data>`. It rejects `<link>` and `<script>`
elements; `src`, `href`, `style`, and event-handler attributes; `@import`; every
`http:`, `https:`, `file:`, protocol-relative, root-relative, relative, or
other URL; and every CSS `url(...)` that is not the permitted font-data form.
It also rejects any `data-slide` outside the seven roots, a missing,
duplicated, unordered, or incorrectly sized root. Rejected HTML is retained at
its expected `index.html` path for inspection; it creates no success manifest
and no published partial PNG set.

### Export and publication

Use the repository's Node 22 LTS npm setup and Playwright Chromium. `npm ci`
and the one-time `npx playwright install chromium` browser download are local
development setup steps, not renderer runtime behavior. During an export,
read `runs/<run-id>/index.html` as UTF-8, install route interception, then call
`page.setContent(html)`; never navigate to a `file:` URL. Abort every route;
any route attempt, including local file, HTTP(S), font, image, or script
requests, fails the export. Measure each required slide with the stated
selector and bounding rectangle, then screenshot it at 1080×1350 into a staging
location.

After all staged screenshots succeed, publish with this state machine:

1. Before backup, validate any existing manifest against the closed schema
   below, its exact seven run-relative paths, and seven existing 1080×1350 PNGs.
   If any check fails, remove that manifest and treat the run as having no prior
   complete set.
2. Snapshot only a validated prior complete `slides/` set and its manifest.
3. Remove `render-manifest.json` before altering published `slides/`.
4. Replace the complete `slides/` directory with the fully staged seven-PNG
   set.
5. Verify the published PNG paths and dimensions, then write the new manifest
   last.
6. If a step after removal fails, restore the validated prior complete `slides/` set and
   write its manifest last; if restoration cannot complete, leave no manifest.

A failed export retains the input and generated HTML. A manifest must never
point to partial, staged, altered, or missing PNGs.

### Success manifest

On successful publication, write a closed `runs/<run-id>/render-manifest.json`
object with exactly these fields and no additional properties:

```json
{
  "version": "1",
  "runId": "<run-id>",
  "sourceContentVersion": "1",
  "width": 1080,
  "height": 1350,
  "slideCount": 7,
  "slides": [
    "slides/slide-01.png",
    "slides/slide-02.png",
    "slides/slide-03.png",
    "slides/slide-04.png",
    "slides/slide-05.png",
    "slides/slide-06.png",
    "slides/slide-07.png"
  ]
}
```

`version` and `sourceContentVersion` are exactly `"1"`; `runId` exactly matches
the run directory; `width`, `height`, and `slideCount` are exactly the values
shown; and `slides` is exactly the ordered array shown.

### Toolchain setup

Document Node 22 LTS as the supported local runtime. After dependency changes,
commit `package-lock.json`. The documented setup uses `npm ci`, followed by
the one-time `npx playwright install chromium` browser download. The exporter
uses that installed Chromium and permits no runtime route or subresource.

## Failure Modes

| Condition | Required behavior |
| --- | --- |
| Missing, invalid, or non-v1 run input | Fail before delegation; do not generate HTML or export; produce no success manifest. |
| Content validator exits nonzero | Treat input as invalid; do not delegate, retry, repair, or publish output. |
| Renderer delegation fails or writes no expected HTML | Report failure; retain input; do not export or publish a manifest. |
| HTML violates inline asset, prohibited-construct, slide-count, order, or dimension contract | Retain generated HTML for inspection; do not export, retry, repair, or publish a manifest. |
| Any Playwright route is attempted | Abort it and fail the export; preserve the prior complete published set and manifest, or leave no manifest. |
| A screenshot or staged write fails | Do not alter published slides or publish a new manifest; preserve the prior complete set or leave no manifest. |
| Published-slide replacement or manifest write fails | Restore the prior complete slides and write its manifest last, or leave no manifest; retain inspectable input and HTML. |

## Acceptance Criteria

- A valid v1 run invokes the existing validator before exactly one renderer
  delegation and produces only the specified `index.html`, seven ordered PNGs,
  and success manifest in that run.
- `index.html` is a fixed local `database`-theme carousel with exactly seven
  ordered 1080×1350 `#carousel > section.carousel-slide[data-slide]` roots
  carrying `data-slide="1"` through `data-slide="7"`, inline styles, and only
  permitted inline WOFF2 font data.
- Invalid content prevents delegation and yields no success manifest.
- Static scanning rejects scripts, links, event handlers, `src`/`href`,
  `@import`, all non-font-data CSS URLs, and invalid slide roots before export.
- Playwright aborts every route attempt and fails the seven-slide Chromium
  export when one occurs.
- The success manifest records its version, run ID, source version `"1"`,
  1080×1350 dimensions, slide count `7`, and the exact ordered slide paths.
- Export failure never exposes partial or altered PNGs through a success
  manifest; after publication begins, it restores the prior complete state or
  leaves no manifest.
- Repository setup documents Node 22 LTS, uses `npm ci` then
  `npx playwright install chromium`, and commits `package-lock.json` with
  dependency changes.
- No theme selection, remote assets, repair/retry behavior, overflow checks,
  visual review, publishing, or shell CLI is introduced.

## Verification

- Add targeted automated checks for valid export, input rejection before
  delegation, exactly-one delegation, renderer write authorization, static
  HTML rejection, selector/sequence/bounding-rectangle measurement, all-route
  abort behavior, manifest contents, PNG dimensions, and failed export
  publication safety.
- Run `npm ci`, then `npx playwright install chromium`, followed by the
  targeted renderer test command.
- Run one valid seven-slide export and inspect all PNG dimensions, manifest
  run ID/source version/ordered paths, and route-interception evidence showing
  no allowed network request.
- Run failure cases for invalid input, prohibited HTML, a route attempt, and a
  staged screenshot failure; confirm each leaves no success manifest or keeps
  the prior complete published set intact.

## Open Questions

None.
