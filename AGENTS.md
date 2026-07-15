# AGENTS.md

## Startup

- Read `README.md` once for workspace overview.
- The active `SKILL.md` declares its own document prerequisites. Do not
  preemptively read canonical docs that the skill does not require.
- Reference docs on demand when a skill names them:
  - `docs/WORKFLOWS.md` for handoff interface contracts and status language.
  - `docs/AGENT_ROLES.md` for subagent roles, permissions, and routing.
  - `docs/DOCS_POLICY.md` for documentation destinations and status rules.

## Behavior

**The main agent delegates work; it does not perform subagent work itself.**
Do not read source files when `explorer` exists. Do not edit files when
`implementer` exists. Do not run verification when `test-runner` exists.
When a skill says to use a subagent, invoke it, report it unavailable, or
explain why not applicable. Silent substitution is a workflow violation.

### 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes,
simplify.

### 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

Apply the same discipline to the repo:
- Preserve user-owned worktree changes. Do not revert unrelated edits.
- Batch reviewer findings: one implementer pass per review cycle, not a
  fix-verify-fix-verify ping-pong.

### 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it
work") require constant clarification.

These guidelines are working if: fewer unnecessary changes in diffs, fewer
rewrites due to overcomplication, and clarifying questions come before
implementation rather than after mistakes.

### 5. Context Auto-Trigger

After any milestone is completed, spec is marked Verified, architecture seam is opened or closed, or settled terminology decision is made, invoke $context.

Do not wait for the developer to ask.

## Definition Of Done

A task is done when:
1. The change satisfies the relevant spec or explicit task.
2. The diff is scoped to the requested behavior.
3. Verification was run, or the missing command/reason is reported.
4. Docs/spec status are updated when a decision settles.
5. Remaining risks or follow-up specs are named plainly.
