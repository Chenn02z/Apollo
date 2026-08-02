---
name: generate
description: Authors a ten-slide deck.html from a topic for carousel export. Accepts an optional category for run-path scoping.
---

# Deck Generation

When the user invokes `$generate "<topic>"` with an optional angle, context,
or category, set up the per-run scaffolding, delegate full deck-body
composition to the `apollo-designer` agent, validate, export, and
re-delegate on failure up to 3 attempts.

## 0. Category (optional)

If `$getcracked` (or the user) supplies a `--category` or `category`
argument, normalize the category name to a slug:

- Lowercase, single-hyphen separator, ampersands and ASCII punctuation
  stripped.
- The seven exact category names map to: DSA → `dsa`, System Design →
  `system-design`, Software Design → `software-design`, Java & Backend
  Development → `java-backend-development`, Databases → `databases`,
  AI Engineering → `ai-engineering`, Deep Learning → `deep-learning`.

When a category is supplied, the run directory is
`runs/<category-slug>/<run-id>/`. When no category is supplied (standalone
invocation), the run directory is `runs/<run-id>/` as before. In the steps
below, `<run-dir>` refers to the chosen run directory.

## 1. Generate run-id

```sh
node -e "console.log(\"run-\" + require(\"crypto\").randomUUID())"
```

Capture the output; this is `<run-id>`.

## 2. Create run directory

```sh
mkdir -p <run-dir>
```

## 3. Read both frame templates

Read `templates/first-frame.html` and `templates/frame.html`. These are the
two immutable visual contracts:

- `templates/first-frame.html`: the fixed presentation for slide 1 only. It
  carries exactly three authored slots — category, topic, commentary — in
  fixed placement, type, and color. It has no `#body-safe-area` and no
  `archetype-*` class. Replace the placeholder tokens `[CATEGORY]`,
  `[TOPIC]`, and `[COMMENTARY]` with authored text. The topic renders in
  `#1C1C1C`; the author may wrap selected words in inline `<span>` elements
  with `color` drawn solely from the seven fixed-palette values
  (`#1C1C1C`, `#506B62`, `#A85F47`, `#5D7094`, `#A9824F`, `#806277`,
  `#8E6A58`). Do not add, remove, or restyle any other element on this
  slide. The rail and `get cracked` label are template-owned; do not
  inject or restyle them.

- `templates/frame.html`: serves slides 2–10. It owns the same rail and
  `get cracked` label chrome as the first frame, plus a
  `#body-safe-area` for free body composition. Reproduce its CSS and
  surrounding markup verbatim on every slide. The rail and label are
  template-owned; the agent selects the rail color only via the
  `--rail-color` CSS custom property from the seven fixed-palette values.
  Do not inject rail markup or use arbitrary colors.

## 4. Read and validate manifest

Read `templates/manifest.json`. Validate as follows:

- Must be valid JSON.
- Must contain **only** `content_revision_limit` and `visual_revision_limit`
  keys. Unknown keys are an error.
- Each must be an integer in the range 0-5. Non-integer or out-of-range
  values are an error.
- If either key is omitted, its value defaults to `1`. An empty `{}` resolves
  to both defaults `1`/`1`.
- If the file is missing, halt with "Missing templates/manifest.json".

`$generate` reads and validates the manifest but does **not** run review loops.
The manifest values are consumed by downstream review milestones.

## 5. Delegate deck-body composition to apollo-designer

Delegate the full deck-body composition to the `apollo-designer` agent
(configured at `.codex/agents/apollo/apollo-designer.toml`). That agent
holds all design-authoring instructions: the frontend-design anchor choice
adapted to the two immutable templates, content discipline, the one visible
body-layout motif, and all deck-body rules (archetypes, accent palette,
pedagogical order, constraints).

Provide the agent with:

- The `<run-id>` and `<run-dir>`
- The `<topic>` exactly as given by the user
- Any user-provided angle or context, passed through verbatim
- The `<category>` if one was supplied

The apollo-designer agent writes `<run-dir>/deck.html` and reports its
chosen anchor, motif, and path.

## 6. Validate deck structure

```sh
python scripts/check-deck.py <run-dir>/deck.html
```

## 7. Export carousel

When no category was supplied:
```sh
node scripts/export-carousel.mjs <run-id>
```

When a category was supplied:
```sh
node scripts/export-carousel.mjs <run-id> --category <category-slug>
```

## 8. Re-delegate on failure

If structural validation (step 6) or export (step 7) fails, re-delegate to
the `apollo-designer` agent with the failure output. Instruct it to fix
`<run-dir>/deck.html` only — never edit templates. Repeat up to 3 total
delegation attempts (the initial plus up to 2 re-delegations).

On success (step 7 exit 0), clearly report:

- The run-id
- `<run-dir>/deck.html`
- `<run-dir>/slide-01.png` through `<run-dir>/slide-10.png`

On persistent failure after 3 attempts, surface the final error verbatim.
Never claim PNG success when the export command fails.
