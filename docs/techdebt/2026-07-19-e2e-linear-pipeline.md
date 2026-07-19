# Linearize Pipeline

**Status:** Proposed  
**Date:** 2026-07-19  
**Roadmap Phase:** P0.3  
**Requires:** Spec &rarr; dev-loop  
**Depends on:** P0.1 reconciliation  
**Blocks:** P0.4 (single artifact)

## Problem

The pipeline has auto-recovery, art-director/layout stages, and review-revision loops by default. These mask failures, add non-determinism, and make debugging difficult. Malformed content gets retried silently instead of surfacing diagnostics.

## Proposed Change

- Remove art-director/layout stage entirely. Visual variety lives in the composer prompt.
- Remove auto-recovery as default behavior. Deterministic gates stop and return diagnostics.
- Remove review-revision loops. Human review is optional, not auto-triggered.
- Final pipeline: writer &rarr; content validator &rarr; optional human review &rarr; composer &rarr; preflight &rarr; export.
- Writer and composer are the only generation stages.

## Acceptance Criteria

1. Straight trace from request to export with no cycles.
2. No auto-recovery fires by default.
3. Malformed content stops the pipeline with clear diagnostics.
4. Optional human review gate functions when enabled.
5. No art-director or layout stage in the pipeline.
6. Pipeline runs deterministically: same input produces same path.
7. E2E happy path: request to export succeeds.
8. E2E malformed content stops: bad input produces diagnostics, not silent retry.
9. E2E invalid HTML stops: broken markup caught at preflight, not exported.

## Implementation Notes

- Three E2E test items moved here from P0.5 workflow-docs-reset; they belong with pipeline linearization, not doc-only cleanup.
- Requires P0.1 reconciliation complete first.
- Removes safety nets &mdash; make sure deterministic gates are robust before removing old paths.
- Coordinate with P0.4 since single-artifact simplification depends on linearized flow.
- May surface latent bugs that auto-recovery was masking; plan for a stabilization pass.
