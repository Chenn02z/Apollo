---
name: apollo-render-v2
description: Validates one Apollo v2 run, delegates adaptive HTML once, then exports it locally.
---

# Apollo Render v2

Accept exactly one `runs/<run-id>/` directory. Run `node scripts/validate-carousel-content-v2.mjs <run-dir>` before delegation. If it fails, do not delegate, export, or create a v2 manifest.

Delegate exactly once to `carousel-renderer-v2`, supplying validated content, run path, `assets/database/carousel-v2-shell.html`, and content-derived count. The shell is authoritative: it may write only `runs/<run-id>/index-v2.html` by filling its slots; it uses the shell's inline CSS and no scripts or external assets. Do not retry or repair.

If `index-v2.html` exists, run `node scripts/export-carousel-v2.mjs <run-dir>`. Report failure without retrying; otherwise report the run path.
