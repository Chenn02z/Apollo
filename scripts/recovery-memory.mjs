import { appendFileSync, lstatSync, mkdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspace = resolve(fileURLToPath(new URL("..", import.meta.url)));
const text = value => String(value ?? "").replace(/[\0-\x1f\x7f]/g, " ").replace(/https?:\/\/\S+/g, "<url>").replace(/\/Users\/[^\s:]+/g, "<path>").replace(/\s+/g, " ").trim().slice(0, 1000);
const codeFor = diagnostic => text(diagnostic).match(/\b[A-Z][A-Z0-9_]{2,}\b/)?.[0]
  ?? (text(diagnostic).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 80) || "UNKNOWN");
const recoverable = (stage, code) => stage === "generate-candidate"
  || stage === "render-layout" && code.startsWith("LAYOUT_") && !code.includes("PROTECTED")
  || stage === "render-composition" && (code.startsWith("FRAGMENT_") || code.startsWith("BODY_"));
const safeRun = run => {
  if (!run) return null;
  const path = resolve(run);
  try { return basename(dirname(path)) === "runs" && lstatSync(path).isDirectory() && !lstatSync(path).isSymbolicLink() ? path : null; } catch { return null; }
};

export function recoveryEvent({ run, stage, diagnostic, cycle = 0, outcome = "caught" }) {
  const safe = safeRun(run), clean = text(diagnostic), code = codeFor(clean);
  return { at:new Date().toISOString(), runId:safe ? basename(safe) : null, stage:text(stage).slice(0, 80) || "unknown", code, signature:`${text(stage).slice(0, 80) || "unknown"}:${code}`, diagnostic:clean || "Unknown failure", cycle:Number.isInteger(cycle) && cycle >= 0 ? cycle : 0, outcome:text(outcome).slice(0, 80) || "caught" };
}

export function recoveryDecision({ stage, diagnostic, recoveryCycles = 0, previousSignature }) {
  const code = codeFor(diagnostic), signature = `${stage}:${code}`, allowed = recoverable(stage, code);
  if (!allowed) return { action:"terminal", signature };
  if (recoveryCycles >= 2) return { action:"exhausted", signature };
  if (previousSignature === signature) return { action:"repeated", signature };
  return { action:"recover", signature };
}

export function logRecovery(options) {
  const event = recoveryEvent(options), run = safeRun(options.run), line = `${JSON.stringify(event)}\n`;
  if (run) appendFileSync(join(run, "recovery-log.jsonl"), line);
  const history = options.historyPath ?? join(workspace, "recovery-history.jsonl");
  mkdirSync(dirname(history), { recursive:true }); appendFileSync(history, line);
  return event;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , command, run, stage, diagnostic, cycle, outcome] = process.argv;
  if (command !== "log" || !stage || !diagnostic) {
    console.error("Usage: recovery-memory.mjs log <run-or-empty> <stage> <diagnostic> [cycle] [outcome]");
    process.exitCode = 1;
  } else console.log(JSON.stringify(logRecovery({ run, stage, diagnostic, cycle:Number(cycle ?? 0), outcome })));
}
