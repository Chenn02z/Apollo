import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { exportRun, scanHtml } from "../scripts/export-carousel.mjs";
import { populateHtml, populateRun } from "../scripts/populate-carousel.mjs";
import { prepareLayout, snapshotBoundary, validateLayout, validateLayoutStage } from "../scripts/validate-carousel-layout.mjs";

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
function run(count = 7) { const root = mkdtempSync(join(tmpdir(), "apollo-render-")), path = join(root, "runs", "run-1"), roles = ["hook", "overview", ...Array.from({ length: count - 3 }, (_, i) => ["concept", "example", "deep-dive", "interview"][i % 4]), "takeaway"]; mkdirSync(path, { recursive: true }); const content = { topic: "ACID", slides: roles.map((role, i) => slide(i + 1, role)) }; writeFileSync(join(path, "request.json"), JSON.stringify({ topic: "ACID", runId: "run-1", createdAt: "2026-07-16T00:00:00.000Z", model: "gpt-5.6-terra", effort: "medium" })); writeFileSync(join(path, "carousel-content.json"), JSON.stringify(content)); writeFileSync(join(path, "index.html"), populateHtml(content)); return path; }
function layout(count = 7) { return { template: "database-blueprint", motif: "blueprint", slides: Array.from({ length: count }, (_, index) => ({ number: index + 1, composition: "focus", density: "standard", visualAnchor: "headline", direction: "centered", directionNote: `Make slide ${index + 1} the visual focus.` })) }; }

test("exports seven and ten content-derived PNG sets and closed manifests", async () => { for (const count of [7, 10]) { const path = run(count); await exportRun(path, { chromium: fakeChromium({ count }) }); const manifest = JSON.parse(readFileSync(join(path, "render-manifest.json"))); assert.deepEqual(manifest.slides, Array.from({ length: count }, (_, i) => `slides/slide-${String(i + 1).padStart(2, "0")}.png`)); } });
test("rejects forbidden HTML, routes, and precise overflow", async () => { assert.throws(() => scanHtml(html(7).replace('class="slide-content">slide', 'class="x">slide'), 7)); const path = run(); await assert.rejects(exportRun(path, { chromium: fakeChromium({ route: true }) })); assert.equal(existsSync(join(path, "render-manifest.json")), false); const overflowPath = run(); await assert.rejects(exportRun(overflowPath, { chromium: fakeChromium({ overflow: ["slide 2: descendant height overflowed"] }) }), /slide 2: descendant height overflowed/); });
test("rejects markup that drifts from the fixed shell", async () => { const path = run(); writeFileSync(join(path, "index.html"), readFileSync(join(path, "index.html"), "utf8").replace('class="tag"', 'class="tag changed"')); await assert.rejects(exportRun(path, { chromium: fakeChromium() }), /Template fidelity/); });
test("rejects escaped CSS bypasses", () => { for (const css of ["a{background:u\\72l(x)}", "@\\69mport 'x'", "a{ov\\65rflow:\\68idden}"]) assert.throws(() => scanHtml(html(7).replace("</style>", `${css}</style>`), 7)); });
test("keeps a structurally valid prior manifest regardless of key order", async () => {
  const path = run(); await exportRun(path, { chromium: fakeChromium() }); const manifest = JSON.parse(readFileSync(join(path, "render-manifest.json"))); writeFileSync(join(path, "render-manifest.json"), JSON.stringify({ slides: manifest.slides, height: 1350, width: 1080, runId: "run-1", slideCount: 7 })); const before = readFileSync(join(path, "render-manifest.json"), "utf8"); await assert.rejects(exportRun(path, { chromium: fakeChromium({ screenshot: true }) })); assert.equal(readFileSync(join(path, "render-manifest.json"), "utf8"), before);
});
test("removes invalid prior manifests before static failure and never follows slide directory symlinks", async () => {
  const path = run(); writeFileSync(join(path, "render-manifest.json"), "{}"); writeFileSync(join(path, "index.html"), "<script></script>"); await assert.rejects(exportRun(path, { chromium: fakeChromium() })); assert.equal(existsSync(join(path, "render-manifest.json")), false);
  const linked = run(), outside = join(dirname(linked), "outside"); mkdirSync(outside); writeFileSync(join(outside, "slide-01.png"), "outside"); mkdirSync(join(linked, "slides")); rmSync(join(linked, "slides"), { recursive: true }); symlinkSync(outside, join(linked, "slides")); writeFileSync(join(linked, "render-manifest.json"), JSON.stringify({ runId: "run-1", width: 1080, height: 1350, slideCount: 7, slides: Array.from({ length: 7 }, (_, i) => `slides/slide-${String(i + 1).padStart(2, "0")}.png`) })); writeFileSync(join(linked, "index.html"), "<script></script>"); await assert.rejects(exportRun(linked, { chromium: fakeChromium() })); assert.equal(readFileSync(join(outside, "slide-01.png"), "utf8"), "outside"); assert.equal(existsSync(join(linked, "render-manifest.json")), false);
});
test("rich closed variants export through real Chromium", async t => {
  const { chromium } = await import("playwright"); if (!existsSync(chromium.executablePath())) return t.skip("Run npx playwright install chromium for this local integration check.");
  const path = run();
  try { await exportRun(path, { chromium }); }
  catch (error) { if (/browserType\.launch/.test(error.message)) return t.skip("Chromium cannot launch in this sandbox."); throw error; }
  assert.equal(JSON.parse(readFileSync(join(path, "render-manifest.json"))).slideCount, 7);
});
test("validates closed plans independent of JSON key order and rejects every plan category", () => {
  const path = run(), content = JSON.parse(readFileSync(join(path, "carousel-content.json")));
  writeFileSync(join(path, "carousel-layout.json"), JSON.stringify({ slides: layout().slides, motif: "blueprint", template: "database-blueprint" }));
  assert.equal(validateLayout(path, content).slides.length, 7);
  for (const [mutate, code] of [
    [value => { value.extra = true; }, "LAYOUT_ROOT_SHAPE"], [value => { value.motif = "other"; }, "LAYOUT_TEMPLATE_OR_MOTIF"],
    [value => { value.slides.pop(); }, "LAYOUT_SLIDE_COUNT"], [value => { value.slides[0].extra = true; }, "LAYOUT_SLIDE_SHAPE"],
    [value => { value.slides[0].number = "1"; }, "LAYOUT_SLIDE_TYPE"], [value => { value.slides[1].number = 1; }, "LAYOUT_SLIDE_IDENTITY"],
    [value => { value.slides[0].composition = "unknown"; }, "LAYOUT_CAPABILITY"], [value => { value.slides[0].directionNote = " "; }, "LAYOUT_NOTE"], [value => { value.slides[0].directionNote = "x".repeat(281); }, "LAYOUT_NOTE"],
  ]) { const value = layout(); mutate(value); writeFileSync(join(path, "carousel-layout.json"), JSON.stringify(value)); assert.throws(() => validateLayout(path, content), new RegExp(code)); }
});
test("art direction gates population and export and protects the full boundary", async () => {
  const path = run();
  prepareLayout(path); const snapshot = snapshotBoundary(path); writeFileSync(join(path, "carousel-layout.json"), JSON.stringify(layout())); validateLayoutStage(path, snapshot); populateRun(path); await exportRun(path, { chromium: fakeChromium() });
  assert.equal(JSON.parse(readFileSync(join(path, "render-manifest.json"))).slideCount, 7);
  for (const mutate of [
    path => writeFileSync(join(path, "carousel-content.initial.json"), "changed"), path => writeFileSync(join(path, "carousel-review-1.json"), "changed"),
    path => writeFileSync(join(path, "index.html"), "stale renderer artifact"), path => writeFileSync(join(path, "render-manifest.json"), "stale renderer artifact"),
    path => writeFileSync(join(path, "unexpected.txt"), "added"), path => rmSync(join(path, "request.json")),
  ]) {
    const protectedPath = run(); writeFileSync(join(protectedPath, "carousel-content.initial.json"), "history"); writeFileSync(join(protectedPath, "carousel-review-1.json"), "history"); writeFileSync(join(protectedPath, "render-manifest.json"), "prior manifest");
    prepareLayout(protectedPath); const boundary = snapshotBoundary(protectedPath); mutate(protectedPath); writeFileSync(join(protectedPath, "carousel-layout.json"), JSON.stringify(layout()));
    assert.throws(() => validateLayoutStage(protectedPath, boundary), /LAYOUT_PROTECTED_MUTATION/);
  }
  for (const archivePath of [join(process.cwd(), "templates/database-blueprint/template.json"), join(process.cwd(), "assets/database/theme.css"), join(process.cwd(), "assets/database/carousel-shell.html")]) {
    const original = readFileSync(archivePath, "utf8"), protectedPath = run();
    try { prepareLayout(protectedPath); const boundary = snapshotBoundary(protectedPath); writeFileSync(archivePath, `${original}\n`); writeFileSync(join(protectedPath, "carousel-layout.json"), JSON.stringify(layout())); assert.throws(() => validateLayoutStage(protectedPath, boundary), /LAYOUT_PROTECTED_MUTATION/); }
    finally { writeFileSync(archivePath, original); }
  }
});
test("missing or invalid direction output preserves prior renderer artifacts", () => {
  for (const output of [null, {}]) {
    const path = run(); writeFileSync(join(path, "render-manifest.json"), "prior manifest"); const index = readFileSync(join(path, "index.html"), "utf8");
    prepareLayout(path); const boundary = snapshotBoundary(path); if (output) writeFileSync(join(path, "carousel-layout.json"), JSON.stringify(output));
    assert.throws(() => validateLayoutStage(path, boundary));
    assert.equal(readFileSync(join(path, "index.html"), "utf8"), index); assert.equal(readFileSync(join(path, "render-manifest.json"), "utf8"), "prior manifest");
  }
});
test("layout preparation rejects invalid runs before removing stale output", () => {
  const path = mkdtempSync(join(tmpdir(), "apollo-invalid-")); writeFileSync(join(path, "carousel-layout.json"), "stale");
  assert.throws(() => prepareLayout(path), /LAYOUT_RUN_OR_ARCHIVE/);
  assert.equal(readFileSync(join(path, "carousel-layout.json"), "utf8"), "stale");
});
test("stale layout symlinks stop before direction", async () => {
  const path = run(), target = join(dirname(path), "layout.json"); writeFileSync(target, "{}"); symlinkSync(target, join(path, "carousel-layout.json"));
  assert.throws(() => prepareLayout(path), /LAYOUT_STALE_SYMLINK/);
});
test("layout CLI persists an external snapshot for the final boundary check", () => {
  const path = run(), snapshot = join(dirname(dirname(dirname(path))), "snapshot.json"), script = join(process.cwd(), "scripts", "validate-carousel-layout.mjs");
  assert.equal(spawnSync(process.execPath, [script, path, "--prepare", "--snapshot-file", snapshot]).status, 0);
  writeFileSync(join(path, "carousel-layout.json"), JSON.stringify(layout()));
  const result = spawnSync(process.execPath, [script, path, "--snapshot-file", snapshot], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(snapshot), true);
  assert.notEqual(spawnSync(process.execPath, [script, path, "--prepare", "--snapshot-file", join(path, "snapshot.json")]).status, 0);
});
