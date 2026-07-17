import { appendFileSync, cpSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { assertRunDirectory, loadArchive, snapshotBoundary, snapshotChanged, validateLayout } from "./validate-carousel-layout.mjs";
import { validateRun } from "./validate-carousel-content.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const fail = (code, path, message = "validation failed") => { throw new Error(`${code} ${path}: ${message}`); };
const stat = path => { try { return lstatSync(path); } catch { return null; } };
const regular = path => { const value = stat(path); return value?.isFile() && !value.isSymbolicLink(); };
const directory = path => { const value = stat(path); return value?.isDirectory() && !value.isSymbolicLink(); };
const escape = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const htmlTags = new Set(["section", "div", "article", "figure", "figcaption", "p", "h3", "span", "strong", "em", "code", "pre", "ul", "ol", "li", "blockquote"]);
const svgTags = new Set(["svg", "g", "line", "polyline", "polygon", "rect", "circle", "ellipse"]);
const geometry = new Set(["line", "polyline", "polygon", "rect", "circle", "ellipse"]);
const structural = new Set(["div", "article", "blockquote"]);
const blocks = new Set(["div", "article", "blockquote", "figure", "p", "h3", "pre", "ul", "ol"]);
const phrasing = new Set(["span", "strong", "em", "code"]);
const bindable = new Set(["p", "h3", "span", "strong", "em", "code", "li", "figcaption"]);
const arrangements = new Set(["grid", "stack", "row", "split", "cluster", "center", "flow"]);
const compatibility = { minimal:["center", "stack"], editorial:["stack", "row", "split"], split:["split", "row"], grid:["grid", "cluster"], flow:["flow", "row", "stack"], focus:["center", "cluster", "stack"] };
const semanticClasses = new Set(["cp-statement", "cp-collection", "cp-comparison", "cp-sequence", "cp-timeline", "cp-example", "cp-checklist"]);
const expectedSemantic = { statement:["cp-statement"], collection:["cp-collection"], comparison:["cp-comparison"], sequence:["cp-sequence", "cp-timeline"], example:["cp-example"], checklist:["cp-checklist"] };
const allowedClasses = new Set([
  "cp-body", "cp-layout-grid", "cp-layout-stack", "cp-layout-row", "cp-layout-split", "cp-layout-cluster", "cp-layout-center", "cp-layout-flow", "cp-density-sparse", "cp-density-standard", "cp-density-dense",
  "cp-group", "cp-statement", "cp-collection", "cp-comparison", "cp-sequence", "cp-timeline", "cp-example", "cp-checklist", "cp-node", "cp-annotation", "cp-connector", "cp-label", "cp-detail", "cp-emphasis", "cp-muted", "cp-code", "cp-list",
  "cp-gap-1", "cp-gap-2", "cp-gap-3", "cp-gap-4", "cp-span-1", "cp-span-2", "cp-span-3", "cp-span-4", "cp-diagram", "cp-pos-tl", "cp-pos-tc", "cp-pos-tr", "cp-pos-ml", "cp-pos-mc", "cp-pos-mr", "cp-pos-bl", "cp-pos-bc", "cp-pos-br", "cp-svg-canvas", "cp-svg-line", "cp-svg-line-muted", "cp-svg-node", "cp-svg-accent", "cp-svg-arrow",
]);

function attrs(source, path) {
  const values = {}; let offset = 0; const pattern = /[\t\n\r ]+([A-Za-z][A-Za-z0-9:-]*|data-[a-z-]+)="([^"<>&]*)"/y;
  while (offset < source.length) { pattern.lastIndex = offset; const match = pattern.exec(source); if (!match) fail("FRAGMENT_SYNTAX", path, "malformed attribute syntax"); if (Object.hasOwn(values, match[1])) fail("FRAGMENT_ATTRIBUTE", path, `duplicate ${match[1]}`); values[match[1]] = match[2]; offset = pattern.lastIndex; }
  return values;
}

export function parseFragment(source, path = "fragment") {
  if (source.startsWith("\uFEFF") || /[\0\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(source) || /&|<!--|<!|<\?|\/>/.test(source)) fail("FRAGMENT_SYNTAX", path, "prohibited source token");
  const roots = [], stack = []; let offset = 0;
  while (offset < source.length) {
    const whitespace = /^[\t\n\r ]+/.exec(source.slice(offset)); if (whitespace) { offset += whitespace[0].length; continue; }
    const close = /^<\/([a-z][a-z0-9]*)>/.exec(source.slice(offset));
    if (close) { const node = stack.pop(); if (!node || node.tag !== close[1]) fail("FRAGMENT_SYNTAX", path, "malformed nesting"); offset += close[0].length; continue; }
    const open = /^<([a-z][a-z0-9]*)((?:[\t\n\r ]+[A-Za-z][A-Za-z0-9:-]*="[^"<>&]*")*)[\t\n\r ]*>/.exec(source.slice(offset));
    if (!open) fail("FRAGMENT_SYNTAX", path, "raw text or malformed tag");
    const node = { tag: open[1], attrs: attrs(open[2], path), children: [], parent: stack.at(-1) ?? null };
    if (!htmlTags.has(node.tag) && !svgTags.has(node.tag)) fail("FRAGMENT_TAG", path, node.tag);
    if (node.parent) node.parent.children.push(node); else roots.push(node);
    stack.push(node); offset += open[0].length;
  }
  if (stack.length || roots.length !== 1) fail("FRAGMENT_SYNTAX", path, "fragment needs one explicitly closed root");
  return roots[0];
}

function walk(node, visit) { visit(node); node.children.forEach(child => walk(child, visit)); }
const classes = node => node.attrs.class?.split(" ") ?? [];
function validateParents(node, path) {
  for (const child of node.children) {
    let allowed = false;
    if (node.tag === "section") allowed = blocks.has(child.tag);
    else if (structural.has(node.tag)) allowed = structural.has(child.tag) || ["p", "h3", "pre", "ul", "ol", "figure"].includes(child.tag);
    else if (node.tag === "figure") allowed = ["div", "article", "blockquote", "figure", "p", "h3", "pre", "ul", "ol", "svg", "figcaption"].includes(child.tag);
    else if (["ul", "ol"].includes(node.tag)) allowed = child.tag === "li";
    else if (["li", "p", "h3", "figcaption", "span", "strong", "em"].includes(node.tag)) allowed = phrasing.has(child.tag);
    else if (node.tag === "pre") allowed = child.tag === "code" && node.children.length === 1;
    else if (node.tag === "svg") allowed = child.tag === "g" || geometry.has(child.tag);
    else if (node.tag === "g") allowed = geometry.has(child.tag);
    if (!allowed || (geometry.has(node.tag) || node.tag === "code")) fail("FRAGMENT_TAG", path, `${child.tag} cannot be inside ${node.tag}`);
    validateParents(child, path);
  }
  if (node.tag === "pre" && (node.children.length !== 1 || node.children[0].tag !== "code")) fail("FRAGMENT_TAG", path, "pre requires one code child");
  if (node.tag === "figure") {
    if (node.children.filter(child => child.tag === "svg").length > 1 || node.children.filter(child => child.tag === "figcaption").length > 1) fail("FRAGMENT_TAG", path, "figure child limit");
  }
}

function validateAttributes(node, rootNode, path) {
  const names = Object.keys(node.attrs), svg = svgTags.has(node.tag);
  if (!svg) {
    const allowed = node === rootNode ? ["class", "data-composition", "data-direction", "data-anchor"] : ["class", "data-bind"];
    if (names.some(name => !allowed.includes(name))) fail("FRAGMENT_ATTRIBUTE", path, names.find(name => !allowed.includes(name)));
  } else {
    const allowed = { svg:["class", "viewBox", "preserveAspectRatio", "aria-hidden", "focusable"], g:[], line:["class", "x1", "y1", "x2", "y2"], polyline:["class", "points"], polygon:["class", "points"], rect:["class", "x", "y", "width", "height", "rx", "ry"], circle:["class", "cx", "cy", "r"], ellipse:["class", "cx", "cy", "rx", "ry"] }[node.tag];
    if (names.some(name => !allowed.includes(name))) fail("FRAGMENT_ATTRIBUTE", path, names.find(name => !allowed.includes(name)));
  }
}

function validateClasses(node, rootNode, path) {
  const tokens = classes(node); if (tokens.some(token => !token) || new Set(tokens).size !== tokens.length || tokens.some(token => !allowedClasses.has(token))) fail("FRAGMENT_CLASS", path, "unknown or duplicate class");
  const layout = tokens.filter(token => token.startsWith("cp-layout-")), density = tokens.filter(token => token.startsWith("cp-density-"));
  if (node === rootNode) { if (!tokens.includes("cp-body") || layout.length !== 1 || density.length !== 1) fail("FRAGMENT_ROOT", path, "root classes"); }
  else if (tokens.includes("cp-body") || layout.length || density.length) fail("FRAGMENT_CLASS", path, "root-only class");
  const structuralOnly = token => ["cp-group", "cp-statement", "cp-collection", "cp-comparison", "cp-sequence", "cp-timeline", "cp-example", "cp-checklist", "cp-node", "cp-annotation", "cp-connector"].includes(token) || /^cp-gap-[1-4]$/.test(token) || /^cp-span-[1-4]$/.test(token);
  if (tokens.some(structuralOnly) && !["section", "div", "article", "blockquote", "figure"].includes(node.tag)) fail("FRAGMENT_CLASS", path, "structural class on non-structural element");
  const spans = tokens.filter(token => /^cp-span-/.test(token)); if (spans.length > 1 || (spans.length && node.parent !== rootNode)) fail("FRAGMENT_CLASS", path, "span must be unique on a direct layout child");
  if (tokens.includes("cp-list") && !["ul", "ol"].includes(node.tag)) fail("FRAGMENT_CLASS", path, "cp-list element");
  if (tokens.includes("cp-code") && !["pre", "code"].includes(node.tag)) fail("FRAGMENT_CLASS", path, "cp-code element");
  if (tokens.some(token => ["cp-label", "cp-detail", "cp-emphasis", "cp-muted"].includes(token)) && !bindable.has(node.tag)) fail("FRAGMENT_CLASS", path, "phrasing class element");
  if (tokens.includes("cp-diagram") && node.tag !== "figure") fail("FRAGMENT_CLASS", path, "cp-diagram element");
  if (tokens.some(token => token.startsWith("cp-pos-")) && (node.parent?.tag !== "figure" || !classes(node.parent).includes("cp-diagram") || svgTags.has(node.tag))) fail("FRAGMENT_CLASS", path, "position class element");
  if (tokens.includes("cp-svg-canvas") && node.tag !== "svg") fail("FRAGMENT_CLASS", path, "SVG canvas element");
  if (tokens.some(token => ["cp-svg-line", "cp-svg-line-muted"].includes(token)) && !["line", "polyline"].includes(node.tag)) fail("FRAGMENT_CLASS", path, "SVG line element");
  if (tokens.includes("cp-svg-node") && !["rect", "circle", "ellipse"].includes(node.tag)) fail("FRAGMENT_CLASS", path, "SVG node element");
  if (tokens.includes("cp-svg-accent") && !geometry.has(node.tag)) fail("FRAGMENT_CLASS", path, "SVG accent element");
  if (tokens.includes("cp-svg-arrow") && node.tag !== "polygon") fail("FRAGMENT_CLASS", path, "SVG arrow element");
  if (node.tag === "g" && namesOrClasses(node).length) fail("FRAGMENT_ATTRIBUTE", path, "g cannot have attributes");
}
const namesOrClasses = node => Object.keys(node.attrs);
const integer = value => /^(?:0|[1-9]\d*)$/.test(value ?? "") ? Number(value) : NaN;
function validateSvg(node, path) {
  const svgNodes = []; walk(node, child => { if (svgTags.has(child.tag)) svgNodes.push(child); });
  if (svgNodes.length > 128) fail("FRAGMENT_SVG", path, "too many SVG elements");
  for (const value of svgNodes) {
    if (value.tag === "svg") {
      const exact = { class:"cp-svg-canvas", viewBox:"0 0 1000 600", preserveAspectRatio:"xMidYMid meet", "aria-hidden":"true", focusable:"false" };
      if (Object.keys(value.attrs).length !== 5 || Object.entries(exact).some(([key, expected]) => value.attrs[key] !== expected) || value.parent?.tag !== "figure" || !classes(value.parent).includes("cp-diagram")) fail("FRAGMENT_SVG", path, "invalid SVG root");
      continue;
    }
    if (value.tag === "g") continue;
    const number = key => integer(value.attrs[key]);
    if (value.tag === "line") { const points = [number("x1"), number("y1"), number("x2"), number("y2")]; if (points.some(Number.isNaN) || points[0] > 1000 || points[2] > 1000 || points[1] > 600 || points[3] > 600) fail("FRAGMENT_SVG", path, "line bounds"); }
    if (["polyline", "polygon"].includes(value.tag)) { const points = value.attrs.points?.split(" ") ?? []; if (points.length < 2 || points.length > 64 || points.some(pair => { const match = /^(0|[1-9]\d*),(0|[1-9]\d*)$/.exec(pair); return !match || Number(match[1]) > 1000 || Number(match[2]) > 600; })) fail("FRAGMENT_SVG", path, "point bounds"); }
    if (value.tag === "rect") { const [x,y,width,height,rx=0,ry=0] = [number("x"),number("y"),number("width"),number("height"),value.attrs.rx === undefined ? 0 : number("rx"),value.attrs.ry === undefined ? 0 : number("ry")]; if ([x,y,width,height,rx,ry].some(Number.isNaN) || width <= 0 || height <= 0 || x + width > 1000 || y + height > 600 || rx > width / 2 || ry > height / 2) fail("FRAGMENT_SVG", path, "rect bounds"); }
    if (value.tag === "circle") { const [cx,cy,r] = [number("cx"),number("cy"),number("r")]; if ([cx,cy,r].some(Number.isNaN) || r <= 0 || cx-r < 0 || cx+r > 1000 || cy-r < 0 || cy+r > 600) fail("FRAGMENT_SVG", path, "circle bounds"); }
    if (value.tag === "ellipse") { const [cx,cy,rx,ry] = [number("cx"),number("cy"),number("rx"),number("ry")]; if ([cx,cy,rx,ry].some(Number.isNaN) || rx <= 0 || ry <= 0 || cx-rx < 0 || cx+rx > 1000 || cy-ry < 0 || cy+ry > 600) fail("FRAGMENT_SVG", path, "ellipse bounds"); }
  }
}

function leaves(content, value = content, pointer = "/content", output = []) {
  if (typeof value === "string") { if (pointer !== "/content/type") output.push([pointer, value]); }
  else if (Array.isArray(value)) value.forEach((item, index) => leaves(content, item, `${pointer}/${index}`, output));
  else Object.entries(value).forEach(([key, item]) => leaves(content, item, `${pointer}/${key}`, output));
  return output;
}
function resolvePointer(slide, pointer) { let value = slide; for (const part of pointer.split("/").slice(1)) { if (!part || !Object.hasOwn(value, part)) return undefined; value = value[part]; } return value; }
function validateBindings(rootNode, slide, path) {
  const expected = leaves(slide.content), expectedPointers = new Set(expected.map(([pointer]) => pointer)), bindings = [], semantic = [];
  walk(rootNode, node => { for (const token of classes(node)) if (semanticClasses.has(token)) semantic.push([token, node]); if (Object.hasOwn(node.attrs, "data-bind")) { if (!bindable.has(node.tag) || node.children.length) fail("FRAGMENT_BINDING", path, "binding element must be empty and bindable"); bindings.push([node.attrs["data-bind"], node]); } });
  if (bindings.some(([pointer]) => !expectedPointers.has(pointer) || typeof resolvePointer(slide, pointer) !== "string") || new Set(bindings.map(([pointer]) => pointer)).size !== bindings.length || bindings.length !== expected.length) fail("FRAGMENT_BINDING", path, "unknown, duplicate, missing, or non-string binding");
  const allowed = expectedSemantic[slide.content.type]; if (semantic.length !== 1 || !allowed.includes(semantic[0][0])) fail("FRAGMENT_SEMANTICS", path, "semantic wrapper mismatch");
  for (const [, node] of bindings) { let parent = node.parent, inside = false; while (parent) { if (parent === semantic[0][1]) inside = true; parent = parent.parent; } if (!inside && node !== semantic[0][1]) fail("FRAGMENT_SEMANTICS", path, "binding outside semantic wrapper"); }
  if (["sequence", "checklist"].includes(slide.content.type)) {
    const key = slide.content.type === "sequence" ? "steps" : "items", ordered = slide.content[key].flatMap((_item, index) => [`/content/${key}/${index}/label`, `/content/${key}/${index}/detail`]);
    if (bindings.map(([pointer]) => pointer).join() !== ordered.join()) fail("FRAGMENT_BINDING", path, "ordered bindings changed source order");
  }
  for (const [pointer, node] of bindings) { node.boundText = resolvePointer(slide, pointer); node.bindingPointer = pointer; }
}

function validateFragment(rootNode, slide, plan, path) {
  validateParents(rootNode, path); walk(rootNode, node => validateAttributes(node, rootNode, path)); walk(rootNode, node => validateClasses(node, rootNode, path));
  if (rootNode.tag !== "section" || Object.keys(rootNode.attrs).sort().join() !== ["class", "data-anchor", "data-composition", "data-direction"].sort().join()) fail("FRAGMENT_ROOT", path, "root attributes");
  const arrangement = classes(rootNode).find(token => token.startsWith("cp-layout-"))?.slice(10);
  if (!arrangements.has(arrangement) || !compatibility[plan.composition].includes(arrangement) || rootNode.attrs["data-composition"] !== plan.composition || rootNode.attrs["data-direction"] !== plan.direction || rootNode.attrs["data-anchor"] !== plan.visualAnchor || !classes(rootNode).includes(`cp-density-${plan.density}`)) fail("FRAGMENT_PLAN", path, "layout plan mismatch");
  if (slide.content.type === "sequence" && !["flow", "row", "stack"].includes(arrangement)) fail("FRAGMENT_PLAN", path, "sequence arrangement");
  validateSvg(rootNode, path); validateBindings(rootNode, slide, path);
  const allClasses = []; walk(rootNode, node => allClasses.push(...classes(node)));
  if (plan.visualAnchor === "diagram" && allClasses.filter(value => value === "cp-diagram").length !== 1) fail("FRAGMENT_SEMANTICS", path, "diagram anchor requires one diagram");
  if (plan.visualAnchor === "sequence" && !allClasses.some(value => ["cp-sequence", "cp-timeline"].includes(value))) fail("FRAGMENT_SEMANTICS", path, "sequence anchor requires sequence structure");
  return { root: rootNode, arrangement };
}

export function validateFragmentSet(run, content, layout) {
  const bodies = join(run, "slide-bodies"); if (!directory(bodies)) fail("COMPOSER_OUTPUT_SET", bodies, "real directory required");
  const expected = content.slides.map(slide => `${String(slide.number).padStart(2, "0")}.html`), members = readdirSync(bodies).sort();
  if (members.join() !== expected.join()) fail("COMPOSER_OUTPUT_SET", bodies, "exact numbered output set required");
  const fragments = [];
  for (let index = 0; index < expected.length; index++) {
    const path = join(bodies, expected[index]), value = stat(path); if (!value?.isFile() || value.isSymbolicLink()) fail("COMPOSER_OUTPUT_SET", path, "real regular file required");
    const bytes = readFileSync(path); if (bytes.length > 65536) fail("FRAGMENT_BYTES", path, "64 KiB limit");
    let source; try { source = new TextDecoder("utf-8", { fatal:true }).decode(bytes); } catch { fail("FRAGMENT_BYTES", path, "invalid UTF-8"); }
    fragments.push(validateFragment(parseFragment(source, path), content.slides[index], layout.slides[index], path));
  }
  const warnings = [], seen = new Map(); let equalRun = 0;
  fragments.forEach((fragment, index) => {
    const plan = layout.slides[index], count = (seen.get(fragment.arrangement) ?? 0) + 1, repeated = fragments[index - 1]?.arrangement === fragment.arrangement || count > 2; seen.set(fragment.arrangement, count);
    if (repeated && !plan.repeatJustification) warnings.push({ severity:"warning", code:"COMPOSER_REPEAT_UNJUSTIFIED", path:`/slides/${index}/repeatJustification`, message:"Repeated dominant arrangement has no justification." });
    const children = fragment.root.children, spans = children.map(child => classes(child).find(token => /^cp-span-[1-4]$/.test(token))?.at(-1) ?? "1"), equal = ["grid", "row", "split"].includes(fragment.arrangement) && children.length >= 2 && children.every(child => ["div", "article", "blockquote", "figure"].includes(child.tag)) && new Set(spans).size === 1;
    equalRun = equal ? equalRun + 1 : 0; if (equalRun >= 3) warnings.push({ severity:"warning", code:"COMPOSER_EQUAL_COLUMNS", path:`/slides/${index}`, message:"Third consecutive equal-column composition." });
  });
  return { fragments, warnings };
}

function serialize(node) {
  const attributes = Object.entries(node.attrs).filter(([name]) => name !== "data-bind").map(([name, value]) => ` ${name}="${value}"`).join(""), provenance = node.bindingPointer === undefined ? "" : ` data-binding="${escape(node.bindingPointer)}"`;
  return `<${node.tag}${attributes}${provenance}>${node.boundText === undefined ? node.children.map(serialize).join("") : escape(node.boundText)}</${node.tag}>`;
}
const glossary = entries => entries.map(({ term, definition }) => `<b class="glossary-term">${escape(term)}</b><span class="glossary-definition">${escape(definition)}</span>`).join("");
export function assembleHtml(content, layout, fragments, shell = readFileSync(new URL("../assets/database/carousel-shell.html", import.meta.url), "utf8"), theme = readFileSync(new URL("../assets/database/theme.css", import.meta.url), "utf8")) {
  const withTheme = shell.replace("{{theme_css}}", theme), template = withTheme.match(/<template data-shell="database-blueprint">([\s\S]*?)<\/template>/)?.[1]; if (!template || withTheme.match(/<template\b/g)?.length !== 1) fail("ASSEMBLY_OUTPUT", "shell", "one canonical shell required");
  const count = String(content.slides.length).padStart(2, "0"), slides = content.slides.map((slide, index) => {
    const padded = String(slide.number).padStart(2, "0"), values = { number:String(slide.number), header_topic:content.topic, header_number:padded, role:slide.role, title:slide.title, why:slide.why, body:serialize(fragments[index].root), glossary:glossary(slide.glossary), footer_topic:content.topic, footer_number:padded, count_padded:count };
    return template.replace(/{{([a-z_]+)}}/g, (_match, slot) => ["body", "glossary"].includes(slot) ? values[slot] : escape(values[slot] ?? fail("ASSEMBLY_OUTPUT", slot, "unknown slot")));
  }).join("\n");
  const html = `${withTheme.match(/<style>[\s\S]*?<\/style>/)?.[0]}\n<main id="carousel">${slides}</main>\n`;
  if (/{{|data-bind=/.test(html)) fail("ASSEMBLY_OUTPUT", "index.html", "unbound slot");
  return html;
}

function statePath(run, path) { const file = resolve(path ?? ""), outside = relative(resolve(run), file); if (!outside || (!outside.startsWith("..") && outside !== "..")) fail("COMPOSER_RUN_OR_TEMPLATE", file, "state must be outside run"); return file; }
function rendererMembers(run) { return ["slide-bodies", "index.html", "slides", "render-manifest.json"].map(name => join(run, name)); }
function completeRenderer(run) { const members = rendererMembers(run), manifest = stat(members[3]); if (!manifest) return false; if (manifest.isSymbolicLink() || !manifest.isFile() || !directory(members[0]) || !regular(members[1]) || !directory(members[2])) fail("COMPOSER_RUN_OR_TEMPLATE", run, "prior success marker has an incomplete renderer set"); return true; }
function filteredBoundary(run) { const prefix = `${relative(root, join(run, "slide-bodies"))}/`; return snapshotBoundary(run).filter(entry => !entry[0].startsWith(prefix)); }
export function restoreRenderer(run, state) {
  for (const path of rendererMembers(run)) rmSync(path, { recursive:true, force:true });
  if (state.backup) for (const name of ["slide-bodies", "index.html", "slides", "render-manifest.json"]) cpSync(join(state.backup, name), join(run, name), { recursive:true });
}
export function readCompositionState(run, file) { const path = statePath(run, file); if (!regular(path)) fail("COMPOSER_RUN_OR_TEMPLATE", path, "missing state"); try { const value = JSON.parse(readFileSync(path, "utf8")); if (!Array.isArray(value.boundary) || (value.backup !== null && typeof value.backup !== "string")) throw Error(); return value; } catch { fail("COMPOSER_RUN_OR_TEMPLATE", path, "invalid state"); } }
export function prepareComposition(runDirectory, file) {
  const run = assertRunDirectory(runDirectory), stateFile = statePath(run, file), content = validateRun(run); validateLayout(run, content); loadArchive();
  const shell = readFileSync(new URL("../assets/database/carousel-shell.html", import.meta.url), "utf8"); if (!shell.includes('<template data-shell="database-blueprint">') || (shell.match(/{{body}}/g) ?? []).length !== 1) fail("COMPOSER_RUN_OR_TEMPLATE", "carousel-shell.html", "invalid canonical shell");
  const body = join(run, "slide-bodies"), bodyStat = stat(body); if (bodyStat?.isSymbolicLink() || (bodyStat && !bodyStat.isDirectory())) fail("COMPOSER_STALE_OUTPUT", body, "unsafe body path");
  const backup = completeRenderer(run) ? mkdtempSync(join(tmpdir(), "apollo-render-backup-")) : null;
  try {
    if (backup) for (const name of ["slide-bodies", "index.html", "slides", "render-manifest.json"]) cpSync(join(run, name), join(backup, name), { recursive:true });
    rmSync(join(run, "render-manifest.json"), { force:true }); rmSync(body, { recursive:true, force:true }); mkdirSync(body);
    const state = { backup, boundary:filteredBoundary(run) }; writeFileSync(stateFile, JSON.stringify(state)); return state;
  } catch (error) { const state = { backup, boundary:[] }; restoreRenderer(run, state); if (backup) rmSync(backup, { recursive:true, force:true }); throw error; }
}
export function validateComposition(runDirectory, state) {
  const run = assertRunDirectory(runDirectory), after = filteredBoundary(run); if (snapshotChanged(state.boundary, after)) fail("COMPOSER_PROTECTED_MUTATION", run);
  const content = validateRun(run), layout = validateLayout(run, content), result = validateFragmentSet(run, content, layout); return { content, layout, ...result, html:assembleHtml(content, layout, result.fragments) };
}
export function finishComposition(state, file) { if (state.backup) rmSync(state.backup, { recursive:true, force:true }); if (file) rmSync(file, { force:true }); }
export function logDiagnostic(run, record) { try { appendFileSync(join(dirname(dirname(resolve(run))), "proof-log.jsonl"), `${JSON.stringify(record)}\n`); } catch {} }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , run, mode, flag, file] = process.argv;
  try {
    if (mode === "--prepare" && flag === "--state-file" && file) prepareComposition(run, file);
    else if (mode === "--restore" && flag === "--state-file" && file) { const state = readCompositionState(run, file); restoreRenderer(resolve(run), state); finishComposition(state, file); }
    else throw Error("COMPOSER_RUN_OR_TEMPLATE arguments");
  } catch (error) { logDiagnostic(run, { run:resolve(run ?? ""), stage:"composer", diagnostic:error.message }); console.error(error.message); process.exitCode = 1; }
}
