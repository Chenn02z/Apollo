# Milestone: Free-Flow Slide Bodies

## Status

Verified

## Goal

Let `carousel-composer` author visually varied, self-contained slide bodies from
creative direction while preserving the existing fixed shell, render boundary,
and deterministic publication behavior.

## MVP Deliverable

A valid 7–10-slide run produces exactly `slide-bodies/01.html` through
`slide-bodies/NN.html` as free-flow HTML/SVG body fragments. The composer may
author the body copy and arrangement, while deterministic assembly preserves the
validated slide order and exact shell-owned topic, number, role, title, why, and
glossary content before exporting the unchanged 1080×1350 carousel.

## Developer Workflow

This milestone updates the existing one-pass `apollo-render` composition stage.
Its inputs, invocation count, output path, canonical assembly, export, rollback,
and manifest-last publication remain unchanged.

## In Scope

- Reprompt `carousel-composer` as a free-flow body implementer. It may read the
  fixed shell and theme CSS for visual guidance, but its only runtime writes
  remain the exact numbered files under `runs/<run-id>/slide-bodies/`.
- Treat `slide.content` as a creative brief. The composer may rephrase, combine,
  omit, and add supporting claims directly in final body HTML; supporting-claim
  correctness relies on the composer prompt rather than deterministic claim
  fidelity checks.
- Treat validated `carousel-layout.json` as creative direction rather than a
  machine-enforced DOM arrangement. A valid `repeatJustification` remains
  accepted but is ignored during composition validation, and body-arrangement
  repetition emits no warning.
- Bump the `database-blueprint` template contract to version 2, remove
  `fragmentVocabulary`, and retain the existing template identity, theme assets,
  motif, and layout-capability vocabulary.
- Permit arbitrary body nesting and class names within the validated safe,
  noninteractive HTML/SVG contract, including validated inline layouts and
  styles. Keep the existing rejection boundary for executable, interactive,
  resource-loading, hidden or clipped, and shell-escaping output. The spec owns
  the exact fragment and style safety rules.
- Simplify deterministic validation by removing `data-bind` coverage, semantic
  wrapper, closed hierarchy/class, `cp-*`, plan-to-DOM, claim-fidelity, layout
  matching, and body-arrangement warning requirements.
- Retain exact-file, UTF-8, size, symlink, safe-markup, protected-write,
  browser-boundary, network-abort, PNG-dimension, rollback, canonical assembly,
  and manifest-last publication checks.
- Keep existing safe `cp-*` fragments valid under the relaxed contract.

## Scope Boundary

This milestone opens only the slide-body authoring contract. It does not change
slide count or order, shell-owned copy, fixed shell markup, chrome, theme CSS,
dimensions, export format, publication behavior, art-director invocation, or the
one-pass composer execution model. It adds no agent, CSS parser dependency,
theme system, generated imagery, duplicate final-copy JSON artifact, visual
review, repair loop, or archival migration.

Milestone `0005` supersedes only `0004`'s live closed binding, primitive
vocabulary, and claim-fidelity seam. The `0004` milestone, spec, and files remain
unchanged as historical Verified records. Completed runs are untouched and need
no migration. Existing `cp-*` classes remain usable, but `data-bind` is not a
version-2 compatibility path.

## Architecture Seams

- `carousel-content.json` remains authoritative for slide count, order, and
  shell-owned fields; its `content` payload becomes composer guidance.
- `carousel-layout.json` remains a validated art-direction handoff, without
  dictating or being compared with the final body DOM.
- `slide-bodies/<nn>.html` remains the sole final rendered-body-copy artifact
  and the composer's exact write boundary.
- Deterministic code remains responsible for safe-fragment acceptance, fixed-
  shell assembly, visible containment within `.slide-body`, export, rollback,
  and atomic publication.

## Specs

- `docs/specs/0005-free-flow-slide-bodies.md`

## Acceptance Criteria

- The composer can produce novel nested structures, arbitrary safe class names,
  safe local SVG, inline grid/flex/absolute layouts, and body copy not present in
  the source content leaves.
- Safe existing `cp-*` fragments remain valid without restoring `data-bind` or
  any closed vocabulary requirement.
- Seven- and ten-slide runs preserve exact shell-owned topic, number, role,
  title, why, and glossary content and unchanged chrome.
- Valid layout plans guide the composer without plan-to-DOM matching,
  arrangement repetition warnings, or use of `repeatJustification` beyond
  accepting its already-valid presence.
- Malformed fragments, extra files, scripts, executable attributes, interactive
  elements, external resources, unsafe styles, and body overflow are rejected
  without weakening rollback or publication guarantees.
- The version-2 template contract retains the existing template identity, theme
  assets, motif, and layout-capability vocabulary and no longer declares
  `fragmentVocabulary`.
- Existing completed runs and the historical `0004` milestone/spec require no
  changes.

## Verification

- Run the targeted renderer suite, including new free-flow acceptance and
  rejection coverage plus retained exact-file, protected-write, UTF-8, size,
  network-abort, PNG-dimension, rollback, and manifest-last regressions.
- Exercise both 7- and 10-slide fixtures to verify exact shell fields and
  unchanged chrome.

## Deferred

Visual review and repair, deterministic supporting-claim verification, new
themes or agents, generated imagery, and a separate final-body-copy artifact
remain out of scope.

## Open Questions

None. Exact safe-fragment and inline-style allow/deny rules are implementation
contract details for the spec, not unresolved milestone scope.

## Verified Handoff

Implementation is verified by `docs/specs/0005-free-flow-slide-bodies.md`.
Targeted verification passed 20/20 checks including real Chromium; the full
suite passed all 29 non-browser checks with one expected sandbox-only Chromium
skip. Seven- and ten-slide proof behavior retains exact shell fields,
1080×1350 output, rollback, and manifest-last publication.
