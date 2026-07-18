# Milestone: Carousel Treatment Variety

## Status

Verified

## Goal

Increase intentional visual and reading-path variation across a carousel
without changing its staged pipeline or deterministic safety boundary.

## MVP Deliverable

A successful 7–10-slide run has carousel-level art direction that assigns each
slide an information treatment and reading path through its existing
`directionNote`, choosing a distinct treatment when it improves the slide's
semantic relationship. The composer implements that direction in its existing
free-flow body HTML, so equivalent content types do not automatically render as
the same repeated card or comparison pattern.

## Developer Workflow

This milestone changes only the existing art-director and composer prompts in
the one-pass `apollo-render` composition stage. Invocation count, artifacts,
schemas, validation, correction and retry counts, fixed shell, export,
rollback, and manifest-last publication remain unchanged.

## In Scope

- Reprompt `carousel-art-director` to plan the carousel as a whole, assigning
  each slide an information treatment and explicit reading path in the existing
  per-slide `directionNote`.
- Require the director to vary treatment across slides when it improves each
  slide's semantic relationship. Useful treatments include causal sequence,
  annotated rule,
  decision path, before/after transformation, trade-off matrix, layered model,
  timeline, and side-by-side contrast; these are prompt examples, not a new
  controlled vocabulary.
- Permit a repeated treatment only when its justification appears in the
  `directionNote`, such as a semantic need or deliberate carousel rhythm; do
  not use `repeatJustification` for this purpose.
- Reprompt `carousel-composer` to implement the assigned treatment and reading
  path rather than defaulting to its easiest repeated arrangement.

## Out Of Scope

- New schemas, layout fields, agents, deterministic visual-novelty checks,
  dependencies, templates, themes, generated imagery, or visual repair loops.
- Changes to writer/reviewer content requirements, slide count, shell-owned
  copy, fixed shell markup, dimensions, export format, renderer validation,
  retry counts, composer correction count, rollback, or publication behavior.
- Rewriting historical milestones or specs.

## Scenarios

- Two slides both express a comparison: the director assigns a side-by-side
  contrast to one and a decision path or trade-off treatment to the other when
  their content supports that distinction; the composer implements each path.
- A causal explanation directs the reader through ordered cause and effect,
  while a rule-with-exceptions slide directs the reader from the rule to its
  annotations rather than rendering both as the same card grid.
- Repeating a treatment is valid when its `directionNote` identifies the
  semantic need or deliberate rhythm; novelty is not required at the expense
  of clarity.
- A valid layout artifact remains accepted without deterministic proof that the
  final DOM differs from another slide; variety is an art-director/composer
  responsibility, not a renderer contract.

## Architecture Seams

- `carousel-layout.json` remains the existing validated art-direction handoff;
  `directionNote` carries treatment and reading-path intent without a schema
  change.
- `carousel-art-director` remains a one-time writer of only
  `carousel-layout.json` and creates no HTML.
- `carousel-composer` retains its current inputs and exact
  `slide-bodies/<nn>.html` write boundary; it implements direction rather than
  selecting a generic fallback structure.
- Deterministic code continues to validate safety, shell boundaries,
  containment, export, rollback, and publication, but does not judge visual
  novelty or enforce plan-to-DOM matching.

## Specs

- `docs/specs/0007-carousel-treatment-variety.md`

## Acceptance Criteria

- The art-director prompt requires carousel-level treatment planning, with an
  explicit information treatment and reading path for every slide in the
  existing `directionNote`.
- The director prompt instructs it to avoid accidental treatment repetition
  when a distinct treatment improves the slide's semantic relationship.
- The composer prompt treats `directionNote` as an implementation assignment
  rather than collapsing directions into a generic repeated body.
- Prompt examples make multiple treatments available without introducing a
  schema enum, new layout field, or deterministic novelty validator.
- Repeated treatments remain allowed when justified in `directionNote` by
  semantic need or deliberate visual rhythm; forced novelty is not a
  requirement, and `repeatJustification` is not used.
- A normal 7-slide and 10-slide proof run retain the current artifact paths,
  schemas, one-pass art-director/composer pipeline, correction and retry
  counts, safety validation, fixed shell, export, rollback, and manifest-last
  publication behavior.

## Verification

- Add focused prompt-contract tests or snapshots showing the art director
  receives carousel-level variation guidance and the composer receives
  direction-implementation guidance without new runtime inputs.
- Run representative 7-slide and 10-slide proof runs. Manually inspect their
  layout direction and exported slides to confirm treatment and reading-path
  variation when it improves the semantic relationship, including two
  comparison-oriented slides.
- Run the complete renderer regression suite to confirm unchanged artifacts,
  safety checks, correction/retry limits, rollback, and publication behavior.

## Settled Decisions

- This is a prompt-only change to the existing art director and composer.
- The existing `directionNote` is the sole handoff for treatment and reading
  path; no schema or agent is added.
- Art direction owns carousel-level variation; composition owns faithful
  execution of that direction.
- Repetition is allowed only when `directionNote` identifies the semantic need
  or deliberate rhythm; `repeatJustification` does not justify treatment
  repetition, and variety is not a deterministic renderer property.
- Existing pipeline order, validators, schemas, retry counts, and composer
  correction count remain unchanged.

## Blocking Questions

None.
