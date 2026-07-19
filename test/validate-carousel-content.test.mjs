import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { validateRun } from "../scripts/validate-carousel-content.mjs";
import { createRun } from "../scripts/create-carousel-run.mjs";

const contents = [
  { type:"statement", text:"Atomicity makes one outcome visible." },
  { type:"collection", items:[{ label:"Commit", detail:"Keep every write." },{ label:"Rollback", detail:"Keep no write." }] },
  { type:"comparison", sides:[{ label:"Commit", items:["All writes"] },{ label:"Rollback", items:["No writes"] }] },
  { type:"sequence", steps:[{ label:"Write", detail:"Change both rows." },{ label:"Commit", detail:"Publish together." }] },
  { type:"example", setup:"Move ten credits.", code:"BEGIN;\nUPDATE accounts;\nCOMMIT;", explanation:"Both balances change together." },
  { type:"checklist", items:[{ label:"Boundary", detail:"Start the transaction." },{ label:"Outcome", detail:"Commit or roll back." }] },
];
function fixture(count = 7) {
  const root = mkdtempSync(join(tmpdir(), "apollo-")), run = join(root, "runs", "run-1"), roles = ["hook", "overview", ...Array.from({ length:count - 3 }, (_, index) => ["concept", "example", "deep-dive", "interview"][index % 4]), "takeaway"];
  const slides = roles.map((role, index) => ({ number:index + 1, role, title:`Slide ${index + 1}`, why:"This explains a concrete database decision.", glossary:[{ term:"Transaction", definition:"A unit of database work." }], content:structuredClone(contents[index % contents.length]) }));
  return { run, request:{ topic:"ACID", runId:"run-1", createdAt:"2026-07-16T00:00:00.000Z", model:"gpt-5.6-terra", effort:"medium" }, content:{ topic:"ACID", slides } };
}
function write(value) { mkdirSync(value.run, { recursive:true }); writeFileSync(join(value.run, "request.json"), JSON.stringify(value.request)); writeFileSync(join(value.run, "carousel-content.json"), JSON.stringify(value.content)); }

test("accepts 7 and 10 slides and every semantic content type", () => { for (const count of [7, 10]) { const value = fixture(count); write(value); assert.equal(validateRun(value.run).slides.length, count); } });
test("accepts every semantic cardinality", () => { const value = fixture(), pair = () => ({ label:"Label", detail:"Detail" }); value.content.slides[0].content.text = "Statement."; value.content.slides[1].content.items = Array.from({ length:6 }, pair); value.content.slides[2].content.sides = Array.from({ length:2 }, () => ({ label:"Side", items:Array.from({ length:4 }, () => "Item") })); value.content.slides[3].content.steps = Array.from({ length:6 }, pair); Object.assign(value.content.slides[4].content, { setup:"Setup.", code:"SELECT 1;", explanation:"Explains." }); value.content.slides[5].content.items = Array.from({ length:6 }, pair); write(value); assert.equal(validateRun(value.run).slides.length, 7); });
test("rejects legacy variants and exact-shape, cardinality, text, and role violations", () => {
  const changes = [
    value => { value.content.slides[0].variant = "hero"; }, value => { value.content.slides[1].content.items.pop(); }, value => { value.content.slides[2].content.sides.push({ label:"Other", items:["x"] }); },
    value => { value.content.slides[1].content.items = Array.from({ length:7 }, () => ({ label:"x", detail:"x" })); }, value => { value.content.slides[2].content.sides[0].items = []; }, value => { value.content.slides[2].content.sides[0].items = Array(5).fill("x"); }, value => { value.content.slides[3].content.steps = [value.content.slides[3].content.steps[0]]; }, value => { value.content.slides[5].content.items = Array(7).fill(value.content.slides[5].content.items[0]); },
    value => { value.content.slides[3].content.steps[0].detail = " "; }, value => { value.content.slides[4].content.setup = "<b>x</b>"; }, value => { value.content.slides[5].content.items[0].extra = true; }, value => { value.content.slides[2].role = "decision"; }, value => { value.content.slides[0].content.type = "unknown"; },
  ];
  for (const change of changes) { const value = fixture(); change(value); write(value); assert.throws(() => validateRun(value.run)); assert.equal(existsSync(join(value.run, "carousel-content.json")), false); }
});
test("removes only an invalid selected candidate", () => { const value = fixture(); write(value); writeFileSync(join(value.run, "carousel-content.candidate.json"), "not json"); assert.throws(() => validateRun(value.run, { file:"carousel-content.candidate.json" })); assert.equal(validateRun(value.run).topic, "ACID"); });
test("creates a request after normalizing the topic", () => { const root = mkdtempSync(join(tmpdir(), "apollo-")), run = createRun("  ACID  ", { root, runId:"run-1", createdAt:"2026-07-16T00:00:00.000Z" }); assert.equal(existsSync(join(run, "request.json")), true); assert.throws(() => createRun(" ", { root, runId:"run-2" })); });
test("writer and reviewer contracts use semantic content instead of visual variants", () => { const writer = readFileSync(join(process.cwd(), ".codex/agents/carousel-writer.toml"), "utf8"), reviewer = readFileSync(join(process.cwd(), ".codex/agents/carousel-reviewer.toml"), "utf8"); for (const type of ["statement", "collection", "comparison", "sequence", "example", "checklist"]) assert.match(writer, new RegExp(`- ${type}:`)); assert.match(writer, /at least two distinct, nonredundant concrete supports/); assert.match(reviewer, /Emit a slide-specific finding for\s+every deficient slide/); assert.match(reviewer, /zero supports, one support, or only a rephrased core/); assert.match(reviewer, /existing-schema finding/); assert.match(reviewer, /never approve/); assert.match(reviewer, /semantic content\.type/); assert.doesNotMatch(writer, /Allowed variants|Variant fields|UNDERDEVELOPED_SLIDE/); assert.doesNotMatch(reviewer, /quote variants|levels variants|fact variants/); });

// --- quarantine / diagnostic tests ---

test("quarantines invalid canonical to rejected-content.json", () => {
  const value = fixture(); write(value);
  value.content.slides[0].title = "x".repeat(100);
  writeFileSync(join(value.run, "carousel-content.json"), JSON.stringify(value.content));
  assert.throws(() => validateRun(value.run));
  assert.equal(existsSync(join(value.run, "carousel-content.json")), false);
  assert.equal(existsSync(join(value.run, "rejected-content.json")), true);
  assert.equal(existsSync(join(value.run, "request.json")), true);
});

test("quarantines invalid candidate to rejected-content.json", () => {
  const value = fixture(); write(value);
  writeFileSync(join(value.run, "carousel-content.candidate.json"), "not json");
  assert.throws(() => validateRun(value.run, { file: "carousel-content.candidate.json" }));
  assert.equal(existsSync(join(value.run, "carousel-content.candidate.json")), false);
  assert.equal(existsSync(join(value.run, "rejected-content.json")), true);
  assert.equal(existsSync(join(value.run, "carousel-content.json")), true);
  assert.equal(validateRun(value.run).topic, "ACID");
});

test("rejected-content.json is not selectable", () => {
  const value = fixture(); write(value);
  value.content.slides[0].title = "x".repeat(100);
  writeFileSync(join(value.run, "carousel-content.json"), JSON.stringify(value.content));
  assert.throws(() => validateRun(value.run));
  assert.throws(() => validateRun(value.run, { file: "rejected-content.json" }));
});

test("preserves prior valid content after candidate rejection", () => {
  const value = fixture(); write(value);
  writeFileSync(join(value.run, "carousel-content.candidate.json"), "not json");
  assert.throws(() => validateRun(value.run, { file: "carousel-content.candidate.json" }));
  assert.equal(existsSync(join(value.run, "carousel-content.candidate.json")), false);
  const result = validateRun(value.run);
  assert.equal(result.topic, "ACID");
  assert.equal(result.slides.length, 7);
});

test("replacing prior rejected-content.json is intentional", () => {
  const value = fixture(); write(value);
  writeFileSync(join(value.run, "rejected-content.json"), "old reject");
  value.content.slides[0].title = "x".repeat(100);
  writeFileSync(join(value.run, "carousel-content.json"), JSON.stringify(value.content));
  assert.throws(() => validateRun(value.run));
  assert.equal(existsSync(join(value.run, "rejected-content.json")), true);
});

test("diagnostics include field path and rule, exclude raw field values", () => {
  const value = fixture(); write(value);
  value.content.slides[0].glossary[0] = "not-an-object";
  writeFileSync(join(value.run, "carousel-content.json"), JSON.stringify(value.content));
  try { validateRun(value.run); assert.fail("expected throw"); } catch (e) {
    assert.match(e.message, /glossary\[0\]/);
    assert.doesNotMatch(e.message, /not-an-object/);
  }
});

test("diagnostics report actual length and permitted bound", () => {
  const value = fixture(); write(value);
  value.content.slides[0].title = "x".repeat(100);
  writeFileSync(join(value.run, "carousel-content.json"), JSON.stringify(value.content));
  try { validateRun(value.run); assert.fail("expected throw"); } catch (e) {
    assert.match(e.message, /length 100 exceeds limit 56/);
    assert.match(e.message, /Slide 1 title/);
  }
});

test("diagnostics report actual type on type violations", () => {
  const value = fixture(); write(value);
  value.content.slides[0].title = 42;
  writeFileSync(join(value.run, "carousel-content.json"), JSON.stringify(value.content));
  try { validateRun(value.run); assert.fail("expected throw"); } catch (e) {
    assert.match(e.message, /expected string, received number/);
    assert.match(e.message, /Slide 1 title/);
  }
});
