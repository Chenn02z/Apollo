# Spec: Adaptive Carousel Content v2

## Status

Verified

## Goal

Add a separate v2 Apollo path that produces, validates, and renders a
content-derived 6–10-slide technical carousel, while leaving every v1 entry
point, validator, renderer, and artifact contract unchanged.

## Scenario

A creator invokes `apollo-generate-v2` for `ACID properties in databases`.
It writes a v2 request, delegates once to a v2 writer, and validates the v2
content. `apollo-render-v2` then validates it, delegates once to a v2
renderer, checks constrained HTML and overflow, and exports one 1080×1350 PNG
per content slide plus a v2 manifest. An ACID run can cover Atomicity,
Consistency, Isolation, Durability, and a concurrency example on distinct slides.

## Architecture Reference

This implements the approved parallel v2 path in
[`docs/ARCHITECTURE.md`](../ARCHITECTURE.md):

```text
topic → apollo-generate-v2 → carousel-writer-v2 → v2 content JSON
      → apollo-render-v2 → carousel-renderer-v2 → HTML/PNG/manifest
```

V2 is entered only through its v2 entry points; v1 defaults remain unchanged.
The v2 artifact’s `slides.length` is the sole source for validation, HTML,
export, PNG paths, and manifest count. The existing local `database` theme is
the only theme; scripts, network access, and external assets are disallowed.
The renderer makes no content decisions, and deterministic tools make no
semantic or visual-design decisions. A failed v2 publication preserves a prior
complete v2 set or leaves no v2 success manifest.

## In Scope

- Separate `apollo-generate-v2` and `apollo-render-v2` skill bundles and
  dedicated writer/renderer presets.
- Versioned v2 artifacts that cannot collide with v1 artifacts in one run.
- Deterministic v2 content validation: closed schema, 6–10 count, roles, field
  limits, Unicode code-point counting, and plain-text checks.
- Deterministic v2 HTML, PNG, manifest, and overflow validation.
- Concrete, non-duplicative writer policy and manual ACID review evidence.

## Out Of Scope

- Any v1 skill, agent, script, contract, renderer, manifest, run, or default
  invocation change.
- Configurable counts, counts outside 6–10, or deterministic semantic,
  factual, or duplicate-copy detection.
- New themes, remote/generated assets, retries, repair, research, citations,
  publishing, analytics, web UI, authentication, or a standalone CLI.

## Architecture Seams

- **Run artifact boundary:** v2 uses only `request-v2.json`,
  `carousel-content-v2.json`, `index-v2.html`, `slides-v2/`, and
  `render-manifest-v2.json` under `runs/<run-id>/`. It never reads, writes,
  deletes, or treats v1 artifacts as input or output.
- **Content/HTML boundary:** layout-ready plain-text v2 content is validated
  before one HTML delegation; the renderer writes only `index-v2.html`.
- **Theme/HTML boundary:** v2 uses the repository-owned `database` pack
  only. Its self-contained HTML uses inline styles and a system font stack, with
  no scripts or external/file/network subresources.
- **HTML/export boundary:** deterministic export scans HTML, aborts every
  Playwright route, measures dimensions and overflow, and screenshots exactly
  the content-derived roots.
- **Validation boundary:** structural and rendered-capacity checks are
  deterministic; teaching concreteness is writer policy and manual evidence.

## Contracts

### Invocation and v2 request artifact

`apollo-generate-v2` accepts exactly one topic, trims it, and rejects a blank
result before creating a run or delegating. Before its one writer delegation,
it writes `request-v2.json`, a closed JSON object with exactly these six fields
and no additional properties:

```json
{
  "contractVersion": "2",
  "topic": "ACID properties in databases",
  "runId": "<run-id>",
  "createdAt": "<RFC3339 UTC millisecond timestamp>",
  "model": "gpt-5.6-terra",
  "effort": "medium"
}
```

`contractVersion` is exactly `"2"`; `topic` is the normalized input; `runId`
matches the directory; `createdAt` is a valid UTC millisecond RFC3339 timestamp;
`model` is exactly `"gpt-5.6-terra"`; and `effort` is exactly `"medium"`.
The writer may write only `runs/<run-id>/carousel-content-v2.json`; it does not
retry, repair, render, research, or call an API client.

### V2 content artifact and validation

`carousel-content-v2.json` is a closed object:

```json
{
  "version": "2",
  "topic": "ACID properties in databases",
  "slides": [
    {
      "number": 1,
      "role": "hook",
      "title": "ACID: four guarantees for reliable transactions",
      "body": "A transaction either commits as a unit or leaves no partial state.",
      "items": []
    }
  ]
}
```

`version` is exactly `"2"`; `topic` equals `request-v2.json.topic`; and
`slides` has 6–10 closed objects with exactly `number`, `role`, `title`,
`body`, and `items`. Numbers are consecutive integers from 1 through length.

Roles are limited to `hook`, `overview`, `concept`, `example`,
`deep-dive`, `interview`, and `takeaway`: slide one is `hook`, slide two
is the only `overview`, the final slide is `takeaway`, and each other slide
is `concept`, `example`, `deep-dive`, or `interview`. Intermediate roles
may repeat; `interview` is optional.

`title` is 1–80 Unicode code points, `body` is 1–300, and `items` has
zero to four strings of 1–100. Count with `Array.from(value).length`, without
trimming or normalization. Each text field uses existing v1 plain-text patterns
for HTML, CSS, block Markdown, and inline Markdown; reject it rather than
parsing, sanitizing, or rewriting it.

Writer instructions require each substantive slide to teach a named mechanism,
failure mode, trade-off, decision rule, or worked example. Generic advice or
duplicate recap copy fails manual policy; the validator does not judge this.

`validate-carousel-content-v2.mjs <run-dir>` validates only v2 artifacts:
safe `runs/<run-id>` path without symlink traversal, request/content schemas,
topic equality, count, number and role sequence, limits, and plain text. Invalid
or unreadable v2 content removes only a regular, non-symlink
`carousel-content-v2.json`, retains `request-v2.json`, leaves v1 untouched,
and never retries, renders, or reports success.

### V2 render, HTML, overflow, and export

`apollo-render-v2` accepts exactly one run directory and runs the v2 validator
before its one renderer delegation. Invalid input causes no renderer delegation,
export, or v2 manifest. `carousel-renderer-v2` receives validated content,
run path, local theme contract, and derived count; it may write only
`runs/<run-id>/index-v2.html`.

`index-v2.html` has one `#carousel` whose direct
`section.carousel-slide[data-slide]` children exactly equal
`content.slides.length`, occur in order, and have values `"1"` through the
count; no other element has `data-slide`. Each root has a direct
`.slide-content` child, is exactly 1080×1350 CSS pixels, and contains all
visible copy in that child. Inline CSS is allowed; `script`, `link`, `base`,
`meta`, event handlers, `src`, `href`, `@import`, CSS URLs, and external
assets are forbidden. `overflow`, `overflow-x`, and `overflow-y` with a value
of `hidden` or `clip` are forbidden on every slide root descendant, including
the root itself.

Before Chromium starts, static scanning rejects those prohibited declarations
in inline CSS. Playwright aborts every route. After load and before screenshots,
DOM inspection checks every root and descendant's computed `overflow`,
`overflowX`, and `overflowY`, and rejects scroll width or height greater than
client width or height. Each diagnostic identifies the one-based slide, whether
the affected element is the root or a descendant, and whether width or height
overflowed. Failure retains the HTML, creates no new v2 manifest, and preserves
a prior complete v2 publication when present.

Stage exactly one 1080×1350 PNG per slide and publish only after all dimension
checks pass. Prior-publication validation is scoped only to v2. A prior
`render-manifest-v2.json` must be a closed object with exactly `version`,
`runId`, `sourceContentVersion`, `width`, `height`, `slideCount`, and `slides`;
both versions must be `"2"`, its run ID must match, dimensions must be
1080×1350, its count must be 6–10, and its slides must be the exact zero-padded
ordered `slides-v2/slide-01.png` through count-derived final path. Every
referenced PNG must be a regular, non-symlinked 1080×1350 file. An invalid
prior publication removes only its v2 manifest, treats it as no prior state,
and never touches v1 artifacts.

A prior publication is restorable only when its `slideCount` exactly equals the
current validated content's `slides.length`. If a prior otherwise-valid v2
publication has a different count, remove only `render-manifest-v2.json` and
treat it as having no prior complete v2 publication; do not snapshot or restore
its `slides-v2/` set. This keeps the current content artifact as the sole
slide-count source. On publication, remove the v2 manifest, replace the
complete `slides-v2/` set, verify published PNG dimensions, then write the new
manifest last. On failure, restore the prior snapshot and its manifest, or
leave no v2 manifest.

The closed manifest is:

```json
{
  "version": "2",
  "runId": "<run-id>",
  "sourceContentVersion": "2",
  "width": 1080,
  "height": 1350,
  "slideCount": 6,
  "slides": [
    "slides-v2/slide-01.png",
    "slides-v2/slide-02.png"
  ]
}
```

`version` and `sourceContentVersion` are exactly `"2"`; dimensions are
1080×1350; `runId` matches the directory; `slideCount` equals validated
`content.slides.length`; and `slides` is the exact zero-padded ordered path
sequence through the count-derived final slide.

## Failure Modes

| Condition | Required behavior |
| --- | --- |
| Missing or blank topic; request creation failure | Fail before delegation; create no run for blank input. |
| Writer failure, absent output, or invalid output | Retain request; safely remove only invalid regular v2 content; do not retry, render, or alter v1. |
| Malformed, unsafe, wrong-version v2 artifacts; invalid count | Fail before rendering; state actual count and permitted 6–10 range where applicable. |
| Invalid roles or fields | Identify the slide/field; do not render. |
| Renderer failure or missing HTML | Retain input; do not export or publish a v2 manifest. |
| Prohibited HTML, root/order/dimension failure, or clipping | Retain HTML; publish no new v2 output. |
| Route attempt or overflow | Fail with actionable slide/dimension diagnostic; preserve valid v2 output or leave no manifest. |
| Screenshot, staging, publication, or manifest failure | Never expose partial v2 output; restore prior valid v2 output or leave no v2 manifest. |

## Acceptance Criteria

- V2 entry points are separate; v1 defaults and behavior remain unchanged.
- Only validated `slides.length` determines the 6–10 slide count.
- V2 rejects 5/11 slides, unsupported versions, invalid role sequence, markup,
  invalid limits, and unsafe artifacts before renderer delegation.
- Valid roles start with `hook`, contain sole second `overview`, end with
  `takeaway`, and allow only permitted intermediate roles.
- V2 exports one ordered 1080×1350 PNG per slide and a matching closed v2
  manifest.
- Overflow gives a deterministic slide-specific diagnostic rather than clipping,
  silent shrinking, or manifest publication.
- Manual ACID review proves distinct Atomicity, Consistency, Isolation,
  Durability, concurrency-example, and final-takeaway coverage.
- Valid v1 runs still validate and render seven v1 PNGs with their existing
  manifest and without v2 artifacts.

## Verification

- Add targeted v2 validator checks for 6/10 acceptance; 5/11 rejection; roles,
  closed schemas, Unicode boundaries, markup rejection, and pre-render failure.
- Add targeted v2 render checks for 6/10 roots, PNG dimensions, ordered manifest
  paths, route abort, rollback, and width/height overflow diagnostics.
- Run the existing v1 validator and renderer commands unchanged.
- Run a real Chromium v2 export when the browser is installed.
- Manually inspect an ACID v2 run against the concrete-content rubric.

## Open Questions

None.
