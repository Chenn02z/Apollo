---
name: apollo-render
description: Validates one Apollo run, directs and composes it once, then deterministically assembles and exports it.
---

# Apollo Render

Accept exactly one `runs/<run-id>/` directory.

Before every failure stop append one sanitized event with `node scripts/recovery-memory.mjs log <run-dir> <stage> "<diagnostic>" <cycle> <outcome>`. The run-local `recovery-log.jsonl` and workspace `recovery-history.jsonl` are durable memory. Only non-protected `render-layout` and composition failures are recoverable; every content, state, protected-boundary, export, integrity, browser, and publication failure is terminal. Keep one recovery-cycle counter for the entire render invocation: a repeated stage:code signature stops and layout plus composition together may consume at most two recovery delegations.

Run `node scripts/validate-carousel-content.mjs <run-dir>`. On failure append a `render-content` terminal event with `node scripts/recovery-memory.mjs log <run-dir> render-content "<diagnostic>" 0 terminal`, then stop.

Run `node scripts/validate-carousel-layout.mjs <run-dir> --prepare --snapshot-file <temporary-layout-snapshot>`. If preparation itself fails, append a `render-layout` terminal event with `recovery-memory.mjs` and stop.
Delegate exactly once to `carousel-art-director` with the validated content,
`templates/database-blueprint/template.json`, and `carousel-layout.json` as its
only output. Do not retry or repair. Then run
`node scripts/validate-carousel-layout.mjs <run-dir> --snapshot-file <temporary-layout-snapshot>`.
On failure append a `render-layout` event with `recovery-memory.mjs`, then, if the shared recovery-cycle counter is below two, delegate exactly once to `carousel-recovery` with validated content, template, run/workspace recovery JSONL files (read-only), and `carousel-layout.json` as its only output; increment that counter. Re-run layout prepare and validation. If that validation fails with a different eligible signature and one shared cycle remains, repeat this recovery path once; a repeated signature or exhausted shared counter appends `repeated` or `exhausted`, then stops.

Run `node scripts/compose-carousel.mjs <run-dir> --prepare --state-file <temporary-composition-state>`. If preparation fails, append a `render-composition` terminal event with `recovery-memory.mjs` and stop.
This withholds the success manifest, backs up any prior complete four-member
renderer set, removes any stale `composition.html`, and snapshots every
protected path.

Delegate exactly once to `carousel-composer` with the run path, validated
content and layout paths, and the canonical shell/theme as read-only visual
guidance. It may write a complete `composition.html` in the run directory and
use any local HTML, CSS, SVG, script, or asset needed to make the screenshots.
The only required output contract is ordered `[data-slide="1"]` through
`[data-slide="N"]` elements, each exactly 1080×1350. Before yielding, it must
run `node scripts/compose-carousel.mjs <run-dir> --check`; it may make one
correction and run one final check, for at most two checks total.
This remains one delegation; do not retry or repair outside that composer boundary.
Do not proceed to export unless that required `compose-carousel.mjs <run-dir> --check` succeeds; a failed check is a delegation failure and follows the recovery path below.
If delegation or its required check fails, run
`node scripts/compose-carousel.mjs <run-dir> --restore --state-file <temporary-composition-state> --preserve-state`
then append a `render-composition` event with `recovery-memory.mjs`. If the shared recovery-cycle counter is below two, delegate `carousel-recovery` exactly once with validated content/layout, run/workspace recovery JSONL files (read-only), and `composition.html` as its only output; increment that counter. Run `node scripts/compose-carousel.mjs <run-dir> --recover --state-file <temporary-composition-state>` to reuse the original rollback snapshot without clearing the composition, then run the required check. If that check fails with a different eligible signature and one shared cycle remains, repeat this recovery path once; a repeated signature or exhausted shared counter appends `repeated` or `exhausted`, runs `--restore` without `--preserve-state`, and stops. Never recover protected-boundary or state failures.

Run `node scripts/export-carousel.mjs <run-dir> --state-file <temporary-composition-state>`. On any export failure append a `render-export` terminal event with `recovery-memory.mjs` and stop; never recover export, integrity, browser, or publication failures.
It checks the protected boundary and ordered slide elements, opens the
composer-owned document locally, exports PNGs, and commits the manifest last.
It restores the prior complete set or removes candidates on every failure. Do
not retry or repair.

Report the run path and any warning records from `proof-log.jsonl`.
