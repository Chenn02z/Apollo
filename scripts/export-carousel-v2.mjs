import { cpSync, existsSync, lstatSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { pngSize } from "./export-carousel.mjs";
import { validateRunV2 } from "./validate-carousel-content-v2.mjs";

const fail = message => { throw new Error(message); };
const isFile = path => { try { return lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink(); } catch { return false; } };
const isDirectory = path => { try { return lstatSync(path).isDirectory() && !lstatSync(path).isSymbolicLink(); } catch { return false; } };
const paths = count => Array.from({ length: count }, (_, index) => `slides-v2/slide-${String(index + 1).padStart(2, "0")}.png`);
const manifestFor = (runId, count) => ({ version: "2", runId, sourceContentVersion: "2", width: 1080, height: 1350, slideCount: count, slides: paths(count) });
const exactly = (value, keys) => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));

export function scanHtmlV2(html, count) {
  const css = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]).join("\n").replace(/\\([0-9a-f]{1,6})\s?/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)));
  if (/<\/?(?:script|link|base|meta)\b/i.test(html) || /\s(?:src|href|xlink:href|style|on[a-z]+|action|formaction|poster|data|cite|background|longdesc|usemap)\s*=/i.test(html) || /@import\b|url\s*\(|(?:overflow|overflow-x|overflow-y)\s*:\s*(?:hidden|clip)\b/i.test(css)) fail("HTML contains a prohibited construct");
  const stack = []; const roots = []; let carousel = 0; let dataSlides = 0;
  for (const match of html.matchAll(/<\/?[A-Za-z][^>]*>/g)) {
    const tag = match[0]; if (tag.startsWith("</")) { stack.pop(); continue; }
    const name = tag.match(/^<\s*([A-Za-z]+)/)?.[1]?.toLowerCase(); const data = tag.match(/\bdata-slide\s*=\s*(['"])(.*?)\1/i)?.[2]; if (data !== undefined) dataSlides++;
    const parent = stack.at(-1); const hereCarousel = /\bid\s*=\s*(['"])carousel\1/i.test(tag); if (hereCarousel) carousel++;
    const root = parent?.carousel && name === "section" && /\bclass\s*=\s*(['"])[^'"]*\bcarousel-slide\b[^'"]*\1/i.test(tag) && data !== undefined;
    const node = { carousel: hereCarousel || parent?.carousel === true, content: /\bclass\s*=\s*(['"])[^'"]*\bslide-content\b[^'"]*\1/i.test(tag), children: [], data };
    if (parent) parent.children.push(node); if (root) roots.push(node);
    if (!/\/$/.test(tag) && !/^(?:br|hr|img|input|meta|link)$/i.test(name)) stack.push(node);
  }
  if (carousel !== 1 || roots.length !== count || dataSlides !== count || roots.some((root, index) => root.data !== String(index + 1)) || roots.some(root => root.children.length !== 1 || !root.children[0].content)) fail(`HTML must contain one carousel with ${count} ordered roots and one direct .slide-content child`);
}

function validManifest(run, count) {
  try {
    const manifestPath = join(run, "render-manifest-v2.json"); if (!isFile(manifestPath) || !isDirectory(join(run, "slides-v2"))) return false;
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (!exactly(manifest, ["version", "runId", "sourceContentVersion", "width", "height", "slideCount", "slides"]) || manifest.version !== "2" || manifest.sourceContentVersion !== "2" || manifest.runId !== basename(run) || manifest.width !== 1080 || manifest.height !== 1350 || manifest.slideCount !== count || !Array.isArray(manifest.slides) || manifest.slides.length !== count || manifest.slides.some((path, index) => path !== paths(count)[index])) return false;
    return paths(count).every(path => { if (!isFile(join(run, path))) return false; const size = pngSize(join(run, path)); return size.width === 1080 && size.height === 1350; });
  } catch { return false; }
}
function snapshot(run, count) {
  if (!validManifest(run, count)) return null;
  const backup = mkdtempSync(join(tmpdir(), "apollo-render-v2-backup-")); cpSync(join(run, "slides-v2"), join(backup, "slides-v2"), { recursive: true }); cpSync(join(run, "render-manifest-v2.json"), join(backup, "render-manifest-v2.json")); return backup;
}
function restore(run, backup) {
  rmSync(join(run, "render-manifest-v2.json"), { force: true }); rmSync(join(run, "slides-v2"), { recursive: true, force: true });
  if (backup) { cpSync(join(backup, "slides-v2"), join(run, "slides-v2"), { recursive: true }); cpSync(join(backup, "render-manifest-v2.json"), join(run, "render-manifest-v2.json")); }
}

export async function exportRunV2(runDirectory, { chromium } = {}) {
  const content = validateRunV2(runDirectory); const count = content.slides.length; const run = resolve(runDirectory); const runId = basename(run); const htmlPath = join(run, "index-v2.html");
  if (!validManifest(run, count)) rmSync(join(run, "render-manifest-v2.json"), { force: true });
  if (basename(dirname(run)) !== "runs" || !isFile(htmlPath)) fail("Missing renderer HTML");
  const html = readFileSync(htmlPath, "utf8"); scanHtmlV2(html, count); if (!chromium) ({ chromium } = await import("playwright"));
  const stage = mkdtempSync(join(tmpdir(), "apollo-render-v2-stage-")); let browser;
  try {
    browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 }); let routed = false;
    await page.route("**/*", route => { routed = true; return route.abort(); }); await page.setContent(html, { waitUntil: "load" }); if (routed) fail("A subresource route was attempted");
    const inspection = await page.evaluate(() => {
      const roots = [...document.querySelectorAll("#carousel > section.carousel-slide[data-slide]")], slides = [...document.querySelectorAll("[data-slide]")].map(node => node.getAttribute("data-slide")), violations = [];
      roots.forEach((root, slide) => { if (root.children.length !== 1 || !root.firstElementChild?.classList.contains("slide-content")) violations.push(`slide ${slide + 1}: root must have one direct .slide-content child`); [root, ...root.querySelectorAll("*")].forEach(node => { const style = getComputedStyle(node), place = node === root ? "root" : "descendant"; for (const property of ["overflow", "overflowX", "overflowY"]) if (["hidden", "clip"].includes(style[property])) violations.push(`slide ${slide + 1}: ${place} has prohibited ${property}`); if (node.scrollWidth > node.clientWidth) violations.push(`slide ${slide + 1}: ${place} width overflowed`); if (node.scrollHeight > node.clientHeight) violations.push(`slide ${slide + 1}: ${place} height overflowed`); }); });
      return { roots: roots.length, slides, violations };
    });
    if (inspection.roots !== count || inspection.slides.join(",") !== Array.from({ length: count }, (_, index) => String(index + 1)).join(",")) fail("HTML slide structure is invalid"); if (inspection.violations.length) fail(inspection.violations[0]);
    for (let index = 0; index < count; index++) { const locator = page.locator(`#carousel > section.carousel-slide[data-slide=\"${index + 1}\"]`); const box = await locator.evaluate(element => { const { width, height } = element.getBoundingClientRect(); return { width, height }; }); if (box.width !== 1080 || box.height !== 1350) fail(`Slide ${index + 1} dimensions must be 1080x1350`); await locator.screenshot({ path: join(stage, `slide-${String(index + 1).padStart(2, "0")}.png`) }); }
    await browser.close(); browser = null;
    for (const path of paths(count)) { const size = pngSize(join(stage, basename(path))); if (size.width !== 1080 || size.height !== 1350) fail("Staged PNG dimensions are invalid"); }
    const backup = snapshot(run, count);
    try { rmSync(join(run, "render-manifest-v2.json"), { force: true }); rmSync(join(run, "slides-v2"), { recursive: true, force: true }); renameSync(stage, join(run, "slides-v2")); for (const path of paths(count)) { const size = pngSize(join(run, path)); if (size.width !== 1080 || size.height !== 1350) fail("Published PNG dimensions are invalid"); } writeFileSync(join(run, "render-manifest-v2.json"), `${JSON.stringify(manifestFor(runId, count), null, 2)}\n`); }
    catch (error) { restore(run, backup); throw error; } finally { if (backup) rmSync(backup, { recursive: true, force: true }); }
  } finally { if (browser) await browser.close(); if (existsSync(stage)) rmSync(stage, { recursive: true, force: true }); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) exportRunV2(process.argv[2] ?? "").catch(error => { console.error(`Render failed: ${error.message}`); process.exitCode = 1; });
