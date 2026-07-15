# Spec: Codex Carousel Content Workflow

## Status

Verified

## Goal

Provide the first local Codex-native Apollo stage: `apollo-generate` accepts
one nonblank topic and produces a validated seven-slide content artifact in a
new `runs/<run-id>/` directory.

## Scenario

A creator invokes `apollo-generate` for `ACID properties in databases`. The
skill creates `runs/<run-id>/request.json`, delegates once to
`carousel-writer`, validates its output, then reports that run path.

## Architecture Reference

This spec implements the first stage of the MVP flow in
[`docs/ARCHITECTURE.md`](../ARCHITECTURE.md):
`topic → apollo-generate → carousel-writer → request/content JSON`.

## In Scope

- The `apollo-generate` Codex skill bundle, v1 contract reference, and
  deterministic content validation.
- `.codex/agents/carousel-writer.toml`, pinned to `gpt-5.6-terra` with medium
  reasoning effort.
- Per-run `request.json` and validated `carousel-content.json` artifacts.
- Explicit skill invocation and equivalent natural-language activation.

## Out Of Scope

- HTML, PNG, manifests, theme packs, rendering, or visual review.
- Research, citations, topic taxonomy, retries, repairs, caching, publishing,
  scheduling, external assets, hosted execution, web UI, or authentication.
- A standalone CLI, LLM API client/key, alternate content producer, or
  alternate model.

## Architecture Seams

- **Run artifact boundary:** create and use only `runs/<run-id>/`; this stage
  writes only `request.json` and validated `carousel-content.json`.
- **Content/HTML boundary:** the content artifact holds layout-ready copy only;
  a future Codex-native renderer consumes it without this stage making HTML or
  visual decisions.
- **Deferred validation boundary:** this validation covers content-contract
  validity only. Future validators independently check rendered dimensions,
  slide count, and overflow.

## Contracts

### Input and topic normalization

The skill accepts exactly one topic. Normalize it by trimming leading and
trailing whitespace. The normalized topic must be nonempty and is the exact
string recorded in `request.json` and required in `carousel-content.json`.

### Run and request artifact

After accepting the normalized topic, create one `runs/<run-id>/` directory
and write `runs/<run-id>/request.json` before delegation. Its JSON object
records at least these fields:

```json
{
  "contractVersion": "1",
  "topic": "ACID properties in databases",
  "runId": "<run-id>",
  "createdAt": "<creation timestamp>",
  "model": "gpt-5.6-terra",
  "effort": "medium"
}
```

`contractVersion` is exactly `"1"`; `topic` is the normalized input;
`runId` exactly matches the directory name; `createdAt` is an RFC3339 UTC
timestamp exactly matching `YYYY-MM-DDTHH:mm:ss.sssZ`, with a semantically
valid date and time (non-`Z` offsets are rejected); `model` and `effort` are
exactly the configured writer values above. Validation requires those six
fields, their stated values, and their required JSON types; additional metadata
is allowed.

### Content artifact v1

The writer may write only `runs/<run-id>/carousel-content.json`. It must be a
closed JSON object with exactly these fields:

```json
{
  "version": "1",
  "topic": "ACID properties in databases",
  "slides": [
    {
      "number": 1,
      "role": "hook",
      "title": "...",
      "body": "...",
      "items": []
    }
  ]
}
```

`version` is exactly `"1"`; `topic` exactly equals the normalized request
topic; and `slides` contains exactly seven closed slide objects. Every slide
has exactly `number`, `role`, `title`, `body`, and `items`, with no extra
fields. Slide numbers and roles are paired and ordered exactly as follows:

| Number | Role |
| --- | --- |
| 1 | `hook` |
| 2 | `concept` |
| 3 | `breakdown` |
| 4 | `example` |
| 5 | `comparison` |
| 6 | `application` |
| 7 | `takeaway` |

`title` is a string of 1–70 characters; `body` is a string of 1–220
characters; `items` is an array of zero to three strings, each 1–80
characters. Count every text limit as Unicode code points with
`Array.from(value).length`, without trimming or normalization.

### Plain-text validation

Apply the following deterministic pattern checks independently to every
`title`, `body`, and item. Reject matches for HTML tags, comments,
declarations, processing instructions, or entities; brace-delimited CSS rules
or at-rules; Markdown block lines (headings, quotes, unordered or ordered
lists, fenced code, and thematic breaks); inline paired backticks; links or
images; and paired emphasis delimiters when the delimiters are bounded by
whitespace, start/end, or punctuation.

Use these JavaScript regular-expression checks: HTML is
`/<!--[\\s\\S]*?-->|<![A-Za-z][^>]*>|<\\?[\\s\\S]*?\\?>|<\\/?[A-Za-z][^>]*>|&(?:#\\d+|#x[0-9A-Fa-f]+|[A-Za-z][A-Za-z0-9]+);/`;
CSS is `/[^{}\\n]+\\{[^{}\\n]*\\}|@[A-Za-z-]+(?:[^;{}]*[;{])/`; block
Markdown is `/^(?: {0,3}#{1,6}\\s+.*| {0,3}>.*| {0,3}[-+*]\\s+.*| {0,3}\\d+[.)]\\s+.*| {0,3}(?:```|~~~).*| {0,3}(?:(?:-\\s*){3,}|(?:\\*\\s*){3,}|(?:_\\s*){3,}))$/m`;
and inline Markdown is ``/`[^`\n]+`|!?\[[^\]\n]*\]\([^\n)]*\)|(?:^|[\s\p{P}])(\*{1,3}|_{1,3})(?=\S)[\s\S]+?\1(?=$|[\s\p{P}])/u``.

Do not render, parse, sanitize, or rewrite text. Ordinary prose, `O(n log n)`,
`snake_case`, `GET /users`, URLs, parentheses, colons, and hyphens remain
allowed unless they match a Markdown pattern above.

### Delegation

The configured `carousel-writer` receives the normalized topic and v1 content
contract. The skill delegates exactly once. It authorizes no output except
the content-artifact path above, does not retry, and does not repair output.
The workflow does not invoke a shell CLI or standalone LLM API client.

### Deterministic validation

After the sole delegation, validate without content generation or repair:
artifact location, readability, JSON syntax, required request fields and
types, closed content schemas, topic equality, exactly seven slides, required
number/role order, string and array types, field lengths, and the
plain-text pattern checks. Only after every check passes may the workflow
report a successful run path.

## Failure Modes

| Condition | Required behavior |
| --- | --- |
| Missing or blank normalized topic | Report a concise failure; create no run directory and do not delegate. |
| Run-directory creation fails | Report a concise failure; do not delegate. |
| `request.json` creation fails | Report a concise failure; do not delegate. |
| Writer delegation or execution fails | Report a concise failure; retain `request.json` when written; do not report success. |
| Output is missing, unreadable, invalid JSON, or at any path other than `runs/<run-id>/carousel-content.json` | Treat it as missing; do not scan, read, modify, or delete anything outside the run; delete only the expected-path content artifact if it exists; retain `request.json`; report a concise validation failure; do not report success. |
| Output violates a closed schema, topic match, count/order, type, length, or plain-text constraint | Delete only `runs/<run-id>/carousel-content.json` if it exists; retain `request.json`; report a concise validation failure; do not repair, retry, parse, render, transform, sanitize, rewrite, or report success. |

## Acceptance Criteria

- `apollo-generate`, explicitly or through an equivalent natural-language
  request, accepts one nonblank normalized topic and uses no standalone CLI or
  LLM API client.
- It writes the required-fields `request.json` contract before exactly one
  `carousel-writer` delegation, using the pinned model and effort.
- The writer can write only the specified content path.
- A reported success contains a content artifact satisfying every v1 contract
  requirement and names its `runs/<run-id>/` path.
- Every failure in the table is concise, creates no unauthorized artifacts,
  never retries or repairs, retains an already-written request, and never
  reports unvalidated content as successful.
- No out-of-scope rendering, research, citation, taxonomy, retry/repair, or
  external-asset capability is added.

## Verification

- Automated checks cover explicit and implicit activation, blank-topic
  rejection, normalized topic equality, request-before-delegation,
  one-delegation behavior, pinned agent configuration, writer output
  authorization, artifact location, every required request field and closed
  content-schema constraint, and each failure-table behavior.
- Automated checks confirm invalid agent output is deleted while the existing
  request is retained and no success is reported.
- A focused test constructs or imports all four JavaScript regex patterns so a
  compilation failure fails the test; it rejects representative HTML, CSS,
  block and inline Markdown, and accepts `O(n log n)`, `snake_case`,
  `GET /users`, a plain URL, parentheses, colons, and hyphens.
- Manually inspect one representative run's `request.json` and validated
  `carousel-content.json`.

## Open Questions

None.
