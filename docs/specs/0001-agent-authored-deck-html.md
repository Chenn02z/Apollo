# Spec: Agent-Authored Deck HTML

## Status

Verified

## Goal

The `$apollo` skill receives one topic; the active Codex model directly authors a
self-contained ten-slide `deck.html` with no intermediate outline artifact, no
dedicated authoring agent, and no visual-template or layout engine. A read-only
structural checker validates the authored HTML before any downstream export.

## Scenario

1. User invokes `$apollo "Rust ownership"`.
2. Codex reads `.agents/skills/apollo/SKILL.md`, which instructs it to author a
   self-contained `deck.html` with exactly ten `<section class="slide">` slides
   in the fixed pedagogical order, each declared 1080×1350 CSS px.
3. Codex writes `deck.html`.
4. The structural checker is run: `python scripts/check-deck.py deck.html`.
5. If the checker exits 0, the file is structurally valid and ready for 0002's
   Playwright export. If it exits 1, each breach is printed on stdout and no
   export proceeds.

## Architecture Reference

`docs/ARCHITECTURE.md` – Seam 1 (Topic → deck HTML boundary) and Seam 2
(HTML → validation/PNG export boundary). This spec implements the structural
half of the validation gate between the two stages.

## In Scope

- `.agents/skills/apollo/SKILL.md`: a reusable skill that instructs the active
  Codex to author a self-contained `deck.html` from a single topic. The skill
  describes the fixed pedagogical order as a mandatory internal content-planning
  constraint: hook, definition, mental model, mechanics, flow, applied example,
  code/pseudocode, trade-off, misconception/failure, interviewer follow-up.
- A read-only structural checker (`scripts/check-deck.py`) that inspects
  `deck.html` and reports breaches. The checker never modifies the HTML.
- Checker rules:
  1. **Parseability** — the file is valid, parseable HTML (well-formed enough
     for an HTML parser to produce a DOM; not a lint-free guarantee).
  2. **Direct-child slide count** — the `<body>` (or equivalent root) contains
     exactly ten `<section class="slide">` as direct children.
  3. **Declared dimensions** — every top-level slide element declares
     `width: 1080px; height: 1350px` (or equivalent) in its inline `style`
     attribute, a `<style>` block, or an external stylesheet. The checker does
     not verify rendered dimensions; 0002 owns that.
  4. **No external resource URLs** — no `http://` or `https://` in `href`,
     `src`, `@import`, `url()`, or similar attributes.
  5. **No external fonts** — no `<link>` to external font providers and no
     `@font-face` with an external `src` URL. System fonts and data-URI fonts
     are allowed.
  6. **No scripts or event handlers** — no `<script>` elements and no `on*`
     attributes (`onclick`, `onload`, etc.).
  7. **No animations or transitions** — no `animation-*`, `transition-*`, or
     `@keyframes` in CSS. `transform` and `opacity` without animation are
     allowed.
- Exit code 0 on pass, 1 on failure.
- One breach per line on stdout (format: `CHECK_NAME: message`).

## Out Of Scope

- Authoring carousel content — always the active Codex model's job; the
  implementer must never author normal carousel content, layout, colors,
  typography, or diagrams.
- Authoritative rendered-dimension, overflow, and ten-PNG validation — owned by
  milestone 0002.
- Any post-MVP feature (web UI, API, batching, PDF, etc.).
- Validating the pedagogical ordering of slides — that is a skill-instruction
  and manual/model responsibility, not a parser rule.

## Architecture Seams

- **Seam 1 (Topic → deck HTML)**: this spec formalizes the output side of the
  seam. `$apollo` skill + direct model authoring = the MVP path. The checker
  validates the produced artifact.
- **Seam 2 (HTML → validation/PNG export)**: this spec implements the
  structural gate before Playwright export. 0002 implements the export-side
  validation.

## Contracts

### `$apollo` skill

- **Location**: `.agents/skills/apollo/SKILL.md`
- **Input**: one topic string from the user.
- **Output**: one self-contained `deck.html` with exactly ten
  `<section class="slide">` slides, each 1080×1350 CSS px, no external
  dependencies, no scripts, no animations.
- **Responsibility**: instruct the active Codex model. It does not itself
  produce HTML.

### Structural checker

- **Location**: `scripts/check-deck.py`
- **Input**: path to `deck.html` (CLI argument).
- **Output**: stdout — one breach per line on failure; nothing on success.
- **Exit**: 0 = structurally valid; 1 = at least one breach.
- **Side effects**: none. Read-only. Never modifies `deck.html`.

## Failure Modes

| Failure | Checker behavior |
|---------|-----------------|
| File not found | Exit 1, `FILE: deck.html not found` |
| Unparseable HTML | Exit 1, `PARSE: <parser error>` |
| Wrong slide count | Exit 1, `SLIDE_COUNT: expected 10, found N` |
| Missing/wrong declared dimensions | Exit 1, `DIMENSIONS: slide N missing or incorrect 1080×1350` |
| External URL detected | Exit 1, `EXTERNAL_URL: <attribute>="<value>"` |
| External font reference | Exit 1, `EXTERNAL_FONT: <location>` |
| Script or event handler | Exit 1, `SCRIPT: <location>` or `EVENT_HANDLER: <attribute>` |
| Animation/transition | Exit 1, `ANIMATION: <CSS property> in <location>` |

Multiple breaches produce multiple lines. Order is unspecified.

## Acceptance Criteria

- `$apollo` skill file exists at `.agents/skills/apollo/SKILL.md`.
- `scripts/check-deck.py` exists and is executable.
- A known-good ten-slide `deck.html` passes (exit 0, no output).
- Each of the following smallest-broken fixtures produces exactly one breach
  line and exits 1:
  - Nine slides (`SLIDE_COUNT`).
  - Eleven slides (`SLIDE_COUNT`).
  - A slide with `width: 800px` declared (`DIMENSIONS`).
  - An `<img src="https://example.com/x.png">` (`EXTERNAL_URL`).
  - A `<link href="https://fonts.googleapis.com/...">` (`EXTERNAL_URL` or `EXTERNAL_FONT`).
  - A `<script>console.log(1)</script>` element (`SCRIPT`).
  - An `<button onclick="...">` attribute (`EVENT_HANDLER`).
  - A CSS `animation: fadeIn 1s` (`ANIMATION`).
  - A CSS `transition: all 0.3s` (`ANIMATION`).
  - Unparseable HTML (e.g. unclosed tag that breaks DOM parsing; `PARSE`).
  - Missing file (`FILE`).
- No CLI command beyond `python scripts/check-deck.py <path>` is documented
  or required.

## Verification

1. **Known-good fixture**: create a minimal `deck.html` with ten
   `<section class="slide">` elements, each declaring `width:1080px;
   height:1350px`, no external URLs/imports/fonts, no scripts/handlers, no
   animations/transitions. Run checker → exit 0, no stdout.
2. **Each broken fixture above**: run checker against each → exit 1, exactly
   one breach line on stdout. Full output format is `CHECK_NAME: message` but
   exact message text is not prescribed.
3. **Multi-breach**: a fixture that fails both slide count and has an external
   URL → exit 1, at least two lines on stdout, both checks represented.
4. **Verification script** (optional): a small `tests/test_check_deck.py` or
   shell script in `tests/` that runs the checker against known-good and the
   broken fixtures, asserting exit codes and stdout presence. The `test` skill
   may decide between pytest or a shell runner.

## Open Questions

None. All blocking choices are settled in the Accepted milestone.
