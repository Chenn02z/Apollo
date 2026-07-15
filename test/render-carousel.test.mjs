import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { exportRun, pngSize, scanHtml } from "../scripts/export-carousel.mjs";

const html = `<style>body{margin:0}.carousel-slide{width:1080px;height:1350px}</style><main id="carousel">${Array.from({ length: 7 }, (_, i) => `<section class="carousel-slide" data-slide="${i + 1}">slide</section>`).join("")}</main>`;
const png = Buffer.from("89504e470d0a1a0a0000000d4948445200000438000005460806000000000000", "hex");
function fakeChromium({ route = false, screenshot = false } = {}) { return { launch: async () => ({ newPage: async () => ({ route: async (_p, handler) => { if (route) await handler({ abort: async () => {} }); }, setContent: async () => {}, evaluate: async () => ({ roots: 7, slides: ["1", "2", "3", "4", "5", "6", "7"] }), locator: () => ({ evaluate: async () => ({ width: 1080, height: 1350 }), screenshot: async ({ path }) => { if (screenshot) throw Error("shot"); writeFileSync(path, png); } }) }), close: async () => {} }) }; }
function run() { const root = mkdtempSync(join(tmpdir(), "apollo-render-")); const path = join(root, "runs", "run-1"); mkdirSync(path, { recursive: true }); writeFileSync(join(path, "index.html"), html); return path; }

test("exports seven PNGs and the closed manifest", async () => { const path = run(); await exportRun(path, { chromium: fakeChromium() }); const manifest = JSON.parse(readFileSync(join(path, "render-manifest.json"))); assert.equal(manifest.runId, "run-1"); assert.deepEqual(manifest.slides, Array.from({ length: 7 }, (_, i) => `slides/slide-${String(i + 1).padStart(2, "0")}.png`)); });
test("rejects prohibited HTML before launch", async () => { const path = run(); writeFileSync(join(path, "index.html"), html.replace("<style>", "<script></script><style>")); await assert.rejects(exportRun(path, { chromium: fakeChromium() })); });
test("fails every routed subresource without publishing", async () => { const path = run(); await assert.rejects(exportRun(path, { chromium: fakeChromium({ route: true }) })); assert.throws(() => readFileSync(join(path, "render-manifest.json"))); });
test("keeps a prior complete set on screenshot failure", async () => { const path = run(); await exportRun(path, { chromium: fakeChromium() }); const old = readFileSync(join(path, "render-manifest.json"), "utf8"); await assert.rejects(exportRun(path, { chromium: fakeChromium({ screenshot: true }) })); assert.equal(readFileSync(join(path, "render-manifest.json"), "utf8"), old); });
test("static contract requires one carousel, direct roots, and safe URLs", () => { assert.throws(() => scanHtml(html.replace('data-slide="7"', 'data-slide="8"'))); assert.throws(() => scanHtml(html.replace("</style>", "a{background:url(x)}</style>"))); assert.throws(() => scanHtml(html.replace("</style>", "@\\69mport 'x';</style>"))); assert.throws(() => scanHtml(html.replace('<section class="carousel-slide" data-slide="1">', '<div><section class="carousel-slide" data-slide="1">').replace("</section>", "</section></div>"))); assert.throws(() => scanHtml(html.replace("</main>", '<main id="carousel"></main></main>'))); assert.throws(() => scanHtml(html.replace("<main", '<svg><use xlink:href="https://x"></use></svg><main'))); });
test("allows prose backslashes outside CSS but rejects escaped CSS URLs", () => { assert.doesNotThrow(() => scanHtml(html.replace("slide</section>", "C:\\work</section>"))); assert.throws(() => scanHtml(html.replace("body{", "\\75\\72\\6c("))); });
test("render skill and agent retain the one-delegation boundary", () => {
  const skill = readFileSync(".agents/skills/apollo/apollo-render/SKILL.md", "utf8");
  const agent = readFileSync(".codex/agents/carousel-renderer.toml", "utf8");
  assert.equal((skill.match(/delegate exactly once/gi) ?? []).length, 1);
  assert.match(skill, /validate-carousel-content\.mjs/); assert.match(skill, /do not delegate, export, or create a manifest/i);
  assert.match(agent, /Write exactly one file:[\s\S]*index\.html/); assert.match(agent, /Do not emit meta, script, link/); assert.match(agent, /workspace-write sandboxing; it cannot express a[\s\S]*filesystem allowlist/);
});
test("exports real Chromium DOM roots, dimensions, routes, and PNGs when installed", async t => {
  const { chromium } = await import("playwright");
  if (!existsSync(chromium.executablePath())) return t.skip("Run npx playwright install chromium for this local integration check.");
  const path = run();
  try { await exportRun(path, { chromium }); }
  catch (error) { if (/browserType\.launch/.test(error.message)) return t.skip("Chromium cannot launch in this sandbox."); throw error; }
  assert.deepEqual(pngSize(join(path, "slides", "slide-01.png")), { width: 1080, height: 1350 });
  assert.equal(JSON.parse(readFileSync(join(path, "render-manifest.json"))).slideCount, 7);
});
