---
name: apollo-render-v2
description: Validates one Apollo v2 run, delegates adaptive HTML once, then exports it locally.
---

# Apollo Render v2

Accept exactly one `runs/<run-id>/` directory. Run `node scripts/validate-carousel-content-v2.mjs <run-dir>` before delegation. If it fails, do not delegate, export, or create a v2 manifest.

Delegate exactly once to `carousel-renderer-v2`, supplying validated content, run path, `assets/database/`, and content-derived count. It may write only `runs/<run-id>/index-v2.html`; it uses inline CSS and a system font stack, with no scripts or external assets. Do not retry or repair.

If `index-v2.html` exists, run `node scripts/export-carousel-v2.mjs <run-dir>`. Report failure without retrying; otherwise report the run path.
