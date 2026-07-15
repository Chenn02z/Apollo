import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

export function createRun(topic, { root = process.cwd(), runId = randomUUID(), createdAt = new Date().toISOString() } = {}) {
  const normalizedTopic = typeof topic === "string" ? topic.trim() : "";
  if (!normalizedTopic) throw new Error("Topic is required.");
  const runsPath = join(resolve(root), "runs");
  const runPath = join(runsPath, runId);
  mkdirSync(runsPath, { recursive: true });
  mkdirSync(runPath, { recursive: false });
  writeFileSync(join(runPath, "request.json"), JSON.stringify({ contractVersion: "1", topic: normalizedTopic, runId, createdAt, model: "gpt-5.6-terra", effort: "medium" }));
  return runPath;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { console.log(createRun(process.argv[2])); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
