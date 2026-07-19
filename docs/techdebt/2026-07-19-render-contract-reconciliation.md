# Render Contract Reconciliation

**Status:** Proposed  
**Date:** 2026-07-19  
**Roadmap Phase:** P0.1  
**Requires:** Requirements &rarr; spec &rarr; dev-loop  
**Depends on:** P0.0 freeze/inventory  
**Blocks:** P0.2 (underfill deletion), P0.3 (linearization)

## Problem

Apollo's render contract has documentation-vs-runtime drift. The render SKILL says the composer output is `composition.html`. The composer and recovery TOMLs define the agent write boundary as `slide-bodies/NN.html` fragments. `compose-carousel.mjs` validates both the fragments and the assembled `composition.html`. No E2E failure has been recorded; the runtime may function if assembly happens outside the agent boundary. But the sources disagree on who produces what, which makes the contract unverifiable.

## Proposed Change

- Establish `index.html` as the sole durable HTML artifact produced by the composer.
- Remove the fragment protocol: no `slide-bodies/NN.html` intermediate files.
- Update composer to write `index.html` directly.
- Update or remove recovery role that reassembles fragments.
- Remove fragment-related helpers, tests, and SKILL references.
- No cleanup of other stages until an actual E2E smoke run reaches PNG export.

## Acceptance Criteria

1. One actual run completes: request &rarr; writer &rarr; composer &rarr; `index.html` &rarr; preflight &rarr; PNG export + manifest.
2. SKILL prose and TOML agent boundaries agree on what the composer writes.
3. `index.html` is named as sole published HTML artifact in docs; `composition.html` is documented as private runtime intermediate.
4. Fragment assembly tests removed or replaced with contract-level E2E test.
5. Render SKILL documents the new single-artifact contract.

## Implementation Notes

- Requires requirements/spec phase before any code changes.
- Run through dev-loop: spec &rarr; implement &rarr; verify.
- Smoke test the actual render before removing old paths &mdash; prove the new path works first.
- Coordinate with P0.3 (linearization) since both touch the composer/recovery boundary.
