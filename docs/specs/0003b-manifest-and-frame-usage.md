# Spec: Manifest And Frame Usage

## Status

Verified

## Goal

Establish `templates/manifest.json` as the checked-in configuration surface
for independent content and visual revision limits, and align `$apollo`
authoring to consume `templates/frame.html` (spec 0003) by repeating it ten
times into `runs/<run-id>/deck.html` and filling each slide's
`<div id="body-safe-area">` while keeping the header and footer identical to
the template.

## Scenario

1. User invokes `$apollo "<topic>"`.
2. `$apollo` reads `templates/frame.html` and `templates/manifest.json`.
3. `$apollo` repeats the one-slide template ten times into
   `runs/<run-id>/deck.html`.
4. For each slide, `$apollo` fills the slide's `<div id="body-safe-area">`
   with authored body content, leaving the header and footer markup and CSS
   identical to the template.
5. A downstream reviewer milestone reads `templates/manifest.json` and uses
   `content_revision_limit` and `visual_revision_limit` independently.

## Architecture Reference

`docs/ARCHITECTURE.md` — Seam 1 (Topic → deck HTML boundary): `$apollo`
authors `deck.html` by repeating the one-slide frame template ten times and
filling each body-safe area; the manifest is the configuration surface that
later review milestones read for their independent revision limits. Seam 2
(HTML → validation/PNG export boundary): the validity contract is preserved
unchanged.

## In Scope

- `templates/manifest.json`: a JSON object with exactly two keys —
  `content_revision_limit` and `visual_revision_limit` — each an integer in
  the range 0–5, defaulting to `1` and `1`.
- Independence of the two revision budgets: a limit of `0` skips its
  corresponding reviewer entirely with no report produced, without affecting
  the other budget.
- Default budget behavior: a manifest omitting explicit values uses the
  defaults `1` and `1`.
- `$apollo` authoring alignment: repeat the one-slide `templates/frame.html`
  ten times into `runs/<run-id>/deck.html` and fill each slide's
  `<div id="body-safe-area">` with authored body content while keeping the
  header and footer identical to the template markup and CSS.
- The existing validity contract still holds: exactly ten 1080×1350 slides,
  no external assets, no network, no interactivity or animation.

## Out Of Scope

- `templates/frame.html` itself (owned by spec 0003).
- Content review behavior and content-review reports (milestone 0006).
- Visual review behavior and rendered-PNG visual reports (milestone 0007).
- Any reviewer report generation or export changes driven by the manifest.
- Any manifest fields beyond `content_revision_limit` and
  `visual_revision_limit`.
- Any change to structural validation or PNG export (owned by specs
  0001/0002).

## Architecture Seams

- **Seam 1 (Topic → deck HTML)**: `$apollo` authors `deck.html` in Codex by
  repeating the one-slide `templates/frame.html` ten times; the pedagogical
  order is an internal authoring constraint. The frame template
  (header/footer/visual feel/type/colors and the CSS-sized body-safe area)
  is the fixed visual contract; the author composes body content freely within
  each slide's safe area while the header and footer stay identical to the
  template.
- **Seam 2 (HTML → validation/PNG export)**: the manifest does not alter the
  validation or export contract. Structural validation and PNG export remain
  the only hard gates.

## Contracts

### `templates/manifest.json`

- **Location**: `templates/manifest.json`.
- **Form**: a JSON object with exactly two keys:
  - `content_revision_limit`: integer, range 0–5, default `1`.
  - `visual_revision_limit`: integer, range 0–5, default `1`.
- **Defaults**: a manifest omitting either key uses the default `1` for that
  key. A manifest that is empty or `{}` uses both defaults.
- **Independence**: the two budgets are independent. A limit of `0` for one
  does not affect the other.
- **Zero-budget semantics**: a manifest with `content_revision_limit: 0`
  skips the content reviewer entirely and produces no content report. A
  manifest with `visual_revision_limit: 0` skips the visual reviewer entirely
  and produces no visual report. This does not affect the other budget.
- **No additional fields**: the manifest must not carry any key other than
  `content_revision_limit` and `visual_revision_limit`.

### `$apollo` authoring alignment

- **Input**: one topic string, plus `templates/frame.html` and
  `templates/manifest.json` on disk.
- **Output**: `runs/<run-id>/deck.html` — a self-contained HTML file with
  exactly ten slides, each a repeat of the frame template with its
  body-safe area filled.
- **Frame usage**: `$apollo` repeats the one-slide `templates/frame.html` ten
  times. Each generated slide's header and footer must match the template
  markup and CSS exactly; only body content inside the body-safe area varies
  between slides and between decks.
- **Body composition**: the author composes body content freely within each
  slide's `<div id="body-safe-area">`. All authored content goes inside the
  body-safe area; the header and footer are never modified by the author.
- **Manifest consumption**: `$apollo` reads `templates/manifest.json` so that
  downstream review milestones (0006, 0007) can consume the revision limits.
  In the MVP, `$apollo` itself does not run review cycles; it authors,
  validates, and exports. The manifest's revision limits are consumed by
  later review milestones, not by `$apollo`'s authoring step.
- **Validity**: the generated `deck.html` must satisfy the existing validity
  contract — exactly ten 1080×1350 slides, no external assets, no network,
  no interactivity or animation — and pass `scripts/check-deck.py` (exit 0).

### Relationship to the structural validator

- `scripts/check-deck.py` is reused unchanged (owned by spec 0001). It does
  not read `templates/manifest.json`; manifest parsing is a separate concern.
- The generated `deck.html` must pass all existing validator rules.

### Relationship to the frame template

- This spec depends on spec 0003 for the existence and contract of
  `templates/frame.html`. If the template is missing or invalid, `$apollo`
  cannot produce a valid deck.

## Failure Modes

| Failure | Behavior |
|---------|----------|
| `templates/manifest.json` missing | Downstream review milestones cannot read revision limits. `$apollo` authoring may still proceed using defaults, but review milestones must fail or skip cleanly. |
| Manifest not valid JSON | Parse error; review milestones cannot determine budgets. The run should fail or use defaults — decision deferred to review milestone specs (0006, 0007). |
| Manifest has extra keys | Contract violation. Not caught by the structural validator. A manifest validator (if added) should reject unknown keys. |
| `content_revision_limit` or `visual_revision_limit` out of range (not 0–5) | Contract violation. Review milestones must treat out-of-range values as an error or clamp to defaults — decision deferred to review milestone specs. |
| `content_revision_limit: 0` | Content reviewer is skipped entirely; no content report is produced. Visual budget is unaffected. |
| `visual_revision_limit: 0` | Visual reviewer is skipped entirely; no visual report is produced. Content budget is unaffected. |
| `templates/frame.html` missing | `$apollo` cannot produce a valid deck; the run fails before any deck is written (spec 0003). |
| Generated slide header/footer differs from template | Frame contract violation. Not caught by the structural validator — visual-review responsibility (milestone 0007). |
| Body content placed outside `body-safe-area` | Authoring-skill violation. The header and footer must never be modified by the author. Not caught by the structural validator — authoring-skill and visual-review responsibility. |

## Acceptance Criteria

- `templates/manifest.json` exists and parses as JSON.
- It has exactly `content_revision_limit` and `visual_revision_limit`, each
  an integer 0–5.
- A manifest omitting either key uses the default `1` for that key.
- The two revision budgets are independent; a limit of `0` skips its
  corresponding reviewer entirely with no report produced, without affecting
  the other budget.
- `$apollo` produces `runs/<run-id>/deck.html` by repeating the one-slide
  `templates/frame.html` ten times and filling each slide's body-safe area.
- Each generated slide's header and footer match the template markup and CSS
  exactly; validation of the frame excludes the body-safe area, leaving body
  content and styling inside it to author discretion.
- The existing validity contract still holds: exactly ten 1080×1350 slides,
  no external assets, no network, no interactivity or animation.

## Verification

1. **Manifest parse check**: load `templates/manifest.json` as JSON; assert
   exactly two keys, each an integer 0–5. This can be a small inline script
   or part of the `$apollo` skill's validation step.
2. **Default-budget check**: a manifest `{}` or one omitting a key resolves
   to `1` for that key. Verify via the same parse logic.
3. **Zero-budget check**: a manifest with `content_revision_limit: 0` produces
   no content report (verified when milestone 0006 is implemented; for now,
   the contract is that zero skips the reviewer with no report).
4. **Generated-deck check**: produce a `runs/<run-id>/deck.html` by running
   `$apollo` on a topic. Run `scripts/check-deck.py` → exit 0. Confirm
   exactly ten slides, each with header/footer matching the template and body
   content inside the body-safe area.
5. **Frame-identity check** (manual or via visual review): confirm each
   generated slide's header and footer markup and CSS are identical to the
   template. The structural validator does not enforce this.

## Open Questions

- Should a manifest validator (JSON schema or parse check) be added as a
  standalone script, or should `$apollo` inline the parse-and-default logic?
  The milestone does not prescribe a tool; this spec leaves it to the
  implementer. A minimal inline parse in `$apollo` is sufficient for the MVP.
- How should out-of-range or non-integer revision limits be handled — error,
  clamp, or default? The milestone says "each an integer in the range 0–5"
  but does not specify rejection behavior. This spec defers the decision to
  review milestone specs (0006, 0007), which are the consumers.
