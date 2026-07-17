# Spec: Template Archive and Carousel Art Direction

## Status

Accepted

## Goal

Add one repository-owned `database-blueprint` archive and a validated,
inspectable art-direction plan for every validated content slide, without
letting the art director change content, HTML, the current renderer, or export
artifacts.

## Scenario

Given a run with valid `carousel-content.json`, `apollo-render` invokes
`carousel-art-director` after content validation. The director writes one
`carousel-layout.json`; deterministic validation accepts the plan only when it
records the sole archive and motif and supplies exactly one complete visual
plan for each content slide. The existing fixed-variant renderer then proceeds
unchanged.

## Architecture Reference

This implements the `0003` visual-planning path in
[`docs/ARCHITECTURE.md`](../ARCHITECTURE.md):
`carousel-content.json → carousel-art-director → carousel-layout.json → plan
validation → current fixed-variant rendering → PNG/manifest`.

## In Scope

- `templates/database-blueprint/`: one archive that wraps or reorganizes the
  existing local `database` theme, rather than creating a new theme.
- A machine-readable `template.json` that references canonical local theme
  assets, visual-reference composition examples, and a static preview in that
  archive.
- `carousel-art-director` invocation from `apollo-render` and its sole write
  target: `runs/<run-id>/carousel-layout.json`.
- Deterministic layout-plan validation, diagnostics, and render gating.
- Preservation of content and any prior complete renderer artifact set when
  art direction is missing or invalid.

## Out Of Scope

- HTML, CSS, body fragments, shell assembly, DOM/SVG policy, reserved-body
  measurement, or `carousel-composer` behavior; these belong to `0004`.
- Changing `carousel-content.json`, the template/theme files, fixed header or
  footer chrome, existing closed variants, screenshots, or export logic.
- More templates, theme selection, generated assets, visual review, retries,
  repair loops, network resources, or a hosted runtime.

## Architecture Seams

- **Content/plan:** validated content remains the sole teaching-content and
  slide-count source. A layout slide's `number` must match the corresponding
  validated content slide's number and order; the plan cannot add, remove,
  reorder, or alter content.
- **Archive/theme:** `database-blueprint` is the only template and wraps the
  existing local `database` pack. Its contract is the authority for its closed
  motif and capabilities.
- **Art director/write boundary:** the director reads validated content and
  the archive contract, then writes only the run-local layout artifact. It
  creates no HTML and cannot write content, template/theme, shell, slide, or
  manifest artifacts.
- **Validation/render:** deterministic code, not the director, validates the
  plan and gates the existing population/export path. Current closed variants
  remain in use until `0004` is Verified.
- **Artifact publication:** failed planning cannot replace a complete
  `index.html`/`slides/`/`render-manifest.json` set; existing atomic export
  behavior remains the owner of successful renderer publication. The director
  boundary covers every run entry and the selected archive, not only renderer
  artifacts.

## Contracts

### Template archive

`templates/database-blueprint/` contains exactly `template.json`, `examples/`,
and `preview.html`. It does not vendor a second stylesheet or shell.
`template.json` references the existing repository-owned database stylesheet
and shell as canonical assets; those files remain authoritative and must not be
forked or independently modified by the archive. No archive member or asset
reference may be remote, executable, or contain scripts. Examples are visual
references, not reusable or closed HTML layouts; the archive cannot be mutated
by the director.

`template.json` is closed JSON with these fields:

```json
{
  "version": 1,
  "id": "database-blueprint",
  "theme": "database",
  "themeAssets": {
    "css": "../../assets/database/theme.css",
    "shell": "../../assets/database/carousel-shell.html"
  },
  "motifs": ["blueprint"],
  "capabilities": {
    "compositions": ["minimal", "editorial", "split", "grid", "flow", "focus"],
    "densities": ["sparse", "standard", "dense"],
    "visualAnchors": ["headline", "statement", "diagram", "sequence", "contrast", "collection"],
    "directions": ["centered", "top-down", "left-right", "radial"]
  }
}
```

The root key set is exactly `version`, `id`, `theme`, `themeAssets`, `motifs`,
and `capabilities`; `themeAssets` has exactly `css` and `shell`. `version` is
the integer `1`; `id`, `theme`, each asset reference, and every capability
value above are exact strings. The two relative references must resolve to the
canonical regular files `assets/database/theme.css` and
`assets/database/carousel-shell.html` in this repository. No unlisted
property, motif, or capability value is valid. This contract intentionally does
not define HTML tags, classes, or SVG.

### `carousel-layout.json`

The director writes closed JSON at `runs/<run-id>/carousel-layout.json`:

```json
{
  "template": "database-blueprint",
  "motif": "blueprint",
  "slides": [
    {
      "number": 1,
      "composition": "focus",
      "density": "sparse",
      "visualAnchor": "headline",
      "direction": "centered",
      "directionNote": "Open with the core claim, then lead into the sequence."
    }
  ]
}
```

The root object has exactly `template`, `motif`, and `slides`. Each slide object
has exactly `number`, `composition`, `density`, `visualAnchor`, `direction`,
and `directionNote`.

- `template` must be `database-blueprint`; `motif` must be a motif declared by
  that archive (currently `blueprint`). In version 1 these are recorded
  constants, not meaningful director choices.
- `slides` has the same length and ascending order as validated content slides.
  Each positive integer `number` equals the corresponding content slide number;
  every number appears exactly once.
- `composition`, `density`, `visualAnchor`, and `direction` must be values in
  the selected archive's matching capability array.
- `directionNote` is a trimmed, non-empty string of at most 280 Unicode code
  points.

In version 1, `composition`, `density`, `visualAnchor`, and `direction` are
validated independently against their matching archive capability arrays.
Cross-field compatibility and composition feasibility are intentionally
deferred to `0004`.

The plan records spatial intent only. It does not select a current fixed
variant and gives no instruction to compose markup in this milestone.

### Invocation and write boundary

`apollo-render` must perform these stages in this order:

1. Run the existing content validator. On failure, retain its current stop
   behavior.
2. Safely remove only a stale regular `carousel-layout.json`. A stale symlink
   is a validation failure and is not removed.
3. Snapshot the supplied run directory, excluding only the intentionally
   removed `carousel-layout.json`, and the selected archive plus the canonical
   assets resolved from its `themeAssets` references.
4. Delegate exactly once to `carousel-art-director` with the run path,
   validated content path, archive `template.json` path, and layout output
   path.
5. Compare all boundary snapshots. Any added, removed, or hash-changed entry
   outside the recreated regular `carousel-layout.json` is a write-boundary
   failure, including `request.json`, content/review histories, arbitrary new
   run files, every archive entry, and resolved canonical assets.
6. Deterministically validate `carousel-layout.json`.
7. Only after successful plan validation, run the existing
   `populate-carousel` and export stages unchanged.

The director gets no retry. It may create only the supplied regular layout file
in the run; whole-run, archive, and resolved-canonical-asset snapshot comparison
makes every other write, deletion, or added file an executable failure.

Each snapshot is a lexically path-sorted list of repository-relative entries.
For every entry it records the relative path, entry type, and SHA-256 digest of
regular-file bytes; directories are recorded by path and type, and symlinks by
path, type, and link target without following them. File metadata (including
mtime, mode, and ownership) is not compared. The archive snapshot includes its
resolved canonical asset files under their repository-relative paths. Any
snapshot traversal or resolution failure is `LAYOUT_RUN_OR_ARCHIVE`.

### Validation and diagnostics

The renderer owns diagnostics. It reports one deterministic first failure to
stderr and its existing proof log. The proof log is the authoritative durable
diagnostic record associated with the run; it creates no additional diagnostic
run artifact.
Diagnostic codes are `LAYOUT_RUN_OR_ARCHIVE`, `LAYOUT_STALE_SYMLINK`,
`LAYOUT_PROTECTED_MUTATION`, `LAYOUT_OUTPUT`, `LAYOUT_JSON`,
`LAYOUT_ROOT_SHAPE`, `LAYOUT_TEMPLATE_OR_MOTIF`, `LAYOUT_SLIDE_COUNT`,
`LAYOUT_SLIDE_SHAPE`, `LAYOUT_SLIDE_TYPE`, `LAYOUT_SLIDE_IDENTITY`,
`LAYOUT_CAPABILITY`, and `LAYOUT_NOTE`. Each report includes the code and JSON
path or filesystem path. `LAYOUT_SLIDE_IDENTITY` covers duplicate,
out-of-order, and number/content-identity mismatches.

Validation stops at the first failure in this fixed order: run path/archive;
output existence, regular-file status, and symlink check; JSON parse; root key
set and shape; template and motif; slide count; then each slide by ascending
array index for key set/shape, type, identity, capability, and note checks.
Boundary snapshot comparison occurs before output validation and reports
`LAYOUT_PROTECTED_MUTATION` first when it fails. This makes missing,
extra, duplicate, out-of-order, and mismatched plans deterministic failures
without depending on JSON object-member ordering.

### Artifact preservation

A missing or invalid plan stops before population and export. It preserves
`carousel-content.json` and leaves any prior complete `index.html`, `slides/`,
and `render-manifest.json` unchanged. It publishes no partial replacement
renderer or diagnostic artifact set and performs no art-direction retry. A
valid layout plan remains an inspectable run artifact; it does not itself make
a renderer artifact set complete.

## Failure Modes

- Invalid or absent content stops before director invocation under the existing
  content-validation contract.
- An unavailable director, missing layout file, invalid JSON, prohibited write,
  unknown template/motif/capability, unknown key, invalid note, or invalid
  slide mapping reports its deterministic first failure and stops rendering.
- A content-plan count or identity mismatch is a plan-validation failure even
  when individual slide entries otherwise use valid vocabulary.
- No failure in this stage starts a retry, repair, composer, population, or
  export path.

## Acceptance Criteria

- The repository has exactly one `database-blueprint` archive with the stated
  version-1 contract, canonical database-asset references, examples, and
  preview; it is not a second theme.
- A valid run produces the closed `carousel-layout.json` contract with the sole
  template/motif and exactly one valid plan per validated content slide.
- The director writes only that layout artifact and does not add, remove, or
  change any other run entry (including request/content/review histories) or
  any archive/theme entry, including resolved canonical assets.
- Validation deterministically rejects unknown keys, templates, motifs,
  vocabulary values, independently invalid capability values, note-limit
  violations, and every missing, extra, duplicate, out-of-order, or mismatched
  slide plan.
- Missing or invalid art direction reports a stable first failure through the
  renderer, has no retry, does not invoke population/export, and preserves
  content and prior complete renderer artifacts.
- Successful plan validation gates the existing `apollo-render` population and
  export sequence without replacing the current fixed-variant renderer.

## Verification

- Add focused deterministic validator checks for one valid plan and each
  rejected contract category: unknown key/value, invalid motif/capability,
  empty or oversized note, and missing/extra/duplicate/out-of-order or
  mismatched slide mapping. Include equivalent JSON object-member orderings to
  prove that exact key sets, not key order, are enforced.
- Add renderer-stage checks showing the director runs after valid content and
  before population; a valid plan reaches the existing renderer.
- Add failure checks for stale symlinks and whole-run/archive mutations:
  changed `request.json`, content/review histories, renderer artifacts, archive
  files, resolved canonical theme assets, and arbitrary added or removed run
  entries. Verify lexical SHA-256 boundary snapshots reject each before layout
  parsing.
- Add failure checks showing missing/invalid director output reports the fixed
  first-failure code to stderr and the durable proof log, makes no
  population/export call, makes no retry, and leaves a seeded complete renderer
  artifact set unchanged.
- Run `npm run test:renderer` and manually inspect the archive preview plus one
  valid run's layout artifact.

## Open Questions

None. The contract deliberately defers DOM/SVG and composer details to `0004`.
