---
name: apollo-render
description: Validates one Apollo run, directs and composes it once, then deterministically assembles and exports it.
---

# Apollo Render

Accept exactly one `runs/<run-id>/` directory.

Run `node scripts/validate-carousel-content.mjs <run-dir>`. Stop on failure.

Run `node scripts/validate-carousel-layout.mjs <run-dir> --prepare --snapshot-file <temporary-layout-snapshot>`.
Delegate exactly once to `carousel-art-director` with the validated content,
`templates/database-blueprint/template.json`, and `carousel-layout.json` as its
only output. Do not retry or repair. Then run
`node scripts/validate-carousel-layout.mjs <run-dir> --snapshot-file <temporary-layout-snapshot>`.
Stop on failure.

Run `node scripts/compose-carousel.mjs <run-dir> --prepare --state-file <temporary-composition-state>`.
This withholds the success manifest, backs up any prior complete four-member
renderer set, creates the canonical empty `slide-bodies/`, and snapshots every
protected path.

Delegate exactly once to `carousel-composer` with the run path, validated
content and layout paths, `templates/database-blueprint/template.json`, and the
canonical shell/theme as read-only visual guidance, with `slide-bodies/` as its
only write boundary. Do not retry or repair.
If delegation fails, run
`node scripts/compose-carousel.mjs <run-dir> --restore --state-file <temporary-composition-state>`
and stop.

Run `node scripts/export-carousel.mjs <run-dir> --state-file <temporary-composition-state>`.
It checks the protected boundary and exact fragment set, validates safe
free-flow HTML/SVG, assembles the fixed shell, checks reserved-body containment,
exports PNGs, and commits the manifest last. It restores the prior complete set
or removes candidates on every failure. Do not retry or repair.

Report the run path and any warning records from `proof-log.jsonl`.
