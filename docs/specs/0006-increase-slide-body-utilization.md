# Spec: Increase Slide Body Utilization

## Status

Accepted

## Goal

Make every slide contain substantive visible teaching content whose qualifying
geometry spans at least 70% of its available body height, without weakening
overflow, rollback, or publication guarantees.

## Scenario

Given a valid 7–10-slide run, including hook and takeaway slides, the writer
brief for every slide contains a concrete core idea plus at least two distinct,
nonredundant concrete supports. The reviewer requests revision with a finding
for every deficient slide. The art director treats `sparse` as fewer, larger
elements distributed through the body, and the composer preserves the brief's
nonredundant teaching points while distributing qualifying visible text and
painted SVG geometry through at least 70% of the `.slide-body` CSS content-box
height.

The composer's existing check and single correction opportunity measure the
canonical assembled in-memory HTML. A fresh prepublication check repeats the
same shared deterministic browser measurement against canonical assembled
in-memory HTML. Underfill never suppresses overflow or vice versa. A final
failure restores the prior complete four-member publication byte-for-byte or,
when none exists, leaves no success manifest.

The following cases define the required behavior:

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

## Architecture Reference

This spec changes only the live `0005-free-flow-slide-bodies` composition seam
and the **Accepted Body-Utilization Seam (Pending Implementation)** recorded in
[`docs/ARCHITECTURE.md`](../ARCHITECTURE.md):

```text
validated content brief + validated layout direction
→ carousel-composer
→ slide-bodies/<nn>.html
→ safe-fragment validation and fixed-shell assembly
→ shared browser overflow + body-span measurement
→ Playwright export
→ fresh shared prepublication measurement
→ atomic four-member publication (manifest last)
```

The Verified `0005` contract remains live until this spec is Accepted,
implemented, and verified. This spec strengthens semantic briefs and adds one
geometric invariant inside existing checks; it does not reopen the fixed shell,
theme, export, rollback, publication, or exact composer-write boundaries.

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
  nonredundant teaching points and distributes text and diagrams through at
  least 70% of the body height. Spacing or enlargement cannot substitute for
  teaching depth.
- Add deterministic `BODY_UNDERFILL` validation based on visible body text
  rectangles and painted SVG geometry clipped to the `.slide-body` CSS content
  box.
- Measure underfill during the composer's existing check and single correction
  opportunity, then perform a fresh prepublication measurement. Both checks use
  one shared deterministic browser implementation against canonical assembled
  in-memory HTML.
- Preserve existing overflow validation independently from underfill
  validation.
- Preserve atomic rollback and manifest-last publication behavior when the
  final measurement fails.

## Out Of Scope

- New schemas, agents, dependencies, theme access, repair loops, migrations, or
  changes to current text ceilings or retry counts.
- A new semantic detector in the renderer. Deterministic validation enforces
  geometry; the writer, reviewer, and manual proof review enforce substantive
  content and reject filler or unnecessary repetition.
- Changes to slide count, order, shell-owned copy, fixed shell markup, chrome,
  theme CSS, dimensions, export format, or the composer's exact write boundary.
- Changes to existing fragment safety, layout validation, screenshot, shell
  containment, or network-abort contracts.
- Rewriting the historical `0005` milestone or spec.

## Architecture Seams

- **Content ownership:** `carousel-content.json` remains authoritative for slide
  count, order, and shell-owned fields. Writer and reviewer prompts strengthen
  each existing slide brief without changing the content or review schema,
  text ceilings, attempt counts, or revision counts.
- **Layout handoff:** `carousel-layout.json` retains its existing schema and
  density enum. Only the prompt meaning of `sparse` changes; no layout field or
  deterministic semantic-layout validator is added.
- **Composer boundary:** `carousel-composer` retains its current inputs, exact
  `slide-bodies/<nn>.html` write boundary, invocation count, two-check ceiling,
  and single correction opportunity.
- **Canonical measurement:** canonical assembled in-memory HTML is the sole
  browser-measurement input for both the composer check and the fresh
  prepublication check. Both call one shared deterministic implementation.
- **Validation ownership:** deterministic code owns geometric underfill and
  overflow validation. Semantic quality remains with the writer, reviewer, and
  manual proof review.
- **Shell and theme:** the canonical fixed shell, shell-owned copy, theme CSS,
  local assets, 1080×1350 dimensions, and network-aborted browser boundary
  remain unchanged.
- **Publication:** the four-member boundary remains `slide-bodies/`,
  `index.html`, `slides/`, and `render-manifest.json`; publication remains
  atomic with the manifest last. Any final failure restores the prior complete
  set byte-for-byte or leaves no success manifest.

## Contracts

### Writer and reviewer prompts

The writer prompt requires every slide brief, including hook and takeaway
slides, to state one concrete core idea plus at least two distinct,
nonredundant concrete supports. Supports may be mechanisms, consequences,
constraints or trade-offs, examples or comparisons, or ordered steps according
to the subject. A restatement of the core idea, filler, or repetition is not a
support. Existing schema, field ceilings, validation, three-attempt writer
ceiling, two-revision ceiling, and three-review ceiling remain unchanged.

The reviewer prompt evaluates this minimum slide by slide. It emits one
slide-specific finding for every deficient slide, cannot return `approve` while
any slide is deficient, and selects an existing revision-triggering decision.
It does not add a field, finding type, decision, or retry.

### Art direction and composition prompts

The art-director prompt keeps the existing density enum and defines `sparse` as
fewer, larger elements distributed through the available body rather than a
small centered island. Larger scale alone is not teaching depth.

The composer prompt removes any preference for a minimum repeated body
structure. It requires the composer to preserve all nonredundant teaching
points and arrange qualifying text and diagrams so their vertical span reaches
at least 70% of the body. Filler, repetition, extra spacing, or enlargement
cannot replace semantic substance. The existing invocation, exact output set,
fragment grammar, check command, and single correction opportunity remain
unchanged.

### Qualifying rectangles

For each `.slide-body`, the shared browser measurement first derives the
content-box rectangle from the element's rendered box and computed border and
padding. Its height is the denominator.

Only these rendered descendants contribute candidate rectangles:

- client rectangles for visible non-whitespace body text; and
- client rectangles for painted SVG geometry elements with visible positive
  fill or visible positive-width stroke.

Each candidate rectangle is intersected with the body content-box rectangle.
Only a nonempty clipped rectangle qualifies. Wrappers, backgrounds, borders,
padding, empty cards, whitespace-only text, and `svg` or `g` container boxes
never qualify. Horizontal extent and union area are irrelevant.

For the complete qualifying rectangle set:

```text
span = max(clippedBottom) - min(clippedTop)
ratio = span / .slide-body CSS content-box height
```

If no rectangle qualifies, `ratio = 0`. The comparison uses the unrounded
ratio; `ratio >= 0.70` passes and any lower value fails. There is no tolerance.
This is a vertical-span measurement, not occupied area, rectangle union,
element count, or visual-size scoring.

### Shared checks and diagnostic ordering

The composer's existing check and the fresh check immediately before atomic
publication invoke the same deterministic browser measurement on canonical
assembled in-memory HTML. The prepublication call is fresh rather than reuse of
the composer-check result. No second implementation, cached result, new stage,
or added correction is allowed.

Each check evaluates every slide for both existing overflow and underfill. It
collects all overflow findings in ascending slide order, then all
`BODY_UNDERFILL` findings in ascending slide order. An overflowing slide is
still measured for underfill; neither category suppresses the other.

### Failure and publication

An initial composer-check underfill is eligible only for the composer's
existing single correction, followed by its existing final check. A remaining
failure ends composition without publication. A fresh prepublication failure
ends the render before publication. In either path, the previous complete
`slide-bodies/`, `index.html`, `slides/`, and `render-manifest.json` are
preserved byte-for-byte; without a previous successful publication, no success
manifest exists. The manifest remains the last published member.

## Failure Modes

- A ratio below `0.70`, including `0.699`, produces `BODY_UNDERFILL`; exact
  `0.70` passes underfill.
- No qualifying rectangle produces ratio `0` and `BODY_UNDERFILL`.
- A full-height wrapper, background, border, padding box, empty card, or
  `svg`/`g` container cannot raise the ratio.
- A wide but vertically shallow composition fails because the contract measures
  vertical span rather than area or horizontal coverage.
- Hidden or whitespace-only text and unpainted SVG geometry do not qualify.
- Overflow and underfill are both reported when both apply, with all overflow
  findings before all underfill findings and ascending slide order inside each
  category.
- An initial underfill may consume only the existing correction opportunity; a
  failed second composer check stops without another repair.
- A fresh prepublication underfill failure rolls back the prior four-member
  publication byte-for-byte or leaves no manifest when there is no prior
  publication.
- A brief with zero or one distinct support, or supports that only restate the
  core, is deficient. The reviewer must name that slide and cannot approve.
- Filler, repetition, spacing, or enlargement may increase apparent size but do
  not satisfy the semantic prompt contract.

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
- Run `npm run test:renderer` as the complete renderer regression suite.

## Open Questions

None.
