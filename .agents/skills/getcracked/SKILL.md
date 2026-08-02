---
name: getcracked
description: Sole user-facing entry point. Orchestrates research, topic selection, inventory management, and per-topic deck generation.
---

# Getcracked Orchestration

`$getcracked` is the sole user-facing entry point. It takes a
natural-language request specifying a category and count, invokes the
`web-researcher` agent for current topics, selects teachable
normalized-unique topics, appends them to the inventory, and dispatches one
`$generate` workflow per topic. Users do not invoke `$generate` or the
web-research agent separately.

## Category slug derivation

| Category | Slug |
|---|---|
| DSA | `dsa` |
| System Design | `system-design` |
| Software Design | `software-design` |
| Java & Backend Development | `java-backend-development` |
| Databases | `databases` |
| AI Engineering | `ai-engineering` |
| Deep Learning | `deep-learning` |

## 1. Parse the user request

Extract the count (positive integer ≤ 10) and category (must be one of
the seven exact names). If the category is unknown, halt with the list of
seven valid categories. If the count is missing or out of range, halt with
a clear error.

## 2. Invoke the web-researcher for topic selection

Delegate to the `web-researcher` agent (`.codex/agents/apollo/web-researcher.toml`)
to determine what is currently tested or interviewed in the named category.
The agent returns research findings (cited sources, current topics) in-session.
Sources are never written to any file.

## 3. Read the inventory

Read `docs/getcracked-inventory.md`. Note every existing topic name under the
named category.

## 4. Select normalized-unique topics

From the research findings, select exactly the requested count of teachable
topics:

- Normalize each candidate name: lowercase, trim leading/trailing whitespace,
  collapse internal whitespace to single spaces, strip ASCII punctuation,
  retain articles.
- Compare against the normalized names of all existing entries under that
  category in the inventory.
- If a candidate collides, produce a replacement candidate and re-check.
  Repeat until exactly the requested count of unique topics is found.

## 5. Append `planned` entries to inventory

For each selected topic, append a row to the named category's table in
`docs/getcracked-inventory.md`:

```
| <Topic Name> | planned | — |
```

Write all new rows before dispatching any workflows.

## 6. Dispatch `$generate` workflows

For each selected topic, dispatch one `$generate` workflow, passing:

- The topic name
- The category name (so `$generate` can derive the category slug for
  `runs/<category-slug>/<run-id>/`)

Workflows are dispatched onto the runtime's own queue. `$getcracked` does
not precreate runs or generate run-ids.

## 7. Process results sequentially

After each workflow completes, before processing the next:

**On success:**
- Write `runs/<category-slug>/<run-id>/metadata.md`:
  ```markdown
  # <deck title>

  <1–2 sentence description>
  ```
- Update that topic's inventory row: change status from `planned` to
  `generated`, and replace `—` with `runs/<category-slug>/<run-id>/`.

**On failure:**
- Leave the topic as `planned`.
- Report the failure to the developer with the topic name and the final
  error.
- Continue to the next topic.

Inventory writes are sequential (one at a time, never concurrent).

## 8. Report final summary

After all workflows complete, report:

- Count of generated topics with their run links
- Count of failed topics with their names
- The updated inventory path

## Notes

- The `reviewed` status is reached only by the developer manually editing
  the inventory. Nothing in this workflow sets `reviewed`.
- `$getcracked` owns all inventory writes, metadata writes, and status
  transitions. No other agent edits the inventory.
