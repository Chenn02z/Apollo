---
name: apollo
description: Authors a ten-slide deck.html from a topic for carousel export.
---

# Apollo Deck Authoring

When the user invokes `$apollo "<topic>"`, produce the complete per-run
artifact set without delegation. No intermediate outline artifact. Author into
the single checked-in frame template, which locks the header, footer, visual
feel, type, and colors and declares a body-safe area; compose the body freely
within that safe area.

## 1. Generate run-id

Generate one valid unique run-id using Node built-ins only:

```sh
node -e "console.log('run-' + require('crypto').randomUUID())"
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

## 5. Author deck

Repeat the single slide from `templates/frame.html` ten times into
`runs/<run-id>/deck.html`. For each slide:

- Reproduce the surrounding frame (HTML shell, `<head>`, `<body>` tags,
  header `.eyebrow`, footer `.num`, and all CSS) **verbatim** from the
  template.
- Compose body content freely **only** inside `<div id="body-safe-area">`.
- Do not modify header or footer markup or CSS across any slide.


Write `runs/<run-id>/deck.html` — a valid, parseable, self-contained
HTML file with no external dependencies. Keep the frame (header, footer, visual
feel, type, and colors) as defined by the checked-in frame template; compose
body content freely within the declared body-safe area. Only the author revises
deck HTML.

## 6. Validate

```sh
python scripts/check-deck.py runs/<run-id>/deck.html
```

Fix any breaches until exit 0.

## Slide Structure

Exactly ten `<section class="slide">` direct children of `<body>`. Each
declares `width: 1080px; height: 1350px` via inline `style` or embedded
`<style>`. No external stylesheets.

## Pedagogical Order (internal plan only)

Use the following as a default narrative arc, not a rigid slide-by-slide template:

Hook — provocative question, fact, or visual
Foundation — definition, context, or prerequisite
3–7. Explanation — choose the sequence that best teaches the topic, using mechanisms, mental models, flows, comparisons, examples, architecture, or code as appropriate
Trade-off — gain versus cost, limitation, or alternative
Misconception / Common Failure — a realistic mistake or failure mode
Interviewer Follow-up — likely next question with a concise answer

Preserve a coherent progression across all ten slides, but do not force every deck to contain a separate analogy, flow, applied example, and code slide. Select and order these forms according to the topic.

## Constraints

- No `http://` or `https://` URLs anywhere
- System fonts only; no external font `<link>` or `@font-face` with external `src`
- No `<script>` elements or `on*` attributes
- No CSS animations/transitions/`@keyframes`; `transform`/`opacity` without animation allowed
- Styles inline or embedded `<style>` only

## 7. Export carousel

```sh
node scripts/export-carousel.mjs <run-id>
```

On success (exit 0) clearly report:
- The run-id
- `runs/<run-id>/deck.html`
- `runs/<run-id>/slide-01.png` through `runs/<run-id>/slide-10.png`

On export failure surface the error verbatim. Never claim PNG success when
the export command fails.
