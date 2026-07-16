---
name: apollo-generate
description: Produces validated adaptive 7–10-slide Apollo content for one topic.
---

# Apollo Generate

Accept exactly one topic. Trim it; if blank, report `Topic is required.` and do not create a run.

Run `node scripts/create-carousel-run.mjs "<topic>"` before delegation. Delegate exactly once to `carousel-writer`, supplying the normalized topic and run path. It may write only `runs/<run-id>/carousel-content.json`; do not retry, repair, render, research, or call an API client.

Then run `node scripts/validate-carousel-content.mjs <run-dir>`. On failure, report `Validation failed.` On success, report `Created <run-dir>/.`
