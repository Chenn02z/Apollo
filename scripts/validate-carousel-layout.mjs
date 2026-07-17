import { createHash } from "node:crypto";
import { appendFileSync, lstatSync, readFileSync, readdirSync, realpathSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateRun } from "./validate-carousel-content.mjs";
import { validateText } from "./validate-text.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const archive = join(root, "templates/database-blueprint");
const layoutKeys = ["template", "motif", "slides"];
const slideKeys = ["number", "composition", "density", "visualAnchor", "direction", "directionNote"];
const fragmentContract = {
  arrangements:["grid", "stack", "row", "split", "cluster", "center", "flow"],
  htmlTags:["section", "div", "article", "figure", "figcaption", "p", "h3", "span", "strong", "em", "code", "pre", "ul", "ol", "li", "blockquote"],
  svgTags:["svg", "g", "line", "polyline", "polygon", "rect", "circle", "ellipse"],
  classes:["cp-body", "cp-layout-grid", "cp-layout-stack", "cp-layout-row", "cp-layout-split", "cp-layout-cluster", "cp-layout-center", "cp-layout-flow", "cp-density-sparse", "cp-density-standard", "cp-density-dense", "cp-group", "cp-statement", "cp-collection", "cp-comparison", "cp-sequence", "cp-timeline", "cp-example", "cp-checklist", "cp-node", "cp-annotation", "cp-connector", "cp-label", "cp-detail", "cp-emphasis", "cp-muted", "cp-code", "cp-list", "cp-gap-1", "cp-gap-2", "cp-gap-3", "cp-gap-4", "cp-span-1", "cp-span-2", "cp-span-3", "cp-span-4", "cp-diagram", "cp-pos-tl", "cp-pos-tc", "cp-pos-tr", "cp-pos-ml", "cp-pos-mc", "cp-pos-mr", "cp-pos-bl", "cp-pos-bc", "cp-pos-br", "cp-svg-canvas", "cp-svg-line", "cp-svg-line-muted", "cp-svg-node", "cp-svg-accent", "cp-svg-arrow"],
};
const capabilities = { compositions:["minimal", "editorial", "split", "grid", "flow", "focus"], densities:["sparse", "standard", "dense"], visualAnchors:["headline", "statement", "diagram", "sequence", "contrast", "collection"], directions:["centered", "top-down", "left-right", "radial"] };
const exact = (value, keys) => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const fail = (code, path) => { throw new Error(`${code} ${path}`); };
const stat = path => { try { return lstatSync(path); } catch { return null; } };
const regular = path => { const value = stat(path); return value?.isFile() && !value.isSymbolicLink(); };
const codePoints = value => Array.from(value).length;

// This deliberately does not call validateRun: its invalid-content cleanup is
// correct for content validation, but prepare must not mutate an untrusted path.
export function assertRunDirectory(run) {
  const directory = resolve(run), parent = dirname(directory), value = stat(directory), parentValue = stat(parent);
  if (basename(parent) !== "runs" || !value?.isDirectory() || value.isSymbolicLink() || !parentValue?.isDirectory() || parentValue.isSymbolicLink()) fail("LAYOUT_RUN_OR_ARCHIVE", directory);
  return directory;
}

export function loadArchive() {
  const path = join(archive, "template.json");
  try {
    const members = readdirSync(archive).sort();
    const value = JSON.parse(readFileSync(path, "utf8"));
    const assets = { css: join(archive, value.themeAssets?.css ?? ""), shell: join(archive, value.themeAssets?.shell ?? "") };
    const vocabulary = value.fragmentVocabulary;
    if (members.join() !== "examples,preview.html,template.json" || !regular(join(archive, "preview.html")) || stat(join(archive, "examples"))?.isSymbolicLink() || !stat(join(archive, "examples"))?.isDirectory() || !exact(value, ["version", "id", "theme", "themeAssets", "motifs", "capabilities", "fragmentVocabulary"]) || value.version !== 1 || value.id !== "database-blueprint" || value.theme !== "database" || !exact(value.themeAssets, ["css", "shell"]) || value.themeAssets.css !== "../../assets/database/theme.css" || value.themeAssets.shell !== "../../assets/database/carousel-shell.html" || !Array.isArray(value.motifs) || value.motifs.join() !== "blueprint" || !exact(value.capabilities, ["compositions", "densities", "visualAnchors", "directions"]) || Object.entries(capabilities).some(([key, expected]) => !Array.isArray(value.capabilities[key]) || value.capabilities[key].join() !== expected.join()) || !exact(vocabulary, ["version", "arrangements", "htmlTags", "svgTags", "classes"]) || vocabulary.version !== 1 || Object.entries(fragmentContract).some(([key, expected]) => !Array.isArray(vocabulary[key]) || vocabulary[key].join() !== expected.join()) || !regular(assets.css) || !regular(assets.shell) || realpathSync(assets.css) !== join(root, "assets/database/theme.css") || realpathSync(assets.shell) !== join(root, "assets/database/carousel-shell.html")) fail("LAYOUT_RUN_OR_ARCHIVE", path);
    return { value, path, assets: Object.values(assets) };
  } catch (error) { if (String(error.message).startsWith("LAYOUT_")) throw error; fail("LAYOUT_RUN_OR_ARCHIVE", path); }
}

export function validateLayout(run, content) {
  const path = join(run, "carousel-layout.json"), output = stat(path);
  if (!output || output.isSymbolicLink() || !output.isFile()) fail("LAYOUT_OUTPUT", path);
  let layout; try { layout = JSON.parse(readFileSync(path, "utf8")); } catch { fail("LAYOUT_JSON", path); }
  if (!exact(layout, layoutKeys) || !Array.isArray(layout.slides)) fail("LAYOUT_ROOT_SHAPE", "$");
  const { value: template } = loadArchive();
  if (layout.template !== template.id || !template.motifs.includes(layout.motif)) fail("LAYOUT_TEMPLATE_OR_MOTIF", "$.template");
  if (layout.slides.length !== content.slides.length) fail("LAYOUT_SLIDE_COUNT", "$.slides");
  for (let index = 0; index < layout.slides.length; index++) {
    const slide = layout.slides[index], path = `$.slides[${index}]`;
    const keys = Object.hasOwn(slide, "repeatJustification") ? [...slideKeys, "repeatJustification"] : slideKeys;
    if (!exact(slide, keys)) fail("LAYOUT_SLIDE_SHAPE", path);
    if (!Number.isInteger(slide.number) || typeof slide.composition !== "string" || typeof slide.density !== "string" || typeof slide.visualAnchor !== "string" || typeof slide.direction !== "string" || typeof slide.directionNote !== "string") fail("LAYOUT_SLIDE_TYPE", path);
    if (slide.number !== content.slides[index].number) fail("LAYOUT_SLIDE_IDENTITY", `${path}.number`);
    if (!template.capabilities.compositions.includes(slide.composition) || !template.capabilities.densities.includes(slide.density) || !template.capabilities.visualAnchors.includes(slide.visualAnchor) || !template.capabilities.directions.includes(slide.direction)) fail("LAYOUT_CAPABILITY", path);
    if (!slide.directionNote.trim() || slide.directionNote !== slide.directionNote.trim() || codePoints(slide.directionNote) > 280) fail("LAYOUT_NOTE", `${path}.directionNote`);
    try { validateText(slide.directionNote, 280); } catch { fail("LAYOUT_NOTE", `${path}.directionNote`); }
    if (Object.hasOwn(slide, "repeatJustification")) {
      if (typeof slide.repeatJustification !== "string" || !slide.repeatJustification.trim() || slide.repeatJustification !== slide.repeatJustification.trim() || codePoints(slide.repeatJustification) > 280) fail("LAYOUT_NOTE", `${path}.repeatJustification`);
      try { validateText(slide.repeatJustification, 280); } catch { fail("LAYOUT_NOTE", `${path}.repeatJustification`); }
    }
  }
  return layout;
}

export function prepareLayout(run) {
  const path = join(assertRunDirectory(run), "carousel-layout.json"), value = stat(path);
  if (value?.isSymbolicLink()) fail("LAYOUT_STALE_SYMLINK", path);
  if (value?.isFile()) rmSync(path); else if (value) fail("LAYOUT_OUTPUT", path);
}

function walk(path, entries) {
  const value = stat(path); if (!value) fail("LAYOUT_RUN_OR_ARCHIVE", path);
  const name = relative(root, path);
  if (value.isSymbolicLink()) return entries.push([name, "symlink", readlinkSync(path)]);
  if (value.isFile()) return entries.push([name, "file", createHash("sha256").update(readFileSync(path)).digest("hex")]);
  if (!value.isDirectory()) fail("LAYOUT_RUN_OR_ARCHIVE", path);
  entries.push([name, "directory", ""]); for (const child of readdirSync(path).sort()) walk(join(path, child), entries);
}
export function snapshotBoundary(run) {
  const directory = assertRunDirectory(run), entries = []; walk(directory, entries); const contract = loadArchive(); walk(archive, entries); contract.assets.forEach(path => { if (!entries.some(entry => entry[0] === relative(root, path))) walk(path, entries); }); return entries.sort((a, b) => a[0].localeCompare(b[0]));
}
export function snapshotChanged(before, after) { return JSON.stringify(before) !== JSON.stringify(after); }

function snapshotFile(run, path) {
  const file = resolve(path ?? ""), directory = resolve(run), outside = relative(directory, file);
  if (!outside || (!outside.startsWith("..") && outside !== "..")) fail("LAYOUT_RUN_OR_ARCHIVE", file);
  return file;
}
export function writeSnapshot(run, path) { const directory = assertRunDirectory(run); writeFileSync(snapshotFile(directory, path), JSON.stringify(snapshotBoundary(directory))); }
export function readSnapshot(run, path) {
  const file = snapshotFile(run, path);
  if (!regular(file)) fail("LAYOUT_RUN_OR_ARCHIVE", file);
  try { const value = JSON.parse(readFileSync(file, "utf8")); if (!Array.isArray(value)) throw Error(); return value; }
  catch { fail("LAYOUT_RUN_OR_ARCHIVE", file); }
}

export function validateLayoutStage(run, before) {
  const directory = assertRunDirectory(run), after = snapshotBoundary(directory), layoutPath = relative(root, join(directory, "carousel-layout.json"));
  if (snapshotChanged(before, after.filter(entry => entry[0] !== layoutPath))) fail("LAYOUT_PROTECTED_MUTATION", directory);
  const content = validateRun(directory);
  return validateLayout(directory, content);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , run, mode, flag, snapshot] = process.argv;
  try {
    if (mode === "--prepare" && flag === "--snapshot-file" && snapshot) { prepareLayout(run); writeSnapshot(run, snapshot); }
    else if (mode === "--snapshot-file" && flag && !snapshot) validateLayoutStage(run, readSnapshot(run, flag));
    else throw Error("LAYOUT_RUN_OR_ARCHIVE arguments");
  } catch (error) {
    console.error(error.message);
    try { appendFileSync(join(dirname(dirname(resolve(run))), "proof-log.jsonl"), `${JSON.stringify({ run: resolve(run), stage: "layout", diagnostic: error.message })}\n`); } catch {}
    process.exitCode = 1;
  }
}
