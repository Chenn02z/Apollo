---
name: apollo-generate
description: Produces validated adaptive 7–10-slide Apollo content for one topic.
---

# Apollo Generate

Accept exactly one topic. Trim it; if blank, report `Topic is required.` and do not create a run.

After a run exists, before every failure stop append one sanitized event with `node scripts/recovery-memory.mjs log <run-dir> <stage> "<diagnostic>" <cycle> <outcome>`. The run-local `recovery-log.jsonl` and workspace `recovery-history.jsonl` are durable memory. Only `generate-candidate` is recoverable, from its current validated content checkpoint; all other generate failures are terminal.

Run `node scripts/create-carousel-run.mjs "<topic>"` before delegation. For up to three total initial-content attempts, delegate exactly once per attempt to `carousel-writer`, supplying the normalized topic and run path. It may write only `runs/<run-id>/carousel-content.json`; do not render, research, or call an API client.

After each initial-content attempt, run `node scripts/validate-carousel-content.mjs <run-dir>`. Successful validation is authoritative; retry only if the target is missing or validation fails, while attempts remain. The validator removes an invalid selected content artifact. After the third failed attempt, append a `generate-content` terminal event with `node scripts/recovery-memory.mjs log <run-dir> generate-content "<diagnostic>" 0 terminal`, report `Validation failed.`, and stop: there is no valid checkpoint to recover.

Perform at most two review–revision cycles.

Before review `<n>`, remove only a stale `runs/<run-id>/carousel-review-<n>.json`, then delegate exactly once to `carousel-reviewer`, supplying the run path, the validated `carousel-content.json`, and the required output filename `carousel-review-<n>.json`. It may write only that numbered review file.

Run `node scripts/validate-carousel-review.mjs <run-dir> --file carousel-review-<n>.json`. If delegation fails, the review is missing, or validation fails, append a `generate-review` terminal event with `recovery-memory.mjs`, report `Created <run-dir>/. Review unavailable.`, and stop. Read the validated decision.

If the decision is `approve`, report `Created <run-dir>/ (review: approve).` and stop.

After review 1 or review 2, if the decision is `approve_with_warnings` or `reject`, make up to two candidate attempts. Before each attempt, remove only a stale `runs/<run-id>/carousel-content.candidate.json`, then delegate exactly once to `carousel-writer`, supplying the normalized topic, run path, current validated `carousel-content.json`, and the corresponding numbered review. Instruct it to retain correct material, resolve the review findings, and write only `runs/<run-id>/carousel-content.candidate.json`. It must not modify existing content or reviews.

After each candidate attempt, run `node scripts/validate-carousel-content.mjs <run-dir> --file carousel-content.candidate.json`. Successful validation is authoritative; retry only if the target is missing or validation fails, while attempts remain. The validator removes an invalid selected candidate; `carousel-content.json` remains intact.

After the second failed candidate attempt, append a `generate-candidate` event with `recovery-memory.mjs`, then delegate exactly once to `carousel-recovery` with the normalized topic, run path, current validated `carousel-content.json`, review, run/workspace recovery JSONL files (read-only), and `carousel-content.candidate.json` as its only output. Validate the candidate with the same validator. If valid, continue with the archive and promotion steps below. If invalid and its stage:code signature differs, append cycle 2 and make one final identical recovery delegation; validate it once. If that validation fails, or the first signature repeats, append outcome `exhausted` or `repeated`, then report `Created <run-dir>/ (review: <decision>; revision failed).` and stop. Do not make more than two recovery delegations per top-level generate invocation.

After a validated candidate, archive `carousel-content.json` without overwriting an existing archive:

* before revision 1, as `carousel-content.initial.json`
* before revision 2, as `carousel-content.before-revision-2.json`

If the required archive already exists, append a `generate-archive` terminal event with `recovery-memory.mjs`, report `Created <run-dir>/ (review: <decision>; revision failed).`, and stop.

Then rename `carousel-content.candidate.json` to `carousel-content.json`.

After revision 1, begin review 2.

After revision 2, do not perform another review. Report `Created <run-dir>/ (review: <decision>; final revision accepted).` and stop.

Do not make more than three initial-content attempts, two candidate attempts per revision, two successful promotions/revisions, or two reviews.
