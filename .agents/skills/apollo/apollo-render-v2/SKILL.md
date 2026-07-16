---
name: apollo-render-v2
description: Validates one Apollo v2 run, delegates adaptive HTML once, then exports it locally.
---

# Apollo Render v2

Accept exactly one `runs/<run-id>/` directory. Run `node scripts/validate-carousel-content-v2.mjs <run-dir>` before rendering. If it fails, do not render, export, or create a v2 manifest.

Run `node scripts/populate-carousel-v2.mjs <run-dir>`. It deterministically expands the repository-owned fixed shell with escaped validated text slots. Do not delegate HTML authoring, retry, or repair.

If `index-v2.html` exists, run `node scripts/export-carousel-v2.mjs <run-dir>`. Report failure without retrying; otherwise report the run path.
