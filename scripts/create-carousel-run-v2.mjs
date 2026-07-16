import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

export function createRunV2(topic, { root = process.cwd(), runId = randomUUID(), createdAt = new Date().toISOString() } = {}) {
  const normalizedTopic = typeof topic === "string" ? topic.trim() : "";
  if (!normalizedTopic) throw new Error("Topic is required.");
  const runPath = join(resolve(root), "runs", runId);
  mkdirSync(join(resolve(root), "runs"), { recursive: true });
  mkdirSync(runPath);
  writeFileSync(join(runPath, "request-v2.json"), JSON.stringify({ contractVersion: "2", topic: normalizedTopic, runId, createdAt, model: "gpt-5.6-terra", effort: "medium" }));
  return runPath;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { console.log(createRunV2(process.argv[2])); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
