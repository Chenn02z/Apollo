---
name: apollo-generate-v2
description: Produces validated adaptive 7–10-slide Apollo v2 content for one topic.
---

# Apollo Generate v2

Accept exactly one topic. Trim it; if blank, report `Topic is required.` and do not create a run.

Run `node scripts/create-carousel-run-v2.mjs "<topic>"` before delegation. Delegate exactly once to `carousel-writer-v2`, supplying the normalized topic, run path, and v2 contract. It may write only `runs/<run-id>/carousel-content-v2.json`; do not retry, repair, render, research, or call an API client.

Then run `node scripts/validate-carousel-content-v2.mjs <run-dir>`. On failure, report `Validation failed.` On success, report `Created <run-dir>/.`
