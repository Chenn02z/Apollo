---
name: write-a-skill
description: Create new agent skills with proper structure, progressive disclosure, and bundled resources. Use when a user wants to create, write, or refine a skill.
---

# Writing Skills

## Process

1. Gather requirements:
   - What task or domain does the skill cover?
   - What specific use cases should it handle?
   - Does it need scripts or just instructions?
   - Any reference materials to include?
2. Draft the skill:
   - `SKILL.md`
   - additional reference files if content is too large
   - utility scripts if deterministic operations are needed
3. Review the draft:
   - Does it cover the use cases?
   - Anything missing or unclear?
   - Should any section be more or less detailed?

## Skill Structure

```text
skill-name/
├── SKILL.md
├── REFERENCE.md
├── EXAMPLES.md
└── scripts/
    └── helper.js
```

## Description Requirements

The description is the trigger surface for the agent selecting the skill.
Make it specific enough to say:

1. what capability the skill provides
2. when or why to use it

Guidelines:

- keep it under 1024 characters
- write in third person
- make the first sentence describe the capability
- make the second sentence begin with `Use when ...`

## Review Checklist

- description includes triggers
- `SKILL.md` stays concise
- terminology is consistent
- examples are concrete
- references stay shallow

