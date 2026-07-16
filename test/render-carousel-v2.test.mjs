import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { exportRunV2, scanHtmlV2 } from "../scripts/export-carousel-v2.mjs";
import { populateHtmlV2 } from "../scripts/populate-carousel-v2.mjs";

const png = Buffer.from("89504e470d0a1a0a0000000d4948445200000438000005460806000000000000", "hex");
const html = count => `<style>body{margin:0}.carousel-slide{width:1080px;height:1350px}.slide-content{padding:1px}</style><main id="carousel">${Array.from({ length: count }, (_, i) => `<section class="carousel-slide" data-slide="${i + 1}"><div class="slide-content">slide</div></section>`).join("")}</main>`;
function fakeChromium({ count = 7, route = false, overflow = [], screenshot = false } = {}) {
  return { launch: async () => ({
    newPage: async () => ({
      route: async (_pattern, handler) => { if (route) await handler({ abort: async () => {} }); }, setContent: async () => {},
      evaluate: async () => ({ roots: count, slides: Array.from({ length: count }, (_, i) => String(i + 1)), violations: overflow }),
      locator: () => ({ evaluate: async () => ({ width: 1080, height: 1350 }), screenshot: async ({ path }) => { if (screenshot) throw Error("shot"); writeFileSync(path, png); } }),
    }), close: async () => {},
  }) };
}
const variants = ["hero", "fact", "list", "quote", "comparison", "levels", "list"];
function slide(number, role, variant = variants[(number - 1) % variants.length]) { const common = { number, role, variant, title: `Slide ${number}`, why: "This explains a concrete database decision.", glossary: [{ term: "Transaction", definition: "A unit of database work." }] }; if (variant === "hero") return { ...common, prompt: "Start with the failure mode." }; if (variant === "fact") return { ...common, factValue: "1 unit", factLabel: "One visible database result." }; if (variant === "list") return { ...common, items: [{ label: "Atomicity", detail: "First concrete mechanism." }, { label: "Consistency", detail: "Second concrete mechanism." }] }; if (variant === "quote") return { ...common, quote: "A safe system never exposes a half-finished result.", attribution: "Database practice" }; if (variant === "comparison") return { ...common, comparison: { left: { label: "Lower", summary: "More concurrency.", items: ["Fewer checks", "More risk"] }, right: { label: "Higher", summary: "More protection.", items: ["More checks", "Less risk"] } } }; return { ...common, levels: [{ label: "Basic", value: 25, description: "Minimal protection." }, { label: "Strong", value: 75, description: "More coordination." }] }; }
function run(count = 7) { const root = mkdtempSync(join(tmpdir(), "apollo-render-v2-")), path = join(root, "runs", "run-1"), roles = ["hook", "overview", ...Array.from({ length: count - 3 }, (_, i) => ["concept", "example", "deep-dive", "interview"][i % 4]), "takeaway"]; mkdirSync(path, { recursive: true }); const content = { version: "2", topic: "ACID", slides: roles.map((role, i) => slide(i + 1, role)) }; writeFileSync(join(path, "request-v2.json"), JSON.stringify({ contractVersion: "2", topic: "ACID", runId: "run-1", createdAt: "2026-07-16T00:00:00.000Z", model: "gpt-5.6-terra", effort: "medium" })); writeFileSync(join(path, "carousel-content-v2.json"), JSON.stringify(content)); writeFileSync(join(path, "index-v2.html"), populateHtmlV2(content)); return path; }

test("exports seven and ten content-derived PNG sets and closed v2 manifests", async () => { for (const count of [7, 10]) { const path = run(count); await exportRunV2(path, { chromium: fakeChromium({ count }) }); const manifest = JSON.parse(readFileSync(join(path, "render-manifest-v2.json"))); assert.deepEqual(manifest.slides, Array.from({ length: count }, (_, i) => `slides-v2/slide-${String(i + 1).padStart(2, "0")}.png`)); } });
test("rejects forbidden HTML, routes, and precise overflow", async () => { assert.throws(() => scanHtmlV2(html(7).replace('class="slide-content">slide', 'class="x">slide'), 7)); const path = run(); await assert.rejects(exportRunV2(path, { chromium: fakeChromium({ route: true }) })); assert.equal(existsSync(join(path, "render-manifest-v2.json")), false); const overflowPath = run(); await assert.rejects(exportRunV2(overflowPath, { chromium: fakeChromium({ overflow: ["slide 2: descendant height overflowed"] }) }), /slide 2: descendant height overflowed/); });
test("rejects markup that drifts from the fixed shell", async () => { const path = run(); writeFileSync(join(path, "index-v2.html"), readFileSync(join(path, "index-v2.html"), "utf8").replace('class="tag"', 'class="tag changed"')); await assert.rejects(exportRunV2(path, { chromium: fakeChromium() }), /Template fidelity/); });
test("rejects escaped CSS bypasses", () => { for (const css of ["a{background:u\\72l(x)}", "@\\69mport 'x'", "a{ov\\65rflow:\\68idden}"]) assert.throws(() => scanHtmlV2(html(7).replace("</style>", `${css}</style>`), 7)); });
test("keeps a structurally valid prior manifest regardless of key order", async () => {
  const path = run(); await exportRunV2(path, { chromium: fakeChromium() }); const manifest = JSON.parse(readFileSync(join(path, "render-manifest-v2.json"))); writeFileSync(join(path, "render-manifest-v2.json"), JSON.stringify({ slides: manifest.slides, height: 1350, version: "2", width: 1080, runId: "run-1", sourceContentVersion: "2", slideCount: 7 })); const before = readFileSync(join(path, "render-manifest-v2.json"), "utf8"); await assert.rejects(exportRunV2(path, { chromium: fakeChromium({ screenshot: true }) })); assert.equal(readFileSync(join(path, "render-manifest-v2.json"), "utf8"), before);
});
test("removes invalid prior manifests before static failure and never follows slide directory symlinks", async () => {
  const path = run(); writeFileSync(join(path, "render-manifest-v2.json"), "{}"); writeFileSync(join(path, "index-v2.html"), "<script></script>"); await assert.rejects(exportRunV2(path, { chromium: fakeChromium() })); assert.equal(existsSync(join(path, "render-manifest-v2.json")), false);
  const linked = run(), outside = join(dirname(linked), "outside"); mkdirSync(outside); writeFileSync(join(outside, "slide-01.png"), "outside"); mkdirSync(join(linked, "slides-v2")); rmSync(join(linked, "slides-v2"), { recursive: true }); symlinkSync(outside, join(linked, "slides-v2")); writeFileSync(join(linked, "render-manifest-v2.json"), JSON.stringify({ version: "2", runId: "run-1", sourceContentVersion: "2", width: 1080, height: 1350, slideCount: 7, slides: Array.from({ length: 7 }, (_, i) => `slides-v2/slide-${String(i + 1).padStart(2, "0")}.png`) })); writeFileSync(join(linked, "index-v2.html"), "<script></script>"); await assert.rejects(exportRunV2(linked, { chromium: fakeChromium() })); assert.equal(readFileSync(join(outside, "slide-01.png"), "utf8"), "outside"); assert.equal(existsSync(join(linked, "render-manifest-v2.json")), false);
});
test("rich closed variants export through real Chromium", async t => {
  const { chromium } = await import("playwright"); if (!existsSync(chromium.executablePath())) return t.skip("Run npx playwright install chromium for this local integration check.");
  const path = run();
  try { await exportRunV2(path, { chromium }); }
  catch (error) { if (/browserType\.launch/.test(error.message)) return t.skip("Chromium cannot launch in this sandbox."); throw error; }
  assert.equal(JSON.parse(readFileSync(join(path, "render-manifest-v2.json"))).slideCount, 7);
});
