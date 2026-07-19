# Single Render Artifact

**Status:** Proposed  
**Date:** 2026-07-19  
**Roadmap Phase:** P0.4  
**Depends on:** P0.3 linearization  
**Blocks:** P0.5 (docs reset)

## Problem

The pipeline produces two HTML artifacts: `composition.html` (runtime assembly from `slide-bodies/` fragments) and `index.html` (byte-identical copy for publication). Snapshot and restore logic manages both. This doubles the render surface and creates confusion about which file is authoritative. The target recommendation is `index.html` as sole durable run HTML; any `composition.html` and `slide-bodies/` are private staging, pending P0.0 contract inventory.

## Proposed Change

- Remove `composition.html` as a durable artifact. `index.html` is the sole output.
- Simplify snapshot/export logic that currently references both files.
- Simplify restore logic that reconstructs renderer state from four-file sets.

## Acceptance Criteria

1. A complete run produces `index.html` + slides + manifest only; no `composition.html` or `slide-bodies/` in final output.
2. No `composition.html` written or referenced in pipeline output.
3. Snapshot logic handles single artifact (no four-file state).
4. Export logic does not re-scan or re-validate a separate composition file.

## Implementation Notes

- Mechanical simplification once P0.3 linearization is complete.
- Export currently repeats composition validation/scan &mdash; collapse into single check.
- Snapshot/restore currently repeats renderer four-file state &mdash; simplify to match.
- Low risk after linearization; mostly deletion of indirection layers.
