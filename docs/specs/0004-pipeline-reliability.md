# Spec: Pipeline Reliability

## Status

Accepted

## Goal

Make the pipeline produce five fresh, inspectable, unclipped, substantive
7–10-slide carousels for the canonical proof topics. The pipeline retries only
initial and review-requested candidate content artifacts, up to three total
writer attempts each; it does not repair deterministic validation or export failures.

## Scenario

Starting with an empty runs/ directory, an operator runs the pipeline for ACID
properties, indexes, caching, REST vs GraphQL, and embeddings in that order.
Each success has validated 7–10-slide content, deterministic 1080×1350 PNGs,
and a manifest. On failure, the operator diagnoses and fixes the cause, records
it here, deletes only that attempt's run folder, and starts a fresh attempt for
the same pending topic. runs/ ends with exactly the five successful proof-run
folders.

## In Scope

- Capacity, template-fidelity, and export reliability.
- A local deterministic shell derived from docs/reference/html/index.html; that
  reference is source material only, never raw or network-backed runtime HTML.
- Closed hero, fact, list, quote, comparison, and levels variants with named
  escaped slots and shared header, title, and footer chrome.
- Adaptive 7–10-slide proof content with variant-specific support that prevents
  bare title-and-short-body slides.
- Deterministic checks for capacity, count, dimensions, template fidelity, and
  every overflow mode.
- An ordered proof log, precise failed-folder cleanup, and findings/fixes in
  this document.

## Contracts

The runtime shell has one shared slide chrome and exactly the six closed
variants. Every rendered slide expands exactly one variant. Shared header,
title, and footer hierarchy and typography stay identical across variants.
Every supplied value is escaped text; the renderer cannot inject markup.

The validator rejects unknown variants, a bare slide, missing required support,
or a count outside 7–10 before shell population. At-limit copy must pass
real Chromium at 1080×1350; over-limit copy must be rejected by the validator
or fail export deterministically.

Export verifies every slide is 1080×1350 and rejects any scroll-size excess,
including one pixel. It rejects hidden or clipped overflow and visible content
that escapes the slide content rectangle. A failed validation or export
publishes no manifest.

Preflight requires runs/ to be an existing real, non-symlink directory and
empty. It rejects missing, symlinked, non-directory, or non-empty roots without
automatic cleanup. The proof order is ACID properties, indexes, caching, REST
vs GraphQL, embeddings. Initial content and each review-requested candidate get
up to three total writer attempts; validation removes an invalid selected
artifact, and a failed candidate leaves the last valid canonical content intact.
After any other failure, the operator records the diagnosis and corrective
change, verifies the fix, and starts a fresh attempt of the same pending topic.

## Failure Modes

| Failure | Required result |
| --- | --- |
| Content exceeds capacity, uses an unknown variant, is bare, misses required support, or has outside-7–10 count | Reject before shell population with a diagnostic. |
| Initial writer or review-requested candidate is missing or invalid | Retry that selected artifact up to three total writer attempts; validation removes an invalid selected artifact, and a failed candidate preserves canonical content. |
| HTML changes shared chrome or a closed variant | Reject before export with a structural diagnostic. |
| Runtime uses reference HTML or a remote asset | Reject before export. |
| Slide content is hidden, clipped, overflowed, or visibly escapes | Reject export; no manifest. |
| Proof preflight sees non-empty runs/ | Fail without deletion. |
| Proof attempt fails | Log, safely delete only that attempt directory, then await diagnosis, fix, verification, and fresh same-topic attempt. |

## Acceptance Criteria

- The pipeline uses only the six closed variants, named escaped slots, and
  identical shared chrome; it has no free-form region.
- The reference HTML is never raw or network runtime output.
- The validator rejects bare or missing-support variants and every count outside
  7–10 before rendering.
- Chromium checks cover wrong dimensions/count, one-pixel overflow,
  hidden/clipped overflow, and rectangle containment.
- The log shows every attempt; failures are diagnosed, fixed, verified, and
  their exact folders cleaned before a fresh same-topic attempt.
- runs/ ends with exactly five fresh, substantive successful proof folders in
  canonical topic order.

## Verification

1. Run focused validator/export tests for closed variants, required support,
   7–10 count, reference/runtime isolation, shared-chrome fidelity, capacity,
   overflow, and rectangle containment.
2. Confirm non-empty runs/ preflight fails safely, then begin from an empty
   real runs/ directory.
3. Run each canonical topic in order. After a failure, record diagnosis/fix,
   verify the fix, then run a fresh attempt of the same topic.
4. Validate each final run's content, shell fidelity, 1080×1350 images,
   content-derived 7–10 count, zero overflow, manifest/topic identity, proof
   log, and exact five-folder runs/ inventory.

## Handoff

- Producer: $spec
- Intended consumer: $dev-loop
- Source milestone: docs/milestones/0004-pipeline-reliability.md
- Status: Accepted; implementation is authorized subject to this spec.
- Settled decisions: reference HTML is visual/semantic source only; closed
  deterministic variants with shared chrome; 7–10 non-bare slides; up to three
  writer attempts for initial and candidate artifacts; strict overflow failure;
  five clean proof runs.
- Required reading: this spec and docs/ARCHITECTURE.md.
