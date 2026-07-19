# Delete BODY_UNDERFILL Stale Claims

**Status:** Proposed  
**Date:** 2026-07-19  
**Roadmap Phase:** P0.2  
**Requires:** Accepted cleanup spec  
**Depends on:** P0.1 contract smoke pass  
**Blocks:** P0.5 (docs reset)

## Problem

`scripts/measure-carousel.mjs` has BODY_UNDERFILL code commented out, but claims about it survive as Verified documentation and fake tests. Dead claims create confusion about what's actually tested. User has explicitly requested removal.

## Proposed Change

- Remove all live references to BODY_UNDERFILL from code, docs, and tests.
- Retain overflow, dimensions, safe HTML, and export integrity checks &mdash; these are real and tested.
- Verify no other file references BODY_UNDERFILL after cleanup.

## Acceptance Criteria

1. `rg -i body_underfill` returns zero hits across the repo.
2. Overflow/dimensions/safe HTML/export integrity tests pass unchanged.
3. No doc claims BODY_UNDERFILL as verified or tested.
4. No test is marked as covering BODY_UNDERFILL.

## Implementation Notes

- Can run as a simple cleanup pass after P0.1 contract smoke succeeds.
- Requires an Accepted cleanup spec per workflow.
- Low risk: removing dead code and stale documentation only.
- Does not touch live measurement or integrity logic.
