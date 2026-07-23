---
name: apollo
description: Authors a ten-slide deck.html from a topic for carousel export.
---

# Apollo Deck Authoring

When the user invokes `$apollo "<topic>"`, produce the complete per-run
artifact set without delegation. No intermediate outline or template.

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

## 3. Author deck

Write `runs/<run-id>/deck.html` — a valid, parseable, self-contained
HTML file with no external dependencies.

## 4. Validate

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

## 5. Export carousel

```sh
node scripts/export-carousel.mjs <run-id>
```

On success (exit 0) clearly report:
- The run-id
- `runs/<run-id>/deck.html`
- `runs/<run-id>/slide-01.png` through `runs/<run-id>/slide-10.png`

On export failure surface the error verbatim. Never claim PNG success when
the export command fails.
