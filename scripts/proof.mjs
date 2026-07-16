import { appendFileSync, lstatSync, readFileSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyExport } from "./export-carousel.mjs";

export const PROOF_TOPICS = ["ACID properties", "indexes", "caching", "REST vs GraphQL", "embeddings"];
const fail = message => { throw new Error(message); };
const directory = path => { const stat = lstatSync(path); return stat.isDirectory() && !stat.isSymbolicLink(); };
const logPath = root => join(dirname(root), "proof-log.jsonl");

export function preflightProof(root = join(process.cwd(), "runs")) {
  const runs = resolve(root);
  if (!directory(runs)) fail("Proof preflight requires an existing real runs directory");
  if (readdirSync(runs).length) fail("Proof preflight requires an empty runs directory; nothing was deleted");
  return runs;
}

function safeAttempt(root, run) {
  if (!directory(root)) fail("Proof cleanup requires a real runs directory");
  const runs = realpathSync(root), attempt = resolve(run);
  if (dirname(attempt) !== runs || !directory(attempt) || lstatSync(attempt).isSymbolicLink()) fail("Proof cleanup requires a direct real runs child");
  return attempt;
}

function append(root, entry) { appendFileSync(logPath(root), `${JSON.stringify(entry)}\n`); }

const attemptedTopic = run => { try { return JSON.parse(readFileSync(join(run, "request.json"), "utf8")).topic ?? null; } catch { return null; } };
export async function recordProofAttempt(runDirectory, { root = join(process.cwd(), "runs"), startedAt = new Date().toISOString(), chromium } = {}) {
  const runs = resolve(root), run = safeAttempt(runs, runDirectory), entry = { topic: null, runDirectory: basename(run), startedAt, finishedAt: new Date().toISOString(), result: "failure", diagnostic: null, manifestPath: null, cleanup: "not-needed" };
  entry.topic = attemptedTopic(run);
  try {
    const content = await verifyExport(run, { chromium }), topic = content.topic, prior = readdirSync(runs).filter(name => directory(join(runs, name))).length - 1;
    if (topic !== PROOF_TOPICS[prior]) fail(`Expected proof topic ${JSON.stringify(PROOF_TOPICS[prior])}; received ${JSON.stringify(topic)}`);
    const manifest = join(run, "render-manifest.json");
    if (!lstatSync(manifest).isFile() || lstatSync(manifest).isSymbolicLink()) fail("Missing manifest");
    entry.topic = topic; entry.result = "success"; entry.manifestPath = manifest; append(runs, entry); return entry;
  } catch (error) {
    entry.diagnostic = error.message;
    try { rmSync(run, { recursive: true }); entry.cleanup = "removed exact run directory"; }
    catch (cleanupError) { entry.cleanup = `failed: ${cleanupError.message}`; }
    append(runs, entry); throw error;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (["--help", "-h"].includes(process.argv[2])) console.log("Usage: proof.mjs preflight [runs-root] | proof.mjs <run-directory> [runs-root]");
  else try { console.log(process.argv[2] === "preflight" ? preflightProof(process.argv[3]) : JSON.stringify(await recordProofAttempt(process.argv[2] ?? "", { root: process.argv[3] }))); }
  catch (error) { console.error(`Proof failed: ${error.message}`); process.exitCode = 1; }
}
