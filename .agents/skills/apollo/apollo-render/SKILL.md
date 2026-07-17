---
name: apollo-render
description: Validates one Apollo run, creates and validates its art-direction plan, populates the fixed shell, and exports it locally.
---

# Apollo Render

Accept exactly one `runs/<run-id>/` directory.

Run `node scripts/validate-carousel-content.mjs <run-dir>`. If it fails, stop.
Do not invoke the art director, populate, export, or create a manifest.

Run `node scripts/validate-carousel-layout.mjs <run-dir> --prepare --snapshot-file <temporary-snapshot-path>`.
This safely removes only a stale regular `carousel-layout.json`, then writes a
deterministic boundary snapshot outside the run. If it fails, stop.

Delegate exactly once to `carousel-art-director` with the run path,
`runs/<run-id>/carousel-content.json`,
`templates/database-blueprint/template.json`, and
`runs/<run-id>/carousel-layout.json` as its only allowed output. Do not retry
or repair.

Run `node scripts/validate-carousel-layout.mjs <run-dir> --snapshot-file <temporary-snapshot-path>`.
It validates the write boundary and closed layout contract, records failures in
the proof log, and stops before population or export on failure.

Run `node scripts/populate-carousel.mjs <run-dir>`. It deterministically
expands the repository-owned fixed shell with escaped, validated content. The
existing fixed variants remain active. Do not delegate HTML authoring, retry,
or repair.

Only after that command succeeds and writes its fresh valid `index.html`, run
`node scripts/export-carousel.mjs <run-dir>`. If export fails, report failure
without retrying; otherwise report the run path.
