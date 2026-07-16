---
name: apollo-generate
description: Produces validated adaptive 7–10-slide Apollo content for one topic.
---

# Apollo Generate

Accept exactly one topic. Trim it; if blank, report `Topic is required.` and do not create a run.

Run `node scripts/create-carousel-run.mjs "<topic>"` before delegation. For up to three total initial-content attempts, delegate exactly once per attempt to `carousel-writer`, supplying the normalized topic and run path. It may write only `runs/<run-id>/carousel-content.json`; do not render, research, or call an API client.

After each initial-content attempt, run `node scripts/validate-carousel-content.mjs <run-dir>`. Successful validation is authoritative; retry only if the target is missing or validation fails, while attempts remain. The validator removes an invalid selected content artifact. After the third failed attempt, report `Validation failed.` and stop.

Perform at most three reviews and two revisions. Before review `<n>`, remove only a stale `runs/<run-id>/carousel-review-<n>.json`, then delegate exactly once to `carousel-reviewer`, supplying the run path, the validated `carousel-content.json`, and the required output filename `carousel-review-<n>.json`. It may write only that numbered review file.

Run `node scripts/validate-carousel-review.mjs <run-dir> --file carousel-review-<n>.json`. If delegation fails, the review is missing, or validation fails, report `Created <run-dir>/. Review unavailable.` and stop. Read the validated decision.

If the decision is `approve`, report `Created <run-dir>/ (review: approve).` and stop. After review 3, report `Created <run-dir>/ (review: <decision>).` and stop regardless of its decision.

After review 1 or 2, only if the decision is `approve_with_warnings` or `reject`, make up to three total candidate attempts. Before each attempt, remove only a stale `runs/<run-id>/carousel-content.candidate.json`, then delegate exactly once to `carousel-writer`, supplying the normalized topic, run path, current validated `carousel-content.json`, and numbered review. Instruct it to retain correct material, resolve the review findings, and write only `runs/<run-id>/carousel-content.candidate.json`. It must not modify existing content or reviews.

After each candidate attempt, run `node scripts/validate-carousel-content.mjs <run-dir> --file carousel-content.candidate.json`. Successful validation is authoritative; retry only if the target is missing or validation fails, while attempts remain. The validator removes an invalid selected candidate; `carousel-content.json` remains intact. After the third failed attempt, report `Created <run-dir>/ (review: <decision>; revision failed).` and stop.

After a validated candidate, archive `carousel-content.json` without overwriting an existing archive: before revision 1 as `carousel-content.initial.json`; before revision 2 as `carousel-content.before-revision-2.json`. If that archive already exists, report `Created <run-dir>/ (review: <decision>; revision failed).` and stop. Then rename `carousel-content.candidate.json` to `carousel-content.json` and begin the next review. Do not make more than three initial or per-candidate writer attempts, two successful promotions/revisions, or three reviews.
