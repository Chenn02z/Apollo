---
name: apollo
description: Authors a ten-slide deck.html from a topic for carousel export.
---

# Apollo Deck Authoring

When the user invokes `$apollo "<topic>"` with an optional angle or context,
set up the per-run scaffolding, delegate full deck-body composition to the
`apollo-designer` agent, validate, export, and re-delegate on failure up to
3 attempts.

## 1. Generate run-id

```sh
node -e "console.log(\"run-\" + require(\"crypto\").randomUUID())"
```

Capture the output; this is `<run-id>`.

## 2. Create run directory

```sh
mkdir -p runs/<run-id>
```

## 3. Read frame template

Read `templates/frame.html`. Extract the single `<section class="slide">`
element and its surrounding `<head>`/`<body>`/`<html>` shell. This frame is the
fixed visual contract — its header (`.eyebrow`), footer (`.num`), CSS, and
surrounding markup must be reproduced verbatim on every slide.

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

`$apollo` reads and validates the manifest but does **not** run review loops.
The manifest values are consumed by downstream review milestones.

## 5. Delegate deck-body composition to apollo-designer

Delegate the full deck-body composition to the `apollo-designer` agent
(configured at `.codex/agents/apollo/apollo-designer.toml`). That agent
holds all design-authoring instructions: the frontend-design anchor choice
adapted to the immutable `templates/frame.html` constraint, content
discipline, the one visible body-layout motif, and all deck-body rules
(archetypes, accent palette, pedagogical order, constraints).

Provide the agent with:

- The `<run-id>`
- The `<topic>` exactly as given by the user
- Any user-provided angle or context, passed through verbatim

The apollo-designer agent writes `runs/<run-id>/deck.html` and reports its
chosen anchor, motif, and path.

## 6. Validate deck structure

```sh
python scripts/check-deck.py runs/<run-id>/deck.html
```

## 7. Export carousel

```sh
node scripts/export-carousel.mjs <run-id>
```

## 8. Re-delegate on failure

If structural validation (step 6) or export (step 7) fails, re-delegate to
the `apollo-designer` agent with the failure output. Instruct it to fix
`runs/<run-id>/deck.html` only — never edit templates. Repeat up to 3
total delegation attempts (the initial plus up to 2 re-delegations).

On success (step 7 exit 0), clearly report:

- The run-id
- `runs/<run-id>/deck.html`
- `runs/<run-id>/slide-01.png` through `runs/<run-id>/slide-10.png`

On persistent failure after 3 attempts, surface the final error verbatim.
Never claim PNG success when the export command fails.
