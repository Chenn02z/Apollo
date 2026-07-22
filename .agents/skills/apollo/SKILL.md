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

The legacy flat `runs/deck.html` is left untouched.

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

1. **Hook** — provocative question, fact, or visual
2. **Definition** — one-sentence definition
3. **Mental Model** — analogy or framework
4. **Mechanics** — how it works under the hood
5. **Flow** — step-by-step scenario
6. **Applied Example** — real-world use case
7. **Code / Pseudocode** — short illustrative snippet
8. **Trade-off** — gain vs. give up
9. **Misconception / Common Failure** — most common mistake
10. **Interviewer Follow-up** — likely next question + concise answer

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
