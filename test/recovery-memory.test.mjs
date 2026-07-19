import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { logRecovery, recoveryDecision, recoveryEvent } from "../scripts/recovery-memory.mjs";

test("records a sanitized recoverable failure in run and workspace history", () => {
  const root = mkdtempSync(join(tmpdir(), "apollo-recovery-")), run = join(root, "runs", "run-1"); mkdirSync(run, { recursive:true });
  const event = logRecovery({ run, stage:"composition", diagnostic:"FRAGMENT_STYLE /Users/a/secret https://example.test\nboom", cycle:1, historyPath:join(root, "recovery-history.jsonl") });
  assert.deepEqual(Object.keys(event), ["at", "runId", "stage", "code", "signature", "diagnostic", "cycle", "outcome"]);
  assert.equal(event.signature, "composition:FRAGMENT_STYLE"); assert.equal(event.cycle, 1);
  const line = JSON.parse(readFileSync(join(run, "recovery-log.jsonl"), "utf8")); assert.equal(line.diagnostic.includes("https://"), false); assert.equal(line.diagnostic.includes("\n"), false);
});

test("marks terminal and exhausted records without a run artifact", () => {
  const terminal = recoveryEvent({ stage:"export", diagnostic:"RENDER_EXPORT: browser unavailable", outcome:"terminal" });
  const exhausted = recoveryEvent({ stage:"composition", diagnostic:"BODY_UNDERFILL", cycle:2, outcome:"exhausted" });
  assert.equal(terminal.runId, null); assert.equal(terminal.code, "RENDER_EXPORT"); assert.equal(exhausted.signature, "composition:BODY_UNDERFILL"); assert.equal(exhausted.outcome, "exhausted");
});

test("records post-run archive stops durably", () => {
  const root = mkdtempSync(join(tmpdir(), "apollo-recovery-")), run = join(root, "runs", "run-archive"); mkdirSync(run, { recursive:true });
  logRecovery({ run, stage:"generate-archive", diagnostic:"Archive exists", outcome:"terminal", historyPath:join(root, "recovery-history.jsonl") });
  const record = JSON.parse(readFileSync(join(run, "recovery-log.jsonl"), "utf8"));
  assert.equal(record.stage, "generate-archive"); assert.equal(record.outcome, "terminal");
});

test("caps recovery cumulatively across render stages and stops repeated or terminal failures", () => {
  const first = recoveryDecision({ stage:"render-composition", diagnostic:"FRAGMENT_STYLE x" }); assert.equal(first.action, "recover");
  assert.equal(recoveryDecision({ stage:"render-composition", diagnostic:"FRAGMENT_STYLE x", previousSignature:first.signature }).action, "repeated");
  assert.equal(recoveryDecision({ stage:"render-layout", diagnostic:"LAYOUT_NOTE x", recoveryCycles:1 }).action, "recover");
  assert.equal(recoveryDecision({ stage:"render-composition", diagnostic:"BODY_UNDERFILL x", recoveryCycles:1, previousSignature:first.signature }).action, "recover");
  assert.equal(recoveryDecision({ stage:"render-composition", diagnostic:"BODY_UNDERFILL x", recoveryCycles:2 }).action, "exhausted");
  assert.equal(recoveryDecision({ stage:"render-layout", diagnostic:"LAYOUT_PROTECTED_MUTATION x" }).action, "terminal");
  assert.equal(recoveryDecision({ stage:"render-export", diagnostic:"RENDER_EXPORT x" }).action, "terminal");
});

test("allows a candidate-content recovery from its validated checkpoint", () => {
  const first = recoveryDecision({ stage:"generate-candidate", diagnostic:"Invalid slide count" });
  const second = recoveryDecision({ stage:"generate-candidate", diagnostic:"Invalid title", recoveryCycles:1, previousSignature:first.signature });
  assert.equal(first.action, "recover"); assert.equal(second.action, "recover");
});
