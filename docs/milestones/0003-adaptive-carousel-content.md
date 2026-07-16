# Milestone: Adaptive Carousel Content v2

## Status

Verified

## Goal

Produce deeper technical carousels by letting a v2 content artifact use the
number of slides its distinct teaching beats need, while preserving the
shipped v1 seven-slide workflow unchanged.

## MVP Deliverable

For a technical topic, a creator can use `apollo-generate-v2` then
`apollo-render-v2` to generate and render a 6–10 slide v2 carousel whose
closed role sequence is selected from the topic's teaching beats, and whose
slides give concrete explanations rather than generic advice or recap copy.

## In Scope

- Separate `apollo-generate-v2` and `apollo-render-v2` entry points, while the
  existing `apollo-generate` and `apollo-render` remain the unchanged v1
  defaults.
- A v2 content contract and writer guidance that coexist with v1.
- A content-derived slide count from 6 through 10, inclusive; no separate
  user-facing count setting.
- A closed role set: `hook`, `overview`, `concept`, `example`, `deep-dive`,
  `interview`, and `takeaway`. `hook` is first, `overview` is second and occurs
  exactly once, and `takeaway` is last. Intermediate roles may repeat;
  `interview` is optional.
- A concrete-content rubric: each substantive slide teaches a named mechanism,
  failure mode, trade-off, decision rule, or worked example; generic advice
  and duplicate recap copy do not satisfy the rubric. This is writer policy
  and manual-review evidence, not deterministic validation.
- V2 field limits: title ≤80 characters, body ≤300 characters, and zero to
  four items of ≤100 characters each; no markup in these fields.
- A v2 renderer/export/manifest path that derives the slide count and ordered
  PNG artifacts from the valid v2 content artifact and reports deterministic
  overflow diagnostics.

## Out Of Scope

- Altering v1 content, validators, renderer behavior, manifests, or existing
  run artifacts.
- More than 10 slides, a user-configurable slide-count option, or unbounded
  copy.
- Research/citations, visual review or repair, new themes, publishing, and
  analytics.

## Architecture Seams

- V2 is a parallel content-to-render path entered only through
  `apollo-generate-v2` and `apollo-render-v2`; v1 entry points and its fixed
  seven-slide contract remain unchanged.
- The renderer, PNG exporter, manifest, and deterministic validation consume
  the v2 artifact's slide array length as the single slide-count source of
  truth.
- The existing local `database` theme remains the only theme. This milestone
  extends its v2 layout support; it does not add theme selection or remote
  assets.

## Acceptance Criteria

- A valid v2 artifact has 6–10 ordered slides and no other source can override
  that count; 5- and 11-slide artifacts fail validation with actionable errors.
- Every v2 carousel begins with `hook`, has exactly one `overview` in second
  position, and ends with `takeaway`; all other slides use only the allowed
  intermediate roles, with repeats permitted and `interview` never required.
- V2 fields obey title ≤80, body ≤300, and zero to four ≤100-character items,
  with no markup. Writer instructions require concrete, non-duplicative
  content; manual review proves that a compound topic such as ACID can devote
  distinct slides to Atomicity, Consistency, Isolation, and Durability plus a
  worked concurrency example.
- The v2 renderer emits exactly one ordered 1080×1350 PNG per v2 slide and a
  success manifest whose slide count and paths match that artifact.
- Over-capacity v2 content fails deterministic overflow validation with an
  actionable diagnostic instead of clipping or silently shrinking away
  readability.
- Valid v1 artifacts continue to render as exactly seven slides under their
  existing contract. Existing v1 requirements, specs, and runs are unchanged.
- V2 validation rejects malformed role sequences, unsupported versions, markup,
  invalid field limits, and invalid slide counts before rendering. It does not
  attempt to mechanically validate semantic concreteness.

## Verification

- Targeted validation tests cover the 6- and 10-slide bounds, invalid counts,
  the closed role set and placement, field limits, markup rejection, and
  rejection before rendering.
- Targeted render tests cover a 6-slide and 10-slide v2 export, dimensions,
  manifest ordering/count, and deterministic overflow diagnostics.
- Regression tests prove the existing v1 seven-slide artifact and renderer
  behavior remain unchanged.
- Manually review an ACID v2 carousel for a hook, overview, concrete coverage
  of all four properties, a concurrency example, and a final takeaway.

## Settled Decisions

- Ten slides is the hard maximum; v2 selects its count from teaching beats.
- Additional depth comes primarily from additional focused slides, not dense
  paragraphs.
- `interview` is optional so compound topics retain room for core concepts;
  intermediate roles may repeat.
- Semantic concreteness is a writer-policy and manual-proof concern, not a
  deterministic validator concern.
- This is a new v2 requirement; no implemented v1 requirement or spec is
  revised.

## Open Questions

None.

## Handoff

- **Producer:** `$dev-loop`
- **Consumer:** `$context`
- **Status:** Verified
- **Implemented spec:** `docs/specs/0003-adaptive-carousel-content-v2.md`
- **Manual ACID review evidence:** dev-loop handoff, not a repository artifact.
- **Unresolved blockers:** None.
