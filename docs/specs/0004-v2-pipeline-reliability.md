# Spec: V2 Pipeline Reliability

## Status

Accepted

## Goal

Make the v2 pipeline produce five fresh, inspectable, unclipped, substantive
7–10-slide carousels for the canonical proof topics. V1 remains unchanged and
the pipeline neither retries nor repairs itself.

## Scenario

Starting with an empty `runs/` directory, an operator runs the v2 pipeline for
ACID properties, indexes, caching, REST vs GraphQL, and embeddings in that
order. Each success has validated 7–10-slide content, deterministic 1080×1350
PNGs, and a v2 manifest. On failure, the operator diagnoses and fixes the
cause, records it here, deletes only that attempt's run folder, and starts a
fresh attempt for the same pending topic. `runs/` ends with exactly the five
successful proof-run folders.

## In Scope

- V2-only capacity, template-fidelity, and export reliability; v1 inputs,
  artifacts, behavior, and defaults remain unchanged.
- A local deterministic shell derived from the visual and semantic patterns in
  `docs/reference/html/index.html`. The reference is source material only: it
  is never copied, served, or used as raw or network-backed runtime HTML.
- Closed `hero`, `fact`, `list`, `quote`, `comparison`, and `levels` variants,
  with named escaped slots and identical shared header, title, and footer
  chrome classes and fonts.
- Adaptive 7–10-slide proof content with variant-specific support that prevents
  bare title-and-short-body slides.
- Deterministic checks for capacity, count, dimensions, template fidelity, and
  every overflow mode, including one pixel and hidden/clipped content.
- An ordered proof log, precise failed-folder cleanup, and findings/fixes in
  this document.

## Out Of Scope

- Any v1 change.
- Vision review, visual scoring, pixel comparison, citations, publishing,
  analytics, automatic retry, and automatic repair.

## Architecture Seams

- **Content/HTML:** validated content selects one closed variant and populates
  only its named slots; it cannot supply markup, classes, styles, or fonts.
- **Reference/theme/HTML:** the reference HTML informs repository-owned local
  markup and CSS only. The shell owns shared header/title/footer DOM, ordered
  class tokens, and fonts; neither the reference document nor remote assets run
  at runtime.
- **Validation:** local Chromium checks reject bad count/dimensions/capacity,
  hidden or clipped content, and every measured overflow before publication.
- **Run artifacts:** a failure is diagnosed, fixed, logged, and cleaned only at
  its exact run directory before a fresh attempt of the same topic.

## Findings And Fixes

| Finding | Fix | Evidence required |
| --- | --- | --- |
| Structural validation could accept text that did not fit rendered output. | Calibrate each variant/slot limit with worst-case Chromium fixtures; reject over-capacity values before render. | Fixture, Chromium result, validator test. |
| A free-form content region allowed template drift. | Use deterministic expansion of six closed variants and named escaped slots only. | Structural fidelity test. |
| The previous proof defaulted to six sparse slides. | Require adaptive 7–10 slides and validate required substantive support for every variant. Replace old proof folders with a fresh clean proof. | Schema/validator test and final inventory. |
| A renderer could hide overflow. | Reject `hidden`, `clip`, visible escape, and every scroll excess including one pixel. | Real Chromium tests with slide diagnostics. |
| Integer DOM scroll metrics flagged fractional layout rounding as overflow. | Compare each scroll metric to the ceiling of its fractional padding-box dimension; real integer overflow and rect escapes still fail. | Chromium rich-variant export. |
| The fact statistic's line box was shorter than Chromium's rendered glyph metrics (`134 > 130`). | Use a 1.2 line-height for the fixed statistic style. | `rich closed variants export through real Chromium`. |
| List labels used a 42px line box for 43px Chromium glyph metrics. | Use a 1.2 line-height for the fixed list-label style. | `rich closed variants export through real Chromium`. |
| The reference-derived list grid reserved only 76px for labels, too narrow for the 227px ACID labels. | Use a 240–260px label column and a shrinkable detail column. | ACID-label Chromium happy-path export. |
| A reference page could be mistaken for runtime HTML. | Use it solely as visual/semantic source; runtime uses local deterministic shell/CSS and no network assets. | Static shell/runtime check. |
| Failures could be retried without addressing their cause. | No automatic retry: operator records diagnosis and fix, verifies it, removes the exact failed folder, then starts a fresh same-topic attempt. | Ordered proof log and final inventory. |

## Contracts

### Reference-derived closed shell

`assets/database/carousel-v2-shell.html` is the canonical runtime shell.
`docs/reference/html/index.html` is visual and semantic source only: never raw
runtime, never copied as runtime output, and never a source of remote assets.
The runtime shell uses local deterministic markup and CSS, one shared
`section.carousel-slide` chrome, and exactly these closed subtrees: `hero`,
`fact`, `list`, `quote`, `comparison`, and `levels`.

Every rendered slide expands exactly one variant. The shared header, title, and
footer have the same element hierarchy, ordered class-token lists, and computed
`font-family`, `font-size`, `font-weight`, `font-style`, `line-height`,
`letter-spacing`, and `text-transform` in every variant. Only named values
vary, and every value is HTML-escaped text; the renderer cannot inject markup.
There is no `{{content}}`-style free-form slot.

| Shared source | Required slot |
| --- | --- |
| `slides[n].number` | `{{number}}` in slide identity, shared header, and shared footer |
| `topic` | `{{header_topic}}` in shared header and `{{footer_topic}}` in shared footer |
| `slides[n].role` | `{{role}}` in shared variant tag |
| `slides[n].title` | `{{title}}` in shared title element |
| variant support | Only documented named slots for that selected variant |

| Variant | Required non-empty support |
| --- | --- |
| `hero` | `why`, `prompt`, at least one glossary term/definition pair |
| `fact` | `why`, `fact_value`, `fact_label`, at least one glossary term/definition pair |
| `list` | `why`, 2–4 `item_label`/`item_detail` pairs, at least one glossary term/definition pair |
| `quote` | `why`, `quote`, `attribution`, at least one glossary term/definition pair |
| `comparison` | `why`, two labels and summaries, 2–4 non-empty items per side |
| `levels` | `why`, 2–4 label/value/description triples; every value is a finite 0–100 percentage |

The validator rejects unknown variants, a bare slide, missing required support,
or a count outside 7–10 before renderer delegation. Optional slots are absent
only where the selected variant does not declare them.

Before export, template fidelity compares the canonical template with each
expansion after values become their markers. It requires identical hierarchy,
element and attribute names/values, ordered class-token lists, slot locations,
and normalized inline stylesheet text. It checks the computed shared-chrome
font properties listed above. It also rejects reference-document markup,
external URLs, CSS imports, and network requests. Pixel comparison is not a
gate.

### Capacity limits

The implementation checks in a worst-case fixture for every variant/slot pair
under `tests/fixtures/v2-capacity/`. Each identifies variant, slot, exact text,
and expected result. At-limit copy must pass real Chromium at 1080×1350;
one-code-point-over copy must be rejected by the validator. Where a character
ceiling is unsuitable, the over-limit fixture must deterministically overflow
and fail export. Every relevant fixture includes an unbreakable token case.

Implementation records the resulting concrete Unicode-code-point limits in
this table before spec verification; no guessed values are permitted.

| Variant | Slot group | Limit | Fixture | At-limit result | Over-limit result |
| --- | --- | --- | --- | --- | --- |
| hero, fact, list, quote, comparison, levels | shared topic/title/footer | implementation-calibrated | `tests/fixtures/v2-capacity/<variant>-<slot>.json` | Chromium pass | validator rejection or deterministic overflow failure |
| hero, fact, list, quote, comparison, levels | required variant support | implementation-calibrated | `tests/fixtures/v2-capacity/<variant>-<slot>.json` | Chromium pass | validator rejection or deterministic overflow failure |

### Validation and export

Expected slide count comes only from validated v2 content and must be 7–10.
Export verifies every slide is 1080×1350 and rejects any scroll-size excess,
including one pixel. On root and every descendant it rejects computed
`overflow`, `overflow-x`, or `overflow-y` values of `hidden` or `clip`. Real
Chromium tests include 1px horizontal and vertical cases. It also rejects a
visible descendant whose bounding rect escapes the slide content rect by more
than 0 CSS pixels on any edge. Diagnostics name slide, element, property/edge,
and measured values. A failed validation/export publishes no manifest.

### Proof and cleanup

Preflight requires `runs/` to be an existing real, non-symlink directory and
empty. It rejects missing, symlinked, non-directory, or non-empty roots without
automatic cleanup. Obsolete six-slide or bare proof folders are removed by the
operator before preflight; the fresh proof begins clean.

Topics run in this order: ACID properties, indexes, caching, REST vs GraphQL,
embeddings. The proof log records topic, run directory, start/finish time,
result, diagnostics, manifest path on success, and cleanup on failure. On a
failure it may remove only the exact direct-child, non-symlink attempt folder
under the real `runs/` root. The pipeline does not retry or repair. The operator
records the diagnosis and corrective change in Findings And Fixes, verifies the
fix, then starts a fresh attempt of the same pending topic. Only success allows
the next topic. Completion leaves exactly five successful v2 folders and no
failed or obsolete proof folder under `runs/`.

## Failure Modes

| Failure | Required result |
| --- | --- |
| Content exceeds a calibrated limit, uses an unknown variant, is bare, misses required support, or has outside-7–10 count | Reject before renderer delegation with field/variant/count diagnostic. |
| HTML changes shared chrome, a closed variant, or its typography contract | Reject before export with structural path, selector, property, or slot diagnostic. |
| Runtime uses reference HTML or a remote asset | Reject before export with the prohibited source/URL diagnostic. |
| Slide/descendant is hidden, clipped, ≥1px overflowed, or visibly escapes | Reject export with slide, element, property/edge, measured value; no manifest. |
| Proof preflight sees non-empty `runs/` | Fail without deletion. |
| Proof attempt fails | Log, safely delete only that attempt directory, then await an operator diagnosis/fix/verification and fresh same-topic attempt. |

## Acceptance Criteria

- V1 behavior and artifacts are unchanged.
- V2 uses only the six closed variants, named escaped slots, and identical
  shared header/title/footer classes and fonts; it has no free-form region.
- The reference HTML is never raw/network runtime output; runtime uses no
  network assets.
- Validator rejects every bare/missing-support variant and every count outside
  7–10 before rendering.
- Every variant/slot has fixture evidence, a Chromium at-limit pass, and an
  over-limit rejection or deterministic export failure with recorded limits.
- Chromium checks cover wrong dimensions/count, 1px horizontal/vertical
  overflow, all root/descendant overflow properties, and rect containment.
- The log shows every attempt; failures are diagnosed/fixed/verified and their
  exact folders are cleaned before a fresh same-topic attempt.
- `runs/` ends with exactly five fresh, substantive successful proof folders in
  canonical topic order, and no failed or obsolete folder.

## Verification

1. Run focused v2 validator/export tests for closed variants, required support,
   7–10 count, reference/runtime isolation, shared-chrome fidelity, fixtures,
   1px overflow, property matrix, and rect containment.
2. Confirm non-empty `runs/` preflight fails safely; remove obsolete proof
   folders deliberately, then begin from an empty real `runs/` directory.
3. Run each canonical topic in order. After a failure, confirm logged safe
   deletion, record diagnosis/fix in Findings And Fixes, verify the fix, then
   run a fresh attempt of the same topic.
4. Validate each final run's content, shell fidelity, 1080×1350 images,
   content-derived 7–10 count, zero overflow, manifest/topic identity, proof
   log, and exact five-folder `runs/` inventory.

## Handoff

- Producer: `$spec`
- Intended consumer: `$dev-loop`
- Source milestone: `docs/milestones/0004-render-validation-and-mvp-proof.md`
- Status: Accepted; implementation is authorized subject to this spec.
- Settled decisions: v2-only; reference HTML is visual/semantic source only;
  closed deterministic variants with shared chrome; 7–10 non-bare slides; no
  automatic retry/repair; operator diagnose/fix/remove/fresh-attempt workflow;
  strict one-pixel and hidden/clipped overflow failure; five clean proof runs.
- Required reading: this spec and `docs/ARCHITECTURE.md`.
