# Workflow Docs Reset

**Status:** Proposed  
**Date:** 2026-07-19  
**Roadmap Phase:** P0.5  
**Requires:** P0 decisions finalized; context skill after implementation  
**Depends on:** P0.1–P0.4 complete  
**Blocks:** None (final phase)

## Problem

Documentation has accumulated overlapping sources with stale contract claims. ARCHITECTURE, CONTEXT, README, SKILL, TOML, and WORKFLOWS files all partially describe the pipeline, and several reference removed or contradictory artifacts. There are no E2E checks that verify the pipeline actually works.

## Proposed Change

Establish one doc per concern:
- **ARCHITECTURE** — live diagram + ownership only
- **CONTEXT** — terms and definitions only
- **README** — overview and contract summary
- **SKILL** — step-by-step procedure
- **TOML** — permissions and config
- **WORKFLOWS** — generic lifecycle stages

Real Chromium testing lives only in an explicit browser lane, not mixed into unit tests.

Three E2E test items moved to P0.3 linearization ticket (2026-07-19-e2e-linear-pipeline); they test pipeline behavior, not documentation.

## Acceptance Criteria

1. No doc references `composition.html`, fragment protocol, auto-recovery, or art-director as current behavior.
2. One canonical diagram in ARCHITECTURE matches the actual pipeline.
3. CONTEXT defines terms used by all other docs without contradicting them.
4. No unit test claims to be an E2E check unless it runs the full pipeline.
5. E2E tests live in P0.3 linearization ticket, not here.

## Implementation Notes

- Requires all P0 phases (P0.1–P0.4) complete so docs reflect the settled pipeline.
- Run `$context` after each doc update to keep terminology aligned.
- Doc-only change plus three small E2E test additions.
- Low risk; primarily deletion of stale text and addition of targeted checks.
