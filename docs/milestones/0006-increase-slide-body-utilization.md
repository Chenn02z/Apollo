# Milestone: Increase Slide Body Utilization

## Status

Verified

## Goal

Make every slide contain substantive visible teaching content whose qualifying
geometry spans at least 70% of its available body height, without weakening
overflow, rollback, or publication guarantees.

## MVP Deliverable

Every slide in a successful 7–10-slide run, including hooks and takeaways,
contains a concrete core idea plus at least two distinct, nonredundant concrete
supports, and its qualifying visible text rectangles and painted SVG geometry
span at least 70% of the `.slide-body` CSS content-box height. The composer gets its existing single
correction opportunity when staged HTML is underfilled, and the renderer repeats
the same deterministic measurement immediately before atomic publication.

## Developer Workflow

This milestone extends the existing generation, review, art-direction,
composition, and renderer stages. It does not add another stage or retry loop.
The composer authors the same exact fragment set, deterministic code assembles
the same canonical staged HTML, and the renderer publishes the same four-member
artifact set with the manifest last.

## In Scope

- Require `carousel-writer` to give every slide brief, including hooks and
  takeaways, a concrete core idea plus at least two distinct, nonredundant
  concrete supports. Support categories are contextual: mechanism,
  consequence, constraint or trade-off, example or comparison, or ordered
  steps. Rephrasing the core idea does not count as support.
- Require `carousel-reviewer` to emit a slide-specific finding for every slide
  below that minimum. Such a review cannot `approve` and must use an existing
  revision-triggering decision and the existing review schema. Repetition and
  filler do not count as substantive depth.
- Retain the art director's existing density enum while defining `sparse` as
  fewer, larger elements distributed through the body rather than a small
  centered island. Visual scale cannot substitute for teaching depth.
- Remove the composer's minimum-body-structure bias. It preserves all
  non-redundant teaching points and distributes text and diagrams through at
  least 70% of the body height. Spacing or enlargement cannot substitute for
  teaching depth.
- Add deterministic `BODY_UNDERFILL` validation based on visible body text
  rectangles and painted SVG geometry clipped to the `.slide-body` CSS content
  box.
- Measure underfill during the composer's existing check and single correction
  opportunity, then perform a fresh prepublication measurement. Both checks use
  the same deterministic implementation against canonical staged HTML.
- Preserve existing overflow validation independently from underfill
  validation.
- Preserve atomic rollback and manifest-last publication behavior when the
  final measurement fails.

## Out of Scope

- New schemas, agents, dependencies, theme access, repair loops, migrations, or
  changes to current text ceilings or retry counts.
- A new semantic detector in the renderer. Deterministic validation enforces
  geometry; the writer, reviewer, and manual proof review enforce substantive
  content and reject filler or unnecessary repetition.
- Changes to slide count, order, shell-owned copy, fixed shell markup, chrome,
  theme CSS, dimensions, export format, or the composer's exact write boundary.
- Rewriting the historical `0005` milestone or spec.

## Measurement Contract

For each slide, deterministic validation collects the rectangles of visible
body text and painted SVG geometry, clips each rectangle to the `.slide-body`
CSS content box, and computes:

```text
span = max(clippedBottom) - min(clippedTop)
ratio = span / .slide-body CSS content-box height
```

No qualifying rectangles produces a ratio of `0`. The unrounded ratio must be
greater than or equal to `0.70`; there is no tolerance. Wrappers, backgrounds,
borders, padding, empty cards, and `svg` or `g` container boxes never qualify.
Only painted SVG geometry qualifies.

Deterministic failures are ordered with all overflow findings first in
ascending slide order, followed by all `BODY_UNDERFILL` findings in ascending
slide order.

## Scenarios

- A slide whose qualifying geometry spans 69.9% of its body fails with
  `BODY_UNDERFILL`; one spanning exactly 70% passes underfill validation.
- An empty full-height wrapper fails because its wrapper, background, border,
  and padding do not qualify as qualifying geometry.
- A wide but shallow strip of cards fails because horizontal extent does not
  increase its vertical span.
- Distributed text, sequence, comparison, and SVG-led compositions pass when
  their qualifying rectangles span at least 70% of the body.
- A slide can report overflow even when its qualifying geometry also spans at
  least 70%; overflow remains an independent failure and is reported before
  underfill.
- If the composer initially produces underfilled canonical staged HTML, it may
  use only its existing single correction opportunity. A fresh failure before
  publication restores the prior complete publication byte-for-byte or, when
  none exists, leaves no success manifest.
- A writer brief that merely rephrases its core idea, or supplies only one
  concrete support, is underdeveloped. The reviewer identifies that slide and
  uses an existing revision-triggering decision rather than `approve`.
- A visually large or widely spaced composition remains semantically
  underdeveloped when its brief lacks a concrete core idea and two distinct
  supports.

## Architecture Seams

- `carousel-content.json` remains authoritative for slide count, order, and
  shell-owned fields; writer and reviewer changes strengthen the semantic brief
  without changing its schema.
- `carousel-layout.json` retains its existing schema and density enum; the
  meaning of sparse direction changes without adding a layout field.
- `carousel-composer` retains its current inputs, exact `slide-bodies/` write
  boundary, and single correction opportunity.
- Canonical staged HTML is the sole browser-measurement input for both the
  composer check and the fresh prepublication check.
- Deterministic code owns geometric underfill and overflow validation. Semantic
  quality remains with the writer, reviewer, and manual proof review.
- The existing four-member publication boundary remains `slide-bodies/`,
  `index.html`, `slides/`, and `render-manifest.json`, published atomically with
  the manifest last.

## Specs

- `docs/specs/0006-increase-slide-body-utilization.md`

## Acceptance Criteria

- Every slide, including hooks and takeaways, must achieve an unrounded
  qualifying vertical-span ratio of at least `0.70` with no tolerance.
- A 69.9% span is rejected and an exact 70% span is accepted.
- Empty full-height wrappers and wide shallow card strips are rejected.
- Distributed text, sequence, comparison, and painted-SVG compositions are
  accepted when their qualifying rectangles meet the threshold.
- Wrapper, background, border, padding, empty-card, `svg`, and `g` container
  rectangles cannot satisfy the threshold; no qualifying rectangles yields
  ratio `0`.
- Existing overflow failures remain independent and are reported for all slides
  in ascending order before underfill failures are reported in ascending order.
- The composer check and fresh prepublication check use the same deterministic
  measurement against canonical staged HTML and add no correction beyond the
  existing single opportunity.
- A final `BODY_UNDERFILL` failure restores the prior four-member publication
  byte-for-byte or leaves no manifest when no prior successful publication
  exists.
- Every slide brief, including hooks and takeaways, contains a concrete core
  idea plus at least two distinct, nonredundant concrete supports drawn
  contextually from mechanisms, consequences, constraints or trade-offs,
  examples or comparisons, or ordered steps; rephrasing the core does not count.
- The reviewer emits a slide-specific finding for every slide below the content
  minimum, cannot `approve` such a carousel, and uses an existing
  revision-triggering decision and schema.
- The art director distributes sparse layouts and the composer preserves
  nonredundant teaching points; visual scale, spacing, and enlargement cannot
  substitute for teaching depth.
- Existing content and review schemas, text ceilings, and retry counts remain
  unchanged.

## Verification

- Add deterministic boundary cases for 69.9%, exact 70%, zero qualifying
  rectangles, empty full-height wrappers, shallow card strips, and ignored SVG
  container boxes.
- Add passing cases for distributed text, sequence, comparison, and painted-SVG
  compositions.
- Verify overflow and underfill can fail independently and that diagnostics use
  the required category and slide ordering.
- Verify the composer check and fresh prepublication check use canonical staged
  HTML and the same measurement, with no added repair attempt.
- Verify underfill failure preserves a prior four-member publication
  byte-for-byte and leaves no manifest when no prior publication exists.
- Complete successful 7-slide and 10-slide proof runs. Manually inspect every
  slide brief, including hooks and takeaways, for one concrete core idea and at
  least two distinct, nonredundant concrete supports, then inspect every PNG for
  the 70% threshold and confirm that filler, repetition, visual scale, spacing,
  or enlargement is not being used to satisfy teaching depth.
- Exercise reviewer proof cases where a named slide has zero or one concrete
  support, or only rephrases its core idea; verify each produces a slide-specific
  finding and an existing revision-triggering decision rather than `approve`.
- Run the complete renderer regression suite.

Verification exception: Playwright Chromium cannot launch in this sandbox, so
real-browser geometry checks and manual 7/10 PNG and semantic proof remain for
a launch-capable environment. Non-browser targeted checks passed.

## Settled Decisions

- Vertical span, not occupied area or element count, is the utilization metric.
- The threshold is 70% for every slide role.
- The denominator is the `.slide-body` CSS content-box height.
- Measurements are unrounded and use no tolerance.
- Current text ceilings remain unchanged unless proof evidence later shows they
  are a binding constraint.
- Every slide brief requires one concrete core idea and at least two distinct,
  nonredundant concrete supports; their categories depend on the subject.
- Existing schemas and retry counts remain unchanged.
- Geometry is deterministic; semantic substance remains an agent and manual
  proof responsibility.
- `0006` changes the live Verified `0005` composition contract without
  modifying historical milestone or spec files.

## Blocking Questions

None.
