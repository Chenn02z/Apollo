# Spec: Free-Flow Slide Bodies

## Status

Verified

## Goal

Let `carousel-composer` author the copy and arrangement inside each slide body
without changing the fixed carousel shell, its shell-owned copy, the one-pass
render flow, or deterministic publication.

## Scenario

Given valid 7–10-slide `carousel-content.json` and `carousel-layout.json`,
`apollo-render` invokes `carousel-composer` once. The composer reads the content
as a creative brief and the layout as creative direction, then writes exactly
`slide-bodies/01.html` through `slide-bodies/NN.html`. Deterministic code accepts
only safe, self-contained HTML/SVG fragments, inserts them into the unchanged
`.slide-body` hosts, checks the assembled result in Chromium, and atomically
publishes the fragments, HTML, 1080×1350 PNGs, and manifest last.

## Architecture Reference

This spec opens only the live visual-composition seam recorded in
[`docs/ARCHITECTURE.md`](../ARCHITECTURE.md):

```text
validated content + validated layout direction
→ carousel-composer once
→ slide-bodies/<nn>.html
→ safe-fragment validation and fixed-shell assembly
→ reserved-body validation
→ Playwright PNG export
→ atomic four-member publication (manifest last)
```

It supersedes `0004`'s closed binding, primitive-vocabulary, plan-to-DOM, and
claim-fidelity contracts. It preserves the run-artifact, content/layout/HTML,
theme/HTML, HTML/export, validation, and publication boundaries.

## In Scope

- Reprompt `carousel-composer` as a free-flow body implementer with read-only
  access to the canonical shell and writes limited to the exact run-local
  numbered body files. Do not provide the template contract or theme CSS.
- Treat `slide.content` as a creative brief whose body copy may be rephrased,
  combined, omitted, or supplemented by the composer.
- Treat `carousel-layout.json` as creative direction, not a DOM contract.
- Bump the `database-blueprint` template contract to version 2 and remove its
  closed fragment vocabulary.
- Accept arbitrary safe nesting, non-reserved non-legacy class names,
  agent-authored HTML text, local SVG geometry, and validated inline styles.
- Retain exact-file, byte, UTF-8, symlink, protected-write, canonical-assembly,
  browser-containment, network-abort, export, rollback, and manifest-last
  checks.
- Reject `cp-*` classes from newly composed fragments.

## Out Of Scope

- Changes to slide count or order, shell markup or CSS, chrome, shell-owned
  copy, theme identity, output dimensions, export, or publication behavior.
- A visual-review or repair loop, composer retry, new agent, theme system,
  generated imagery, external asset, or CSS parser dependency.
- Deterministic verification that composer-authored supporting claims reproduce
  or follow from `slide.content`.
- A duplicate JSON artifact for final body copy or migration of completed runs.
- Cleanup of legacy `cp-*` CSS, which remains embedded in the canonical theme for
  compatibility but is unreachable to newly validated slide bodies because
  `cp-*` classes are rejected, or changes to historical `0004` milestone/spec
  records.

## Architecture Seams

- **Content ownership:** `carousel-content.json` remains authoritative for slide
  count, order, topic, number, role, title, why, and glossary. Only `content`
  becomes non-binding composer guidance.
- **Layout handoff:** `carousel-layout.json` remains validated art direction.
  Its DOM arrangement is neither prescribed nor compared with a fragment.
- **Composer boundary:** the composer receives validated content, validated
  layout, and the canonical shell, but not the template contract or theme CSS,
  and writes only the exact `slide-bodies/<nn>.html` set.
- **Final body copy:** those HTML files are the sole final rendered-body-copy
  artifact. Deterministic assembly does not create a parallel copy artifact.
- **Template/theme:** `database-blueprint` and the `database` theme remain
  art-director and deterministic-runtime inputs. The canonical shell is the
  composer's only visual source.
- **HTML/export:** deterministic code validates fragments, assembles the fixed
  shell, aborts browser network requests, measures visible containment, and
  exports PNGs.
- **Publication:** any composition, validation, assembly, browser, export, or
  publication failure restores the prior complete four-member renderer set or
  leaves no success manifest.

## Contracts

### Content and layout inputs

The existing root content contract, 7–10 slide count, numbering/order, role
rules, semantic `content` shapes, and plain-text validation remain unchanged.
For composition only, every slide's `content` object is a creative brief. Its
leaves need not appear in the fragment, and fragment body copy need not occur in
those leaves. Deterministic code performs no body claim-fidelity, coverage,
ordering, or `data-bind` check.

All shell-owned values are still deterministically escaped from validated
content and must appear byte-for-byte in their canonical shell locations:
topic, slide number, role, title, why, every glossary term and definition, and
footer chrome. The composer cannot emit or replace these locations.

The current layout schema and validation remain unchanged. A valid
`repeatJustification` is accepted but ignored after layout validation. The
composer may use every plan field as direction, but no fragment class,
structure, ordering, anchor, density, or arrangement is matched to the plan.
Repeated arrangements emit no warning.

### Template contract version 2

The `database-blueprint` contract version becomes `2`. Its template identity,
canonical shell/theme paths and asset hashes, motif vocabulary, and layout-
capability vocabulary and values remain unchanged. The `fragmentVocabulary`
member is removed rather than left empty. Version 1 remains historical and is
not a compatibility branch for new renders.

The composer prompt describes body authorship, the safe fragment boundary, and
the ownership rules above. Its agent configuration grants read-only access to
the canonical fixed shell but not the template contract or theme CSS. Its only
runtime writes remain the delegated body files; it cannot change content,
layout, history, template/archive, shell, theme, HTML, PNG, or manifest paths.

### Invocation and exact output set

The composer is invoked exactly once with the validated content path, validated
layout path, canonical shell path, and delegated `slide-bodies/` path. There is
no retry or repair. The art director and deterministic runtime retain their
version-2 template and theme inputs.

For `N` slides its complete output is exactly:

```text
slide-bodies/01.html
slide-bodies/02.html
...
slide-bodies/NN.html
```

- Two-digit zero padding is required for the supported 7–10 slides.
- `slide-bodies/` is a real directory, not a symlink.
- Every expected entry is a real regular file, not a symlink.
- Missing, extra, nested, temporary, hidden, or differently named entries fail.
- Every file is valid UTF-8, contains no BOM or NUL, and is at most 64 KiB.
- File `NN.html` belongs only to content slide number `NN`.

### Fragment document grammar

A fragment is parsed by deterministic anchored tokenization and an explicit tag
stack before it reaches a browser. It contains one or more top-level elements;
only ASCII whitespace may occur between them or before/after them. Top-level
text is invalid.

Each fragment contains substantive content: at least one HTML text node whose
entity-decoded value contains a non-whitespace character, or at least one
visible, nondegenerate SVG geometry with positive visible fill or visible
positive-width stroke paint. An empty wrapper tree, whitespace-only wrapper
tree, or empty/invisible SVG fails.

Tags are explicit, lowercase, and well nested. Every element has an opening and
closing tag; self-closing and implicitly closed syntax is invalid. Comments,
doctype, CDATA, processing instructions, namespace declarations, malformed
tokens, and disallowed control characters are invalid.

Allowed HTML tags are:

```text
section div article figure figcaption p h3 span strong em code pre
ul ol li blockquote
```

Allowed SVG tags are:

```text
svg g line polyline polygon rect circle ellipse
```

HTML elements may nest freely when the browser preserves the parsed structure.
An `svg` contains only `g` or geometry children; `g` contains only geometry
children; geometry elements contain no children. SVG cannot contain HTML.

The validator performs an inert browser parse after static parsing. The browser
result must preserve, in order, every element's tag, parent, and child count and
must place HTML nodes in the HTML namespace and `svg` plus its descendants in
the SVG namespace. Browser repair, reparenting, insertion, removal, or namespace
change is a syntax failure.

Text is allowed inside HTML elements but not inside SVG. Literal `&` or `<` in
text must be encoded. The only named references are `&amp;`, `&lt;`, `&gt;`,
`&quot;`, `&apos;`, `&#39;`, and `&nbsp;`. Decimal `&#D+;` and hexadecimal
`&#xH+;` references are allowed only when they decode to a Unicode scalar that is
not NUL or a disallowed control character. References in attribute values and
every other named, malformed, surrogate, or out-of-range reference fail.

### HTML attributes and classes

HTML elements accept only `class` and `style`, each at most once and with a
double-quoted value. Every `id`, `data-*` (including `data-bind`), `aria-*`,
event, resource, navigation, executable, form, frame, and unknown attribute is
invalid.

`class` is a nonempty ASCII-whitespace-separated list of unique tokens. Each
token matches `[A-Za-z_][A-Za-z0-9_-]*`. Arbitrary matching tokens are allowed
except tokens beginning `cp-` and these shell-reserved exact tokens:

```text
carousel-slide slide-content masthead brand section-label content tag
why why-label slide-body glossary glossary-term glossary-definition footer
```

Fragments cannot use legacy `cp-*` primitives or reserved classes to impersonate
or target fixed chrome. There is no required root class, semantic wrapper,
class-to-element mapping, or plan-derived class.

### Safe SVG

SVG remains optional and decorative. Each `svg` contains at least one geometry
descendant, and across one fragment there are at most 128 SVG elements. SVG
accepts no text, raw character data, path, definition or reuse element,
external content, reference, URL, ID, event, transform, animation, filter,
mask, clip path, marker, or namespace attribute.

An `svg` has exactly the existing required geometry-space attributes plus
optional `class` and `style`:

```text
viewBox="0 0 1000 600"
preserveAspectRatio="xMidYMid meet"
aria-hidden="true"
focusable="false"
```

`g` accepts only optional `class` and `style`. Geometry attributes are:

| Element | Required | Optional |
|---|---|---|
| `line` | `x1`, `y1`, `x2`, `y2` | `class`, `style` |
| `polyline`, `polygon` | `points` | `class`, `style` |
| `rect` | `x`, `y`, `width`, `height` | `rx`, `ry`, `class`, `style` |
| `circle` | `cx`, `cy`, `r` | `class`, `style` |
| `ellipse` | `cx`, `cy`, `rx`, `ry` | `class`, `style` |

Geometry values are canonical base-10 integers. Line endpoints and every point
stay within `x=0..1000`, `y=0..600`; `points` has 2–64 comma-separated `x,y`
pairs. Rectangles have positive width/height and remain inside the viewBox;
optional nonnegative `rx`/`ry` do not exceed half the corresponding dimension.
Circles and ellipses have positive radii and remain inside the viewBox. These
are the version-1 geometry and viewBox limits without its class restrictions.

### Inline style grammar

No CSS parser dependency is added. A nonempty `style` value is parsed as:

```text
declaration (";" declaration)* ";"?
declaration = lowercase-property ":" value
```

Only ASCII space may surround tokens. Empty or duplicate declarations,
comments, backslashes or escapes, custom properties, `var`, at-rules, braces,
newlines, embedded quotes except the `font-family` form below, and unknown
properties fail. Values are matched in full against the property grammar; a
semicolon or colon cannot occur inside a value.

The following lowercase properties and values are allowed:

| Group | Properties | Values |
|---|---|---|
| display/position | `display` | `block`, `inline`, `inline-block`, `grid`, `flex`, `inline-grid`, `inline-flex` |
| | `position` | `static`, `relative`, `absolute` |
| grid | `grid-template-columns`, `grid-template-rows` | 1–12 space-separated tracks |
| | `grid-column`, `grid-row` | `auto`, a positive integer, or `span` plus a positive integer |
| | `grid-auto-flow` | `row`, `column`, `dense`, `row dense`, `column dense` |
| flex | `flex-direction` | `row`, `row-reverse`, `column`, `column-reverse` |
| | `flex-wrap` | `nowrap`, `wrap`, `wrap-reverse` |
| | `flex-grow`, `flex-shrink` | a nonnegative canonical number |
| | `flex-basis` | `auto` or an unsigned length |
| | `order` | a canonical integer |
| alignment | `justify-content`, `align-content` | `normal`, `start`, `end`, `center`, `space-between`, `space-around`, `space-evenly`, `stretch` |
| | `justify-items`, `align-items`, `justify-self`, `align-self` | `auto`, `normal`, `start`, `end`, `center`, `stretch` |
| spacing | `gap`, `row-gap`, `column-gap` | one unsigned length; `gap` also accepts two |
| box sizing | `box-sizing` | `content-box`, `border-box` |
| dimensions | `width`, `height`, `min-width`, `min-height` | `auto` or an unsigned length |
| | `max-width`, `max-height` | `none` or an unsigned length |
| inset | `top`, `right`, `bottom`, `left`, `inset` | `auto` or a signed length; `inset` accepts 1–4 |
| margin | `margin`, `margin-top`, `margin-right`, `margin-bottom`, `margin-left` | `auto` or a signed length; shorthand accepts 1–4 |
| padding | `padding`, `padding-top`, `padding-right`, `padding-bottom`, `padding-left` | an unsigned length; shorthand accepts 1–4 |
| typography | `font-family` | 1–4 comma-separated single-quoted safe names |
| | `font-size` | a positive length |
| | `font-weight` | `normal`, `bold`, or `100` through `900` by 100 |
| | `font-style` | `normal`, `italic` |
| | `line-height` | `normal`, a positive number, or a positive length |
| | `letter-spacing` | `normal` or a signed length |
| | `text-align` | `start`, `end`, `left`, `right`, `center` |
| | `text-transform` | `none`, `uppercase`, `lowercase`, `capitalize` |
| | `text-decoration` | `none`, `underline`, `line-through` |
| | `white-space` | `normal`, `nowrap`, `pre`, `pre-wrap`, `pre-line`, `break-spaces` |
| | `overflow-wrap` | `normal`, `break-word`, `anywhere` |
| | `word-break` | `normal`, `break-all`, `keep-all` |
| color | `color`, `background-color` | an opaque hex color or `currentcolor` |
| border | `border-width` | 1–4 unsigned pixel widths in CSS top/right/bottom/left order |
| | `border-top-width`, `border-right-width`, `border-bottom-width`, `border-left-width` | one unsigned pixel width |
| | `border-style` | 1–4 of `none`, `solid`, `dashed`, `dotted` in CSS top/right/bottom/left order |
| | `border-top-style`, `border-right-style`, `border-bottom-style`, `border-left-style` | one of `none`, `solid`, `dashed`, `dotted` |
| | `border-color` | 1–4 opaque colors in CSS top/right/bottom/left order |
| | `border-top-color`, `border-right-color`, `border-bottom-color`, `border-left-color` | one opaque color |
| | `border-radius` | 1–4 unsigned lengths |
| SVG paint | `fill`, `stroke` | `none`, an opaque color, or `currentcolor` |
| | `stroke-width` | a positive number or positive length |
| | `stroke-linecap` | `butt`, `round`, `square` |
| | `stroke-linejoin` | `miter`, `round`, `bevel` |

For each of `border-width`, `border-style`, and `border-color`, one value applies
to all sides; two apply to top/bottom then left/right; three apply to top, then
left/right, then bottom; and four apply to top, right, bottom, then left.

An opaque color is `#RGB` or `#RRGGBB`; alpha-bearing hex and `transparent` are
invalid. A safe font name matches `[A-Za-z][A-Za-z0-9 -]{0,63}` inside single
quotes. A canonical unsigned number is `0`, a positive integer without a
leading zero, or either followed by a decimal fraction with at least one digit.
A positive number is greater than zero. A canonical integer is `0` or an
optional `-` plus a positive integer. An unsigned length is `0` or a positive
number plus `px`, `em`, `rem`, or `%`; a signed length additionally permits `-`
before a nonzero length. A track is an unsigned length, positive `fr` length,
`auto`, `min-content`, or `max-content`. Parentheses and every function are
invalid.

All unlisted properties are invalid, including `overflow`, `visibility`,
`opacity`, `content-visibility`, `clip`, `clip-path`, `mask`, `filter`,
`transform`, `z-index`, generated content, images, transitions, and animations.
Values containing resource or executable tokens such as `url`, `javascript`,
`vbscript`, `data:`, `@import`, `expression`, `behavior`, or `-moz-binding` are
rejected case-insensitively before property parsing. `fixed`, `sticky`,
and `transparent` are invalid. Zero lengths and zero border widths remain valid
where their property grammar permits them. The explicit hiding failures are
`font-size: 0`, numeric `line-height: 0`, text with computed color alpha zero,
and SVG geometry with neither visible fill nor a visible positive-width stroke.
`fill: none` remains valid when the same geometry has a visible positive-width
stroke.

### Canonical assembly and browser safety

The canonical shell and theme CSS are unchanged. Legacy `cp-*` CSS remains
embedded in the canonical theme for compatibility but is unreachable to newly
validated slide bodies because `cp-*` classes are rejected. Deterministic code
escapes and inserts shell-owned content, then inserts each validated fragment
only as children of its matching `.slide-body`. A fragment cannot wrap or replace
the host. Assembly proves:

- HTML slide count/order equals validated content.
- Every shell-owned value and chrome node equals the canonical source.
- Every fragment node is under exactly one matching `.slide-body`.
- Reassembly from the same inputs is byte-identical.
- Static assembled HTML contains no script, event, form, frame, URL, external
  resource, or noncanonical shell/theme mutation.

The exporter compares staged HTML with canonical recomputation, opens only the
local document with all network routes aborted, and awaits
`document.fonts.ready`. For every 1080×1350 slide:

- `.slide-body` exists exactly once and has positive width and height.
- Its `scrollWidth <= clientWidth` and `scrollHeight <= clientHeight`.
- Every rendered descendant client rect, including SVG, stays within the host
  rect with 0.5 CSS-pixel tolerance on each edge.
- Every non-whitespace HTML text node has at least one positive-size `Range`
  rect, and every such rect stays within the host.
- No body descendant has computed `position: fixed` or `sticky`, `display:
  none`, `visibility: hidden` or `collapse`, `content-visibility: hidden`, or
  zero opacity. HTML descendants cannot compute to `overflow: hidden` or
  `clip`, clipping, masking, or filtering.
- Text and its ancestor chain must remain displayed and visible. `font-size: 0`,
  numeric `line-height: 0`, computed text color alpha zero, or a text range with
  no positive-size rect fails.
- Every SVG geometry has a nondegenerate `getBBox()` in at least one dimension
  and either visible positive-alpha fill or visible positive-alpha,
  positive-width stroke. `fill: none` is valid only when that stroke condition
  holds; geometry with neither visible paint path fails.
- Existing whole-slide descendant containment, count, dimension, and screenshot
  checks still pass.

Any violation reports `BODY_OVERFLOW` with the slide number and a zero-based
element-child path from `.slide-body`; text failures append a text-node index.
Whitespace-only text nodes do not affect element indexes. Overflow, hiding, or
clipping is rejected, never cropped into a successful export.

### Protected writes and publication

The `0004` stage order and transactional boundary remain:

1. Validate content; prepare, invoke once, protect, and validate layout.
2. Validate the run, version-2 contract, archive, canonical shell/theme, and
   prior renderer state; back up a prior complete four-member renderer set
   outside the run and withhold/remove the success manifest first.
3. Create the empty canonical body directory, snapshot every protected path,
   invoke the composer once, and stage candidate HTML, slides, and manifest
   outside the run.
4. Compare snapshots before parsing fragments. Any mutation outside the
   delegated body directory fails.
5. Validate the exact output set and each fragment in filename order, assemble
   canonical HTML, run static and browser checks, export every PNG, and validate
   dimensions and manifest data.
6. Install `slide-bodies/`, `index.html`, and `slides/`, then atomically rename
   `render-manifest.json` into place last.

Snapshot format, protected paths, lexical ordering, metadata exclusions,
rollback, and stale-output behavior remain those verified by `0003` and `0004`.
Any in-process failure removes candidate members and restores every member of a
prior complete set byte-for-byte. Without one, it removes partial renderer
candidates and leaves no manifest. Network requests always abort.

### Diagnostics

Retain the existing deterministic stderr and JSONL proof-log shape and these
applicable error codes:

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
FRAGMENT_STYLE
FRAGMENT_SVG
ASSEMBLY_OUTPUT
ASSEMBLY_FIDELITY
BODY_OVERFLOW
RENDER_EXPORT
RENDER_PUBLICATION
```

Remove `FRAGMENT_ROOT`, `FRAGMENT_PLAN`, `FRAGMENT_BINDING`, and
`FRAGMENT_SEMANTICS`, plus `COMPOSER_REPEAT_UNJUSTIFIED` and
`COMPOSER_EQUAL_COLUMNS`; their rejected contracts no longer exist. Fixed first
error order is preparation, protected mutation, exact output set, then per-file
bytes/syntax/tag/attribute/class/style/SVG in lexical filename order, assembly,
ascending-slide browser checks, export, and publication.

## Failure Modes

- Invalid content or layout still fails before composer invocation.
- Missing, extra, nested, symlinked, oversized, invalid-UTF-8, malformed, unsafe,
  resource-loading, hidden, clipped, legacy-class, or shell-impersonating
  fragments fail before assembly or browser export as applicable.
- A composer protected-write mutation fails before any fragment is trusted.
- Browser repair, namespace change, body overflow, invisible content, network
  attempt, screenshot/dimension mismatch, canonical assembly mismatch, manifest
  mismatch, or publication failure cannot publish a success manifest.
- Composer-authored copy that differs from content leaves is not a deterministic
  failure. Its supporting-claim accuracy relies on the composer prompt.
- No failure retries the director or composer or starts a visual repair loop.
- Every failure restores the prior complete renderer set byte-for-byte or,
  without one, removes candidates and leaves content/layout inspectable with no
  success manifest.

## Acceptance Criteria

- Novel safe body nesting, arbitrary non-reserved non-legacy class names, local
  SVG, inline grid/flex/absolute layouts, and agent-authored copy absent from
  content leaves all validate and render; `cp-*` classes fail validation.
- No `data-bind`, semantic wrapper, closed hierarchy, plan-to-DOM, arrangement
  warning, or claim-fidelity requirement remains.
- Valid 7- and 10-slide runs preserve exact shell-owned topic, number, role,
  title, why, glossary, and chrome and export one 1080×1350 PNG per slide.
- The version-2 template retains identity, assets, motif, and layout capabilities
  and omits `fragmentVocabulary`; the art director and deterministic runtime
  retain it while the composer does not receive it or the theme CSS.
- Malformed markup, extra files, scripts, executable attributes, forms, frames,
  URLs, external assets, unsafe styles, invisible content, and overflow are
  rejected before successful publication.
- Empty or whitespace-only wrapper trees and empty, degenerate, or invisibly
  painted SVG fragments are rejected.
- Canonical assembly, protected writes, network abortion, rollback, and
  manifest-last publication retain their verified behavior.
- Completed runs and historical `0004` records require no migration or edits.

## Verification

- Adjust existing positive fragment cases to use non-legacy classes and existing
  class-rejection cases to cover `cp-*`; add no dedicated legacy-class test.
- Retain positive fragment cases for multiple roots, novel nesting/classes, all
  allowed text references, arbitrary body copy, safe SVG, and inline grid, flex,
  relative/absolute, typography, box, border, and SVG-paint declarations.
- Add table-driven negative cases for top-level text, malformed/implicit tags,
  browser reparenting or namespace changes, comments, invalid entities,
  disallowed tags/attributes, reserved classes, `data-bind`, scripts, handlers,
  forms, frames, URLs, resource tokens, empty/whitespace-only bodies, and every
  unsafe-style family.
- Cover exact dimension `auto`/`none` ownership, component-only border
  shorthands and side properties, legal zero lengths/border widths, forbidden
  zero text, and `fill: none` with and without a visible positive-width stroke.
- Retain strict SVG tests for structure, attributes, geometry bounds, viewBox,
  128-element limit, and rejected text/path/reference/transform/resource forms.
- Exercise browser checks for safe bodies; horizontal/vertical and each-edge
  overflow; absolute escape; hidden/clipped/zero text; invisible SVG; text-range
  paths; local fonts; and network abortion.
- Exercise 7- and 10-slide fixtures proving exact shell topic, number, role,
  title, why, glossary, unchanged chrome, content-derived HTML/PNG/manifest
  counts, and 1080×1350 PNG dimensions.
- Retain exact-file, UTF-8, size, symlink, protected-write, canonical-
  recomputation, stale-output, rollback, no-prior-set cleanup, export-failure,
  publication-failure, and manifest-installed-last regression coverage.
- Prove valid `repeatJustification` is accepted and ignored and repeated body
  arrangements produce no warning.
- Run `npm run test:renderer` and inspect one successful 7-slide and one
  successful 10-slide proof-topic run.

## Open Questions

None. Supporting-claim accuracy and visual quality are intentionally prompt-
owned within this milestone; deterministic validation owns only the explicit
safety and publication contracts above.
