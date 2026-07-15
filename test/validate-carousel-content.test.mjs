import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { BLOCK_MARKDOWN, CSS, HTML, INLINE_MARKDOWN, validateRun, validateText } from "../scripts/validate-carousel-content.mjs";
import { createRun } from "../scripts/create-carousel-run.mjs";

const roles = ["hook", "concept", "breakdown", "example", "comparison", "application", "takeaway"];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "apollo-")); const run = join(root, "runs", "run-1");
  const request = { contractVersion: "1", topic: "ACID properties", runId: "run-1", createdAt: "2026-07-16T00:00:00.000Z", model: "gpt-5.6-terra", effort: "medium" };
  const content = { version: "1", topic: request.topic, slides: roles.map((role, index) => ({ number: index + 1, role, title: `Slide ${index + 1}`, body: "Plain prose.", items: [] })) };
  return { run, request, content };
}
function write({ run, request, content }) {
  mkdirSync(run, { recursive: true });
  writeFileSync(join(run, "request.json"), JSON.stringify(request));
  writeFileSync(join(run, "carousel-content.json"), JSON.stringify(content));
}

test("accepts the v1 artifact and validates request fields", () => {
  const value = fixture(); write(value); assert.equal(validateRun(value.run).slides.length, 7);
});

test("normalizes one topic and writes the request before delegation", () => {
  const root = mkdtempSync(join(tmpdir(), "apollo-"));
  const run = createRun("  ACID properties  ", { root, runId: "run-1", createdAt: "2026-07-16T00:00:00.000Z" });
  assert.deepEqual(JSON.parse(readFileSync(join(run, "request.json"))), { contractVersion: "1", topic: "ACID properties", runId: "run-1", createdAt: "2026-07-16T00:00:00.000Z", model: "gpt-5.6-terra", effort: "medium" });
  assert.throws(() => createRun("  ", { root, runId: "run-2" }));
  assert.equal(existsSync(join(root, "runs", "run-2")), false);
});

test("deletes invalid content but retains request", () => {
  const value = fixture(); value.content.slides[0].title = "<b>bad</b>"; write(value);
  assert.throws(() => validateRun(value.run));
  assert.equal(existsSync(join(value.run, "carousel-content.json")), false);
  assert.deepEqual(JSON.parse(readFileSync(join(value.run, "request.json"))), value.request);
});

test("rejects every request and content contract violation", () => {
  const cases = [
    value => { value.request.contractVersion = 1; }, value => { value.request.topic = 1; }, value => { value.request.runId = "other"; }, value => { value.request.createdAt = "2026-02-30T00:00:00.000Z"; }, value => { value.request.model = "other"; }, value => { value.request.effort = "high"; },
    value => { value.content.extra = true; }, value => { value.content.topic = "other"; }, value => { value.content.slides.pop(); }, value => { value.content.slides[0].number = 2; }, value => { value.content.slides[0].role = "other"; }, value => { value.content.slides[0].extra = true; }, value => { value.content.slides[0].title = "x".repeat(71); }, value => { value.content.slides[0].body = "x".repeat(221); }, value => { value.content.slides[0].items = ["a", "b", "c", "d"]; }, value => { value.content.slides[0].items = [1]; },
  ];
  for (const change of cases) { const value = fixture(); change(value); write(value); assert.throws(() => validateRun(value.run)); assert.equal(existsSync(join(value.run, "carousel-content.json")), false); assert.equal(existsSync(join(value.run, "request.json")), true); }
});

test("rejects missing, unreadable, and invalid JSON artifacts", () => {
  for (const path of ["request.json", "carousel-content.json"]) {
    const value = fixture(); write(value); unlinkSync(join(value.run, path));
    assert.throws(() => validateRun(value.run)); assert.equal(existsSync(join(value.run, "request.json")), path === "request.json" ? false : true);
  }
  for (const path of ["request.json", "carousel-content.json"]) {
    const value = fixture(); write(value); writeFileSync(join(value.run, path), "{");
    assert.throws(() => validateRun(value.run)); assert.equal(existsSync(join(value.run, "carousel-content.json")), false);
  }
  const value = fixture(); write(value); unlinkSync(join(value.run, "request.json")); mkdirSync(join(value.run, "request.json"));
  assert.throws(() => validateRun(value.run)); assert.equal(existsSync(join(value.run, "carousel-content.json")), false);
});

test("enforces required keys, collection types, and Unicode boundaries", () => {
  const invalid = [
    value => { delete value.request.model; }, value => { value.content.version = "2"; }, value => { value.content.slides = {}; }, value => { value.content.slides[0].title = 1; }, value => { value.content.slides[0].body = ""; }, value => { value.content.slides[0].items = "item"; }, value => { value.content.slides[0].items = [""]; },
  ];
  for (const change of invalid) { const value = fixture(); change(value); write(value); assert.throws(() => validateRun(value.run)); }
  const value = fixture(); value.content.slides[0] = { number: 1, role: "hook", title: "😀".repeat(70), body: "b".repeat(220), items: ["😀".repeat(80), "a", "b"] }; write(value);
  assert.doesNotThrow(() => validateRun(value.run));
});

test("rejects markup in titles and items", () => {
  for (const key of ["title", "items"]) {
    const value = fixture(); value.content.slides[0][key] = key === "title" ? "[link](https://x.test)" : ["@media screen {"];
    write(value); assert.throws(() => validateRun(value.run));
  }
});

test("does not touch misplaced artifacts", () => {
  const root = mkdtempSync(join(tmpdir(), "apollo-")); const misplaced = join(root, "elsewhere", "run-1");
  const value = fixture(); value.run = misplaced; write(value);
  assert.throws(() => validateRun(misplaced));
  assert.equal(existsSync(join(misplaced, "carousel-content.json")), true);
});

test("rejects plain-text violations in content fields", () => {
  for (const text of ["<p>x</p>", "x { color: red; }", "# heading", "`code`", "**bold**"]) { const value = fixture(); value.content.slides[0].body = text; write(value); assert.throws(() => validateRun(value.run)); }
});

test("never follows or deletes symlinked run artifacts", () => {
  const root = mkdtempSync(join(tmpdir(), "apollo-")); const outside = join(root, "outside"); mkdirSync(outside); writeFileSync(join(outside, "carousel-content.json"), "outside");
  mkdirSync(join(root, "runs")); symlinkSync(outside, join(root, "runs", "run-1"));
  assert.throws(() => validateRun(join(root, "runs", "run-1"))); assert.equal(readFileSync(join(outside, "carousel-content.json"), "utf8"), "outside");
  const value = fixture(); write(value); const target = join(root, "target.json"); writeFileSync(target, "outside");
  unlinkSync(join(value.run, "carousel-content.json")); symlinkSync(target, join(value.run, "carousel-content.json"));
  assert.throws(() => validateRun(value.run));
  assert.equal(readFileSync(target, "utf8"), "outside");
});

test("skill and writer declarations preserve the one-delegation boundary", () => {
  const skill = readFileSync(".agents/skills/apollo/apollo-generate/SKILL.md", "utf8");
  const writer = readFileSync(".codex/agents/carousel-writer.toml", "utf8");
  assert.match(skill, /Use when asked to generate an Apollo carousel or carousel content/);
  assert.match(skill, /Accept exactly one topic/); assert.match(skill, /before delegation/); assert.equal((skill.match(/Delegate exactly once/g) ?? []).length, 1);
  assert.match(skill, /runs\/<run-id>\/carousel-content\.json/); assert.match(skill, /Do not[\s\S]*retry, repair/); assert.match(skill, /On failure, report `Validation failed\.`/); assert.match(skill, /On\s+success, report `Created runs/);
  assert.match(writer, /model = "gpt-5\.6-terra"/); assert.match(writer, /model_reasoning_effort = "medium"/); assert.match(writer, /Write exactly one file: runs\/<run-id>\/carousel-content\.json/);
});

test("plain-text patterns reject markup and allow ordinary technical prose", () => {
  assert.match("<p>x</p>", HTML); assert.match("x { color: red; }", CSS); assert.match("# heading", BLOCK_MARKDOWN); assert.match("[link](https://x.test)", INLINE_MARKDOWN);
  for (const text of ["<p>x</p>", "x { color: red; }", "# heading", "`code`", "**bold**"]) assert.throws(() => validateText(text, 220));
  for (const text of ["O(n log n)", "snake_case", "GET /users", "https://example.test/path", "(parentheses): hyphen-word"]) assert.doesNotThrow(() => validateText(text, 220));
});
