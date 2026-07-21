---
name: apollo
description: Authors a ten-slide deck.html from a topic for carousel export.
---

# Apollo Deck Authoring

When the user invokes `$apollo "<topic>"`, author a self-contained
`deck.html`. No delegation, no intermediate outline or template.

## Output

One file: `deck.html`. Valid, parseable HTML. No external dependencies.

## Slide Structure

Exactly ten `<section class="slide">` direct children of `<body>`.
Each declares `width: 1080px; height: 1350px` via inline `style` or an
embedded `<style>` block. No external stylesheets.

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

## Validation

After writing, run `python scripts/check-deck.py deck.html`. Fix breaches until exit 0.
