# Spec: Adaptive Carousel Content

## Status

Verified

## Goal

Produce, validate, and render a content-derived 7–10-slide technical carousel
from one topic.

## Scenario

A creator invokes apollo-generate for ACID properties in databases. It writes a
request, delegates once to carousel-writer, and validates carousel-content.json.
apollo-render validates the run, runs scripts/populate-carousel.mjs to expand
the fixed local shell with escaped slots, then exports one 1080×1350 PNG per
slide plus a manifest.

## Contracts

### Content artifact

carousel-content.json is a closed plain-text artifact. Its slide array is the
sole slide-count source and contains 7–10 consecutively numbered slides. The
first role is hook, the second is the sole overview, the last is takeaway, and
intermediate roles are concept, example, deep-dive, or optional interview.

Every slide has exactly these common fields:

- number
- role
- variant
- title
- why
- glossary: 1–2 term/definition pairs

The closed variants and their required additional fields are:

| Variant | Required fields |
| --- | --- |
| hero | prompt |
| fact | factValue, factLabel |
| list | items: 2–4 label/detail pairs |
| quote | quote, attribution |
| comparison | comparison: left and right label/summary/2–4-item sides |
| levels | levels: 2–4 label/value/description entries, each value 0–100 |

Validation rejects unknown fields, markup, malformed structure, invalid roles,
unbreakable tokens longer than 32 code points, and a count outside 7–10 before
rendering.

### Capacity limits

All limits are Unicode code points:

| Field | Limit |
| --- | ---: |
| topic | 48 |
| title | 56 |
| why | 180 |
| prompt | 110 |
| factValue | 24 |
| factLabel | 96 |
| list item label/detail | 32 / 112 |
| quote / attribution | 220 / 72 |
| comparison label/summary/item | 36 / 96 / 64 |
| level label/description | 36 / 96 |
| glossary term/definition | 32 / 96 |

### Render and export

apollo-render accepts exactly one run directory and validates it before
deterministically running scripts/populate-carousel.mjs. That script expands
the matching closed template from assets/database/carousel-shell.html and
escapes every content value before writing index.html.

index.html contains one carousel with ordered slide roots equal to the content
slide count. Every root has a direct slide-content child, is exactly 1080×1350
CSS pixels, and contains all visible copy in that child. Scripts, external
assets, network access, and clipped or hidden overflow are forbidden.

Export writes one 1080×1350 PNG per slide to slides/ and writes
render-manifest.json last. A failure retains input and HTML, publishes no new
manifest, and preserves a prior complete publication when present.

## Failure Modes

| Condition | Required behavior |
| --- | --- |
| Missing or blank topic | Fail before delegation; create no run for blank input. |
| Writer failure, absent output, or invalid output | Retain request; remove only invalid content; do not retry or render. |
| Invalid content, count, role sequence, variant, markup, token, or capacity | Fail before rendering with a field or count diagnostic. |
| Shell population failure or missing HTML | Retain input; do not export or publish a manifest. |
| Prohibited HTML, clipping, or overflow | Retain HTML; publish no new output. |
| Screenshot, staging, publication, or manifest failure | Never expose partial output; restore prior valid output or leave no manifest. |

## Acceptance Criteria

- Only validated slide content determines the 7–10 slide count.
- The closed common fields and one closed variant payload are required for every
  slide.
- Invalid counts, role sequence, variant schema, markup, tokens, and capacities
  fail before shell population.
- The deterministic renderer exports one ordered 1080×1350 PNG per slide and a
  matching manifest.
- Overflow produces a deterministic slide-specific diagnostic.
- Manual ACID review proves distinct Atomicity, Consistency, Isolation,
  Durability, a concurrency example, and a final takeaway.

## Verification

- Targeted validator checks cover 7/10 acceptance, 6/11 rejection, roles,
  closed variants, field capacities, markup/token rejection, and pre-render
  failure.
- Targeted renderer checks cover 7/10 roots, escaped shell population, PNG
  dimensions, ordered manifest paths, route abort, rollback, and width/height
  overflow diagnostics.
- Run a real Chromium export when the browser is installed.

## Open Questions

None.
