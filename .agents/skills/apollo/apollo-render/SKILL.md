---
name: apollo-render
description: Validates one Apollo run, delegates HTML once, and exports its fixed carousel locally.
---

# Apollo Render

Accept exactly one `runs/<run-id>/` directory. Run `node
scripts/validate-carousel-content.mjs <run-dir>` before delegation. If it fails,
stop: do not delegate, export, or create a manifest.

After it succeeds, delegate exactly once to `carousel-renderer`. Supply the run
path, its validated content, `assets/database/`, and the seven-slide HTML contract.
Authorize only `runs/<run-id>/index.html`. The renderer uses a system font stack;
it emits no CSS URLs or external assets. Do not retry or repair it.

If `index.html` exists after that delegation, run `npm run render -- <run-dir>`.
Report failure without retrying when export fails; otherwise report the run path.
