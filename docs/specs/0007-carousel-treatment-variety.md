# Spec: Carousel Treatment Variety

## Status

Verified

## Goal

Make the existing art director assign meaningful carousel-level information
treatments and reading paths, and make the existing composer implement them,
so slides do not accidentally collapse into the same generic arrangement.

## Scenario

Given a valid 7–10-slide `carousel-content.json`, `apollo-render` invokes the
art director once as it does today. For two comparison-oriented slides, the
director may assign a side-by-side contrast to one and a decision path or
trade-off treatment to the other when that improves their semantic
relationships. Each existing `directionNote` tells the composer the assigned
treatment and reading path; the composer writes the same exact safe body
fragment set and the renderer publishes it through the unchanged pipeline.

## Architecture Reference

This spec implements the pending `0007` seam in
[`docs/ARCHITECTURE.md`](../ARCHITECTURE.md): `carousel-layout.json` remains
the validated creative-direction handoff, `carousel-art-director` still writes
only it once, and `carousel-composer` still writes only
`slide-bodies/<nn>.html`. It honors the existing fixed-shell, safety,
containment, export, rollback, and manifest-last publication boundaries.

## In Scope

- Update the `carousel-art-director` prompt to plan treatments and reading
  paths across the complete carousel, using each existing `directionNote`.
- Update the prompt to choose a distinct treatment when doing so improves a
  slide's semantic relationship, while allowing deliberate repetition.
- Require treatment repetition to be explained in that slide's `directionNote`
  by semantic need or deliberate rhythm; `repeatJustification` does not serve
  this purpose.
- Update the `carousel-composer` prompt to treat the assigned treatment and
  reading path as its implementation assignment and avoid an accidental generic
  repeated arrangement.
- Add focused prompt-contract coverage for both agents without adding a visual
  novelty assertion.

## Out Of Scope

- Any schema, layout-field, agent, pipeline-stage, validator, dependency,
  template, theme, generated-image, visual-review, or repair-loop change.
- A deterministic comparison of DOM structures, treatment names, or visual
  novelty between slides.
- Changes owned by `0006`, including writer/reviewer depth requirements,
  body-underfill validation, or removal of the composer's
  minimum-body-structure bias.
- Changes to slide count, shell-owned copy, fixed shell, dimensions, export,
  retry or correction counts, rollback, or publication.

## Architecture Seams

- **Layout handoff:** `carousel-layout.json` and its current schema remain
  unchanged. `directionNote` is the sole treatment and reading-path handoff.
- **Art direction:** the director creates no HTML, changes no content, writes
  only the existing layout artifact, and is invoked once without repair.
- **Composition:** the composer retains its existing inputs and exact numbered
  body-fragment write boundary. It implements direction; it does not create a
  new layout artifact or alter the shell.
- **Deterministic ownership:** renderer validation remains structural and safe;
  it does not enforce plan-to-DOM matching, treatment uniqueness, or visual
  novelty.

## Contracts

### Art-director prompt

The prompt must require carousel-level planning before per-slide direction. For
every slide, its existing non-empty `directionNote` must state:

- an information treatment appropriate to the content; and
- the reading path through that treatment.

Treatment examples may include causal sequence, annotated rule, decision path,
before/after transformation, trade-off matrix, layered model, timeline, and
side-by-side contrast. They are examples only: no enum, parser, or new layout
field is introduced.

The prompt must prefer different treatments only when they improve the slide's
semantic relationship. A repeated treatment is permitted only when that
slide's `directionNote` explains its semantic need or deliberate carousel
rhythm. The existing optional `repeatJustification` continues to be accepted
and ignored by deterministic validation; it neither conveys nor justifies this
treatment decision.

### Composer prompt

The composer receives no new input. Its prompt must direct it to implement the
treatment and reading path in the matching `directionNote`, while retaining all
existing ownership, safe-fragment, canonical-shell, and exact-output rules.
It must not treat a repeated generic card, split, or comparison arrangement as
the default when the assigned direction calls for a different relationship.

### Runtime and artifact stability

`apollo-render` continues to invoke the director once and the composer with its
existing retry/correction behavior. `carousel-content.json`,
`carousel-layout.json`, `slide-bodies/`, `index.html`, `slides/`, and
`render-manifest.json` retain their current paths, schemas, and publication
semantics. Existing validators remain unchanged.

## Failure Modes

- A direction note lacks a usable treatment or reading path: this is a prompt
  quality failure to address through the existing agent prompt and proof review,
  not a new deterministic layout-validation failure.
- Two slides use the same treatment without a semantic or rhythmic explanation:
  manual proof review flags the prompt outcome; the renderer does not reject
  the otherwise valid DOM.
- A repeated treatment is justified only in `repeatJustification`: it does not
  satisfy the prompt contract; the reason belongs in `directionNote`.
- A composer ignores direction but produces safe, contained HTML: existing
  deterministic validation and publication behavior still apply; no new repair
  attempt is introduced.

## Acceptance Criteria

- The art-director prompt directs the agent to plan the full carousel and put
  an information treatment plus reading path in every `directionNote`.
- It directs distinct treatment only when it improves the slide's semantic
  relationship, not as forced novelty.
- It permits repetition only with an explanation in the matching
  `directionNote`; `repeatJustification` is not used for this purpose.
- The composer prompt directs it to implement that existing-note assignment
  rather than defaulting to a generic repeated arrangement.
- No schema, runtime input, agent, invocation count, retry/correction count,
  validator, or deterministic novelty check changes.
- Seven- and ten-slide runs preserve exact artifact paths, safe fragment and
  shell behavior, export, rollback, and manifest-last publication.

## Verification

- Add focused tests or snapshots that assert both prompts contain their
  treatment/reading-path and repetition-direction requirements, without
  asserting an exact treatment vocabulary or DOM novelty.
- Run a representative 7-slide and 10-slide proof. Manually inspect layout
  notes and PNGs for treatment/reading-path variation when it improves the
  semantic relationship, including two comparison-oriented slides.
- Run the renderer regression suite to confirm unchanged safety, artifact,
  export, rollback, and publication behavior.

## Open Questions

None.

## Verified Handoff

Review found no issues. Targeted verification passed 33 checks with two expected
sandbox-only Chromium skips; the art-director and composer prompt contracts,
unchanged pipeline boundaries, and renderer regressions are verified.
