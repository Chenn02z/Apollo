---
name: apollo-generate
description: Produces a validated seven-slide Apollo content artifact for one topic. Use when asked to generate an Apollo carousel or carousel content for a technical topic.
---

# Apollo Generate

Accept exactly one topic. Trim leading and trailing whitespace; if it is empty,
report `Topic is required.` and stop without creating a run.

Run `node scripts/create-carousel-run.mjs "<topic>"` (a private helper, not an
Apollo CLI) before delegation. It creates a unique `runs/<run-id>/` directory
and writes `request.json` with the normalized topic, directory-name `runId`,
an ISO UTC millisecond `createdAt`, and `contractVersion` `"1"`, model
`"gpt-5.6-terra"`, and effort `"medium"`.

Delegate exactly once to `carousel-writer`, supplying the normalized topic,
the run path, and [the v1 contract](references/content-contract-v1.md). Authorize
only `runs/<run-id>/carousel-content.json` as its output. Do not call a
standalone LLM client or API, retry, repair, render, research, or make visual
decisions.

After that one delegation, run `node scripts/validate-carousel-content.mjs
runs/<run-id>`. On failure, report `Validation failed.`; the validator retains
the request and deletes only the expected content artifact when present. On
success, report `Created runs/<run-id>/.`
