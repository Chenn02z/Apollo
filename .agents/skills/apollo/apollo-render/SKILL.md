---
name: apollo-render
description: Validates one Apollo run, populates its adaptive HTML, then exports it locally.
---

# Apollo Render

Accept exactly one `runs/<run-id>/` directory. Run `node scripts/validate-carousel-content.mjs <run-dir>` before rendering. If it fails, do not render, export, or create a manifest.

Run `node scripts/populate-carousel.mjs <run-dir>`. It deterministically expands the repository-owned fixed shell with escaped validated text slots. Do not delegate HTML authoring, retry, or repair.

If `index.html` exists, run `node scripts/export-carousel.mjs <run-dir>`. Report failure without retrying; otherwise report the run path.
