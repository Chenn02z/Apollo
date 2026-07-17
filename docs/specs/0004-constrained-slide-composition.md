# Spec: Constrained Slide Composition

## Status

Verified

## Goal

Replace legacy fixed visual variants with layout-neutral semantic content and one constrained, validated body fragment per slide, while keeping content binding, shell chrome, safety checks, browser measurement, export, and artifact publication deterministic.

## Scenario

Given a valid 7–10-slide `carousel-content.json` and matching valid `carousel-layout.json`, `apollo-render` invokes `carousel-composer` exactly once. The composer writes exactly `slide-bodies/01.html` through `slide-bodies/NN.html`. Deterministic code rejects unsafe structure or incomplete content binding, injects escaped validated content into approved slots, assembles one repository-owned shell, verifies every body remains inside its reserved browser-measured region, and publishes the fragments, HTML, PNGs, and manifest as one complete renderer artifact set.

## Architecture Reference

This implements the `0004` seam in [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md):

```text
validated semantic content + validated layout plan
→ carousel-composer
→ slide-bodies/<nn>.html
→ deterministic binding and fixed-shell assembly
→ reserved-body validation
→ Playwright PNG export
→ complete renderer artifact publication
```

It closes the temporary fixed-variant path described under Visual-Composition Seams. It preserves the run-artifact, content/layout/HTML, theme/HTML, HTML/export, and validation boundaries.

## In Scope

- Replace each slide’s legacy `variant` payload with a closed semantic `content` object.
- Extend each layout slide with optional `repeatJustification`.
- Add `carousel-composer` and its protected exact fragment-set write boundary.
- Add one closed HTML/class/SVG fragment vocabulary to the repository-owned `database-blueprint` contract and database theme.
- Deterministically validate fragment syntax, structure, layout-plan fidelity, semantic-unit binding, and safe SVG.
- Deterministically inject escaped content into closed binding slots.
- Replace the six full-slide templates with one fixed shell containing one reserved body slot.
- Measure reserved-body containment in Chromium before publication.
- Publish or restore `slide-bodies/`, `index.html`, `slides/`, and `render-manifest.json` together.
- Remove the legacy variant renderer and reject new content containing `variant`.

## Out Of Scope

- Multiple templates or themes, user-authored CSS, arbitrary HTML, generated assets, external resources, scripts, URLs, IDs, inline styles, SVG text, animation, filters, masks, reusable SVG definitions, or foreign content.
- Paraphrasing, generating, omitting, merging, or splitting validated teaching units during composition.
- Composer, director, visual-review, or export retry and repair loops.
- An archival compatibility renderer for legacy `variant` content.
- Visual quality scoring beyond the deterministic repetition and equal-column review signals defined here.
- Changes to validated content claims, review policy, slide-count ownership, PNG dimensions, or manifest safeguards.

## Architecture Seams

- **Content/layout:** `carousel-content.json` remains the sole source of slide count and teaching content. `carousel-layout.json` remains spatial intent. Neither agent may change the other artifact.
- **Composer/write boundary:** the composer writes only the delegated numbered files inside run-local `slide-bodies/`. It cannot change the run’s content, layout, histories, shell, archive, theme, HTML, PNGs, or manifest.
- **Template/theme:** `database-blueprint` remains the sole template archive and references the canonical database shell and theme. The closed fragment vocabulary extends that contract; it does not create another theme.
- **Binding/assembly:** deterministic code, not the composer, inserts content text, supplies fixed chrome, and assembles HTML.
- **HTML/export:** Playwright receives only deterministically assembled local HTML with network routes aborted. Browser measurement and screenshot production remain deterministic renderer responsibilities.
- **Artifact publication:** any composer, fragment, assembly, containment, or export failure restores the prior complete renderer artifact set or leaves no success manifest.
- **Legacy removal:** this milestone is one breaking end-to-end migration. No runnable intermediate or compatibility branch is required.

## Contracts

### Layout-neutral content

The existing root contract, 7–10 count, slide numbering/order, role rules, and validated plain-text rules for `title`, `why`, and `glossary` remain unchanged.

Each slide has exactly these keys:

```json
{
  "number": 1,
  "role": "hook",
  "title": "Transactions need all-or-nothing behavior",
  "why": "Partial writes leave related records inconsistent.",
  "glossary": [
    {
      "term": "atomicity",
      "definition": "A transaction commits completely or not at all."
    }
  ],
  "content": {
    "type": "statement",
    "text": "Atomicity treats a transaction as one indivisible change."
  }
}
```

`variant` and every former variant-specific key are unknown keys and fail content validation. No legacy artifact is converted during rendering.

`content` is one of these exact shapes:

```text
statement
  { type, text }

collection
  { type, items }
  item = { label, detail }

comparison
  { type, sides }
  sides = exactly two { label, items }
  side item = string

sequence
  { type, steps }
  step = { label, detail }

example
  { type, setup, code, explanation }

checklist
  { type, items }
  item = { label, detail }
```

Exact limits:

- `statement.text`: 1–360 Unicode code points.
- `collection.items`: 2–6 items.
- `comparison.sides`: exactly 2 sides; each side has 1–4 items.
- `sequence.steps`: 2–6 ordered steps.
- `checklist.items`: 2–6 ordered items.
- Every `label`: 1–80 code points.
- Every `detail`, comparison item, `setup`, or `explanation`: 1–240 code points.
- `example.code`: 1–600 code points and may contain line breaks.
- Every object has exactly the keys stated above.
- Every string is trimmed, plain text validated by the existing text trust-boundary rules, and non-empty.
- Arrays preserve source order. The composer may change spatial placement but not array order within a sequence or checklist.

The writer contract and fixtures must emit this schema. The reviewer must assess semantic `content.type` fitness instead of legacy variant fitness.

### Layout-plan extension

The `carousel-layout.json` root remains unchanged. Each slide has either the six existing required keys or those keys plus `repeatJustification`:

```json
{
  "number": 3,
  "composition": "flow",
  "density": "dense",
  "visualAnchor": "sequence",
  "direction": "left-right",
  "directionNote": "Lead through each failure in causal order.",
  "repeatJustification": "A repeated flow keeps the two related failure paths comparable."
}
```

When present, `repeatJustification` is a trimmed non-empty plain-text string of at most 280 Unicode code points. Unknown additional keys remain invalid. An invalid present value reports `LAYOUT_NOTE`.

The field is optional because repetition is a review preference, not a render-safety condition.

### Fragment output set

For `N` validated content slides, the composer’s complete output is exactly:

```text
slide-bodies/01.html
slide-bodies/02.html
...
slide-bodies/NN.html
```

Rules:

- Two-digit zero padding is required for the supported 7–10 count.
- `slide-bodies/` is a real directory, not a symlink.
- Every expected entry is a real regular file, not a symlink.
- No missing, extra, nested, temporary, hidden, or differently named entry is allowed.
- Each file is valid UTF-8 and at most 64 KiB.
- File `NN.html` binds only content slide number `NN`.
- The composer is invoked once and receives the validated content path, validated layout path, template contract path, and delegated `slide-bodies/` path.
- There is no retry or repair.

Publication preparation backs up the prior complete four-member renderer set outside the run, withholds the success manifest, and then creates the empty canonical run-local `slide-bodies/` directory delegated to the composer. A pre-existing `slide-bodies/` symlink or non-directory fails without removal. Any later failure removes the candidate renderer members and restores the complete backup under the publication contract below.

### Static fragment grammar

A fragment is a restricted HTML-like document parsed by a deterministic anchored tokenizer and tag stack before any browser receives it.

The source grammar permits:

- Lowercase explicit opening and closing tags.
- Double-quoted attributes only.
- ASCII whitespace between tokens.
- Whitespace-only text nodes.
- No BOM, NUL, disallowed control character, comment, doctype, CDATA, processing instruction, entity reference, namespace declaration, self-closing tag, malformed nesting, or trailing non-whitespace data.

All teaching text enters later through bindings; raw fragment text is therefore always invalid.

Allowed HTML tags:

```text
section div article figure figcaption
p h3 span strong em code pre
ul ol li blockquote
```

Allowed SVG tags:

```text
svg g line polyline polygon rect circle ellipse
```

No other tag is accepted.

The closed parent/child grammar is:

- The root `section` permits only structural block children: `div`, `article`, `blockquote`, `figure`, `p`, `h3`, `pre`, `ul`, or `ol`.
- Structural `div`, `article`, and `blockquote` permit only structural `div`, `article`, or `blockquote` children, or `p`, `h3`, `pre`, `ul`, `ol`, or `figure`.
- `figure` permits structural HTML children from the root set, exactly one optional `svg`, and at most one `figcaption`.
- `ul` and `ol` permit only `li` children.
- `li` permits phrasing children or is an empty binding element.
- `p`, `h3`, `figcaption`, `span`, `strong`, and `em` permit only phrasing `span`, `strong`, `em`, or `code` children, or are empty binding elements.
- `pre` contains exactly one `code`; `code` is an empty binding element.
- `svg` permits only `g` or geometry children; `g` permits only geometry children; `line`, `polyline`, `polygon`, `rect`, `circle`, and `ellipse` are empty.

Whitespace-only text nodes may occur between allowed children. No raw text, interactive content, omitted closing tag, or element whose HTML parsing relies on implicit close or browser repair is valid.

### HTML attributes and binding

HTML elements may have only `class` and, on an empty bindable element, `data-bind`. The root `section` attributes `data-composition`, `data-direction`, and `data-anchor` are the only explicit exceptions.

The single root must be:

```html
<section
  class="cp-body cp-layout-<arrangement> cp-density-<density>"
  data-composition="<composition>"
  data-direction="<direction>"
  data-anchor="<visualAnchor>"
>
  ...
</section>
```

The root’s exact attributes are `class`, `data-composition`, `data-direction`, and `data-anchor`. Their values must match the corresponding validated layout slide. The density class must match its plan density.

The sole dominant arrangement is the root’s one `cp-layout-*` class:

```text
cp-layout-grid
cp-layout-stack
cp-layout-row
cp-layout-split
cp-layout-cluster
cp-layout-center
cp-layout-flow
```

Closed plan-to-arrangement compatibility:

| Plan composition | Allowed dominant arrangements |
|---|---|
| `minimal` | `center`, `stack` |
| `editorial` | `stack`, `row`, `split` |
| `split` | `split`, `row` |
| `grid` | `grid`, `cluster` |
| `flow` | `flow`, `row`, `stack` |
| `focus` | `center`, `cluster`, `stack` |

`data-bind` values are JSON Pointers rooted at the slide, such as `/content/items/0/label`. They may reference only string leaves beneath `/content` except the discriminator `/content/type`; they cannot reference `type`, `number`, `role`, `title`, `why`, or `glossary`.

A binding element:

- Is one of `p`, `h3`, `span`, `strong`, `em`, `code`, `li`, or `figcaption`. `pre` is never a binding element and never carries `data-bind`; it contains exactly one `code`, which may be the empty binding element for `/content/code`.
- Has no child and no raw text.
- Resolves to one validated string leaf.
- Is replaced by exactly one escaped text node during deterministic assembly.

Every string leaf beneath `content`, except the discriminator `/content/type`, must be bound exactly once. Unknown, duplicate, cross-slide, non-string, missing, or unbound pointers fail. For `sequence` and `checklist`, binding pointers occur in DOM document order by nondecreasing array index and, within each item, `label` before `detail`; CSS may change visual placement but not source order. `number`, `role`, `title`, `why`, `glossary`, and footer text are bound once by fixed-shell code, never by the composer.

### Class allowlist

The complete fragment class vocabulary is:

```text
cp-body
cp-layout-grid cp-layout-stack cp-layout-row cp-layout-split
cp-layout-cluster cp-layout-center cp-layout-flow
cp-density-sparse cp-density-standard cp-density-dense

cp-group cp-statement cp-collection cp-comparison
cp-sequence cp-timeline cp-example cp-checklist
cp-node cp-annotation cp-connector
cp-label cp-detail cp-emphasis cp-muted cp-code cp-list

cp-gap-1 cp-gap-2 cp-gap-3 cp-gap-4
cp-span-1 cp-span-2 cp-span-3 cp-span-4

cp-diagram
cp-pos-tl cp-pos-tc cp-pos-tr
cp-pos-ml cp-pos-mc cp-pos-mr
cp-pos-bl cp-pos-bc cp-pos-br

cp-svg-canvas cp-svg-line cp-svg-line-muted cp-svg-node cp-svg-accent cp-svg-arrow
```

Rules:

- Duplicate class tokens are invalid.
- `cp-body`, one `cp-layout-*`, and one `cp-density-*` occur only on the root `section`.
- `cp-group`, `cp-statement`, `cp-collection`, `cp-comparison`, `cp-sequence`, `cp-timeline`, `cp-example`, `cp-checklist`, `cp-node`, `cp-annotation`, `cp-connector`, `cp-gap-*`, and `cp-span-*` occur only on structural HTML elements. `cp-span-*` occurs only on direct children of the root layout container.
- `cp-list` occurs only on `ul` or `ol`; `cp-code` occurs only on `pre` or `code`; `cp-label`, `cp-detail`, `cp-emphasis`, and `cp-muted` occur only on phrasing or bindable elements.
- `cp-diagram` occurs only on `figure`. `cp-pos-*` occurs only on direct HTML children of `figure.cp-diagram`.
- `cp-svg-canvas` occurs only on `svg`. `cp-svg-line` and `cp-svg-line-muted` occur only on `line` or `polyline`; `cp-svg-node` occurs only on `rect`, `circle`, or `ellipse`; `cp-svg-accent` may occur on any geometry element; and `cp-svg-arrow` occurs only on `polygon`. `g` has no class or other attribute.
- Layout, spacing, semantic, and SVG appearance are defined only in the canonical database theme; fragments cannot supply CSS.
- There is deliberately no `card` primitive. Equal cards cannot become the default composition.

### Semantic structure

Each fragment contains exactly one wrapper matching its `content.type`:

| `content.type` | Required wrapper |
|---|---|
| `statement` | `cp-statement` |
| `collection` | `cp-collection` |
| `comparison` | `cp-comparison` |
| `sequence` | exactly one of `cp-sequence`, `cp-timeline` |
| `example` | `cp-example` |
| `checklist` | `cp-checklist` |

Every `/content/...` binding must be a descendant of that wrapper.

A `sequence` uses `flow`, `row`, or `stack` as its dominant arrangement. A layout with `visualAnchor` equal to `diagram` must contain one `cp-diagram`; a layout with `visualAnchor` equal to `sequence` must contain `cp-sequence` or `cp-timeline`. These are contract failures, not subjective visual scoring.

### Safe SVG subset

SVG is optional and decorative. All teaching labels remain bound HTML, so SVG cannot contain text.

An `svg`:

- Occurs only inside a `cp-diagram` HTML element.
- Has exactly: `class="cp-svg-canvas"`, `viewBox="0 0 1000 600"`, `preserveAspectRatio="xMidYMid meet"`, `aria-hidden="true"`, and `focusable="false"`.
- Contains only the allowed SVG tags.
- Contains at most 128 total SVG elements.

SVG attributes are limited to:

| Element | Allowed attributes |
|---|---|
| `svg` | `class`, `viewBox`, `preserveAspectRatio`, `aria-hidden`, `focusable` |
| `g` | none |
| `line` | `class`, `x1`, `y1`, `x2`, `y2` |
| `polyline`, `polygon` | `class`, `points` |
| `rect` | `class`, `x`, `y`, `width`, `height`, `rx`, `ry` |
| `circle` | `class`, `cx`, `cy`, `r` |
| `ellipse` | `class`, `cx`, `cy`, `rx`, `ry` |

Geometry values are canonical base-10 integers. Every `line` endpoint and every point in a `polyline` or `polygon` stays within `x=0..1000` and `y=0..600`; `points` contains 2–64 comma-separated `x,y` pairs. A `rect` has `x,y >= 0`, `width,height > 0`, `x + width <= 1000`, and `y + height <= 600`; optional `rx` and `ry` are nonnegative and no greater than `width / 2` and `height / 2`, respectively. A `circle` has `r > 0`, `cx - r >= 0`, `cx + r <= 1000`, `cy - r >= 0`, and `cy + r <= 600`. An `ellipse` has `rx,ry > 0`, `cx - rx >= 0`, `cx + rx <= 1000`, `cy - ry >= 0`, and `cy + ry <= 600`.

There is no `style`, `id`, `href`, `src`, `url(...)`, `path`, `text`, `tspan`, `defs`, `use`, `image`, `foreignObject`, `script`, event attribute, transform, animation, marker reference, filter, mask, or clip path. Arrowheads use an approved `polygon` class rather than an ID/URL marker.

### Dominant-arrangement review signals

After all fragments validate, deterministic code scans slides in ascending number.

A slide breaches the preferred repetition limit when either:

1. Its dominant arrangement equals the immediately preceding slide’s arrangement; or
2. Its dominant arrangement has now appeared more than twice in the carousel.

The current slide owns the breach. If its layout entry lacks `repeatJustification`, emit warning:

```text
COMPOSER_REPEAT_UNJUSTIFIED /slides/<index>/repeatJustification
```

The warning is recorded in the proof log and reported as a review signal. It never blocks safe assembly or export. A valid present justification suppresses that slide’s warning.

Direct layout children are the root’s direct element children after whitespace-only text nodes are ignored. Emit `COMPOSER_EQUAL_COLUMNS` for the third and each later consecutive slide whose dominant arrangement is `grid`, `row`, or `split`, has at least two direct layout children, and has only structural HTML direct children with the same effective span. A child’s effective span is `N` from its sole `cp-span-N` class, or `1` when it has no span class. This is warning-only.

No card-monoculture heuristic is needed because the closed vocabulary contains no card primitive.

### Protected writes and stage order

`apollo-render` performs:

1. Existing content validation using the new semantic schema.
2. Existing layout preparation, one director invocation, protected-boundary check, and layout validation with optional `repeatJustification`.
3. Validate the run, archive, canonical shell/theme, and prior renderer state. `render-manifest.json` is the sole success and commit marker: a state without it is never a successful renderer set. Before replacing any member, create an external rollback backup of the prior complete `slide-bodies/`, `index.html`, `slides/`, and `render-manifest.json` set, then remove or withhold the run-local manifest first.
4. Create the empty canonical run-local `slide-bodies/` path and protected snapshot, then delegate exactly once to `carousel-composer`; the composer writes directly to that canonical path. Stage candidate `index.html`, `slides/`, and `render-manifest.json` outside the run.
5. Compare snapshots before parsing fragments. Any run, archive, shell, theme, content, layout, history, HTML, slide, manifest, added-entry, removed-entry, or hash mutation outside the delegated fragment directory fails.
6. Validate the exact output set and every fragment in filename order.
7. Emit non-blocking repetition review signals.
8. Deterministically bind escaped content and assemble the externally staged `index.html` from the one fixed shell.
9. Run static assembled-HTML safety and fidelity checks.
10. Open staged HTML in Playwright with all network routes aborted, await `document.fonts.ready`, and perform reserved-body and whole-slide containment checks.
11. Screenshot every content-derived slide into externally staged `slides/` and validate dimensions and manifest data.
12. Install the canonical candidate `slide-bodies/`, staged `index.html`, and staged `slides/`, then atomically rename the staged manifest into run-local `render-manifest.json` last.

Any in-process failure removes the candidate renderer members and restores every member of a prior complete set byte-for-byte. Without a prior complete set, failure removes partial candidates and leaves no manifest. No compatibility publication path is permitted.

Snapshot format and comparison reuse the lexical path, entry type, SHA-256, symlink-target, and metadata-exclusion contract from spec `0003`.

### Fixed-shell assembly

The six `<template data-variant>` blocks are removed. The canonical shell has one slide template with fixed repository-owned:

- `.slide-content` root,
- masthead,
- role tag,
- slide title,
- why text,
- glossary,
- footer,
- and one `.slide-body` reserved body host.

Deterministic code owns slide identifiers and chrome. It inserts the bound fragment only as children of the corresponding `.slide-body`. Fragments cannot replace or wrap the host.

Assembly must prove:

- HTML slide count and order equal validated content.
- Every fixed chrome value equals its validated source value.
- Every content leaf appears through its assigned binding.
- No unbound slot remains.
- No fragment node occurs outside `.slide-body`.
- Recomputing assembly from the same content, layout, and fragments produces byte-identical HTML.

The exporter compares the staged HTML against this canonical recomputation; it does not trust an existing run-local `index.html`.

### Reserved-body browser measurement

For each 1080×1350 slide after local fonts are ready:

- The `.slide-body` host must exist exactly once and have positive width and height.
- `scrollWidth <= clientWidth` and `scrollHeight <= clientHeight`.
- Every rendered descendant’s bounding rectangle, including `svg`, must be within the host rectangle with a 0.5 CSS-pixel tolerance on every edge.
- No descendant may have non-empty client rects outside the host.
- The `.slide-body` and its HTML descendants may not use computed `overflow: hidden` or `overflow: clip`. SVG viewport and geometry elements are exempt from this computed-overflow ban, but every SVG and geometry bounding rectangle must still remain inside `.slide-body`.
- Existing whole-slide descendant containment, slide dimension, count, and screenshot checks still run.

Any failed condition reports `BODY_OVERFLOW` with the slide number and binding pointer when present. Otherwise it reports a zero-based element-child JSON-pointer-like path from `.slide-body`, such as `/body/0/2`; whitespace text nodes do not affect indexes. Overflow is rejected, never hidden or cropped.

### Diagnostics

Errors use the renderer’s existing stderr and JSONL proof-log pattern. Each record includes severity, code, slide/file or JSON path, and deterministic message. Validation reports the first error; warnings do not alter exit status.

Error codes:

```text
COMPOSER_RUN_OR_TEMPLATE
COMPOSER_STALE_OUTPUT
COMPOSER_PROTECTED_MUTATION
COMPOSER_OUTPUT_SET
FRAGMENT_BYTES
FRAGMENT_SYNTAX
FRAGMENT_TAG
FRAGMENT_ATTRIBUTE
FRAGMENT_CLASS
FRAGMENT_ROOT
FRAGMENT_PLAN
FRAGMENT_SVG
FRAGMENT_BINDING
FRAGMENT_SEMANTICS
ASSEMBLY_OUTPUT
ASSEMBLY_FIDELITY
BODY_OVERFLOW
RENDER_EXPORT
RENDER_PUBLICATION
```

Warning codes:

```text
COMPOSER_REPEAT_UNJUSTIFIED
COMPOSER_EQUAL_COLUMNS
```

Fixed first-error order:

1. Run/template/output preparation.
2. Protected-boundary mutation.
3. Exact fragment directory and filename set.
4. Per file in lexical order: bytes, syntax, tag, attribute, class, root, plan fidelity, SVG, binding, semantics.
5. Assembly output and canonical fidelity.
6. Slides in ascending order: reserved-body then existing whole-slide checks.
7. Screenshot/export validation.
8. Publication.

## Failure Modes

- Legacy or invalid semantic content fails before director or composer invocation under content-validation policy.
- Missing, invalid, or protected-write-mutating layout output stops before the composer under the existing layout contract.
- An unavailable composer, missing/extra/symlink fragment, unsafe syntax, unknown tag/class/attribute, invalid SVG, plan mismatch, duplicate or missing binding, or semantic wrapper mismatch stops before assembly.
- A repetition warning without justification remains non-blocking.
- Assembly mismatch, body overflow, clipping, network attempt, screenshot failure, dimension mismatch, manifest mismatch, or publication failure removes candidate members and restores the prior complete renderer artifact set byte-for-byte.
- No failure invokes director, composer, assembly, or export retry or repair.
- When no prior complete set exists, failure leaves no success manifest and removes every partial renderer candidate; the valid content and layout artifacts remain inspectable. A renderer state without `render-manifest.json` is never successful.

## Acceptance Criteria

- New valid content uses exactly one closed semantic `content` shape per slide and contains no `variant` or former variant-specific key.
- Writer and reviewer contracts use semantic content types; renderer fixtures cover every type.
- A valid 7–10-slide run produces exactly the expected regular numbered fragments and one PNG per content slide.
- The composer can vary arrangements using the seven closed layout primitives, approved spacing/spans, structured text/code, and safe decorative SVG without creating CSS, scripts, URLs, IDs, or external resources.
- Every semantic content string except `/content/type` is deterministically escaped and bound exactly once; ordered sequence and checklist bindings preserve source order, and the composer cannot invent, paraphrase, or drop teaching text.
- Fragment validation rejects every unknown or malformed tag, parent/child relationship, class-to-element mapping, attribute, binding, plan value, geometry value, SVG primitive, file, and symlink before browser parsing can repair it.
- Dominant arrangements are derived from the root class using the stated compatibility table. Preferred adjacent or third-use repetition without justification emits the stable warning and still permits safe export.
- The third and each later consecutive `grid`, `row`, or `split` slide that has at least two direct layout children, all with the same effective span, emits `COMPOSER_EQUAL_COLUMNS` and does not block otherwise safe export.
- Sequence and diagram anchors satisfy their deterministic structural rules.
- One fixed shell owns all chrome and contains one reserved body per slide; the six legacy variant templates and selection path are removed.
- Browser measurement rejects reserved-body overflow or clipping before screenshots are published.
- `render-manifest.json` is installed atomically last as the sole success marker. Any failed composer, validation, assembly, measurement, export, or publication attempt preserves the prior `slide-bodies/`, `index.html`, `slides/`, and `render-manifest.json` set byte-for-byte, or removes candidates and leaves no success manifest.
- There is no legacy compatibility renderer, retry, repair loop, new theme, or new runtime dependency.

## Verification

- Update content-validator tests for one valid fixture of each semantic type, exact key sets, all array/cardinality limits, plain-text limits, and explicit legacy `variant` rejection. Legacy removal means only existing invalid-selected-artifact cleanup after validator rejection; it never converts an artifact or performs a destructive render-time migration.
- Update writer/reviewer contract fixtures to prove generated content can pass the new validator and review no longer depends on variants.
- Add layout-validator checks for absent, valid, empty, oversized, and wrong-type `repeatJustification`.
- Add fragment-set checks for 7 and 10 slides; missing, extra, nested, misnumbered, non-regular, and symlink entries.
- Add table-driven static grammar checks for every allowed parent/child relationship, tag, class-to-element mapping, and attribute, plus representative forbidden script, URL, style, ID, event, implicit-close content, malformed nesting, raw text, comment, entity, and namespace input.
- Add safe-SVG checks for every allowed geometry element and rejected text, path, definition/reference, URL, transform, out-of-range geometry, and excessive element/point count.
- Add binding checks for every semantic type, the `/content/type` exemption, escaped special characters, multiline code, sequence/checklist DOM source order, CSS-reordered spatial placement, duplicate/missing/unknown pointers, cross-slide pointers, raw teaching text, and invented text.
- Add compatibility and semantic-wrapper checks for every plan composition, content type, density, anchor, and direction rule.
- Add deterministic warning checks for adjacency, third use, valid justification, and equal-column runs, including ignored whitespace, minimum two structural direct children, explicit spans, and default span 1; prove warnings do not block export.
- Add protected-boundary checks for changes to content, layout, histories, existing renderer artifacts, archive, shell, theme, arbitrary run entries, and fragment-directory escape attempts.
- Add canonical assembly/fidelity checks proving one shell, fixed chrome, byte-identical recomputation, and no fragment node outside `.slide-body`.
- Add fake-browser containment branches plus one real-Chromium integration test covering safe SVG and its overflow exemption, local fonts, a valid body, horizontal overflow, vertical overflow, each BODY_OVERFLOW path form, and a descendant crossing each reserved-body edge.
- Seed a prior complete renderer set and prove every composer, fragment, assembly, browser, export, and publication failure restores all four artifact members byte-for-byte; without a prior set, prove candidates are removed and no manifest remains; prove the manifest is atomically installed last.
- Prove successful publication has content-derived slide/PNG/manifest counts and 1080×1350 PNG dimensions.
- Run `npm run test:renderer` and manually inspect one valid 7-slide and one valid 10-slide proof-topic run.

## Open Questions

None. The optional-but-warning-only `repeatJustification` interpretation resolves the milestone’s apparent “required but non-blocking” tension: absence is a deterministic review warning, never a render rejection.
