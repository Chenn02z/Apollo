# E2E Contract Inventory

**Status:** Proposed  
**Date:** 2026-07-19  
**Roadmap Phase:** P0.0  
**Depends on:** None  
**Blocks:** P0.1 (reconcile render contract)

## Problem

Apollo's render contract has documentation-vs-runtime drift across six sources. The render SKILL says the composer outputs `composition.html`. The composer TOML defines the agent write boundary as `slide-bodies/NN.html` fragments. `compose-carousel.mjs` validates both fragments and the assembled `composition.html`. `export-carousel.mjs` reads `composition.html` and writes `index.html` as a byte-identical copy. `user-journeys.html` lists `slide-bodies/`, `index.html`, `slides/`, and `render-manifest.json` as current artifacts. No E2E failure has been recorded. P0.0 must confirm which artifacts are actually produced by a real smoke run before P0.1 can reconcile the contract.

## Proposal

1. Inventory every reference to `composition.html`, `slide-bodies/`, and `index.html` across docs, specs, agents, and scripts.
2. Run one real smoke run and log which artifacts are actually produced.
3. Determine whether `composition.html` is produced by the composer agent or by `compose-carousel.mjs` assembly.
4. Confirm `user-journeys.html` artifact list matches runtime output.
5. Commit inventory and smoke-run log as evidence for P0.1.

## Acceptance Criteria

1. Every source file referencing `composition.html`, `slide-bodies/`, or `index.html` is listed with line numbers and stated behavior.
2. One smoke run is logged with actual artifacts produced.
3. Decision gate: sole durable HTML artifact confirmed (target: `index.html`).
4. `user-journeys.html` artifact inventory checked against runtime.

## Notes

- Read-only phase; no code changes.
- Evidence feeds directly into P0.1 render-contract-reconciliation.
- `user-journeys.html` is a documentation source that lists run artifacts; it must be in the inventory scope.
- `composition.html` and `slide-bodies/` are private staging artifacts pending inventory evidence; `index.html` is the target sole durable run HTML.
