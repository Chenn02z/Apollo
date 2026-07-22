import test from 'node:test';
import assert from 'node:assert';
import { resolve, join } from 'node:path';
import { writeFileSync, rmSync, readFileSync, readdirSync, existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const REPO = resolve(import.meta.dirname, '..');
const EXP = join(REPO, 'scripts', 'export-carousel.mjs');
const W = 1080, H = 1350;

const pngDim = p => {
  const b = readFileSync(p);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

const deck = slides => `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${slides}</body></html>`;

const slide = (opts = {}) => {
  const w = opts.w ?? '1080px', h = opts.h ?? '1350px';
  const sty = opts.sty ?? '';
  return `<section class="slide" style="width:${w};height:${h};overflow:hidden;${sty}">slide ${opts.idx}</section>`;
};

const good10 = Array.from({length: 10}, (_, i) => slide({ idx: i + 1 })).join('');

// Temp root containing runs/<id>/deck.html — exporter resolves runs/<id> from cwd
const makeRun = (id, html) => {
  const root = mkdtempSync(join(tmpdir(), `apollo-runs-`));
  const dir = join(root, 'runs', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'deck.html'), html, 'utf8');
  return { id, cwdRoot: root, dir, cleanup: () => { try { rmSync(root, { recursive: true, force: true }); } catch {} } };
};

let hasChromium = false;
try {
  const { chromium } = await import('playwright');
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  await b.close();
  hasChromium = true;
} catch {}

// ============================================================================
test('good path: ten valid slides', { skip: !hasChromium ? 'Chromium not available' : false }, async () => {
  const id = `good-${Date.now()}`;
  const r = makeRun(id, deck(good10));
  try {
    const out = execFileSync('node', [EXP, id], { encoding: 'utf8', timeout: 30000, cwd: r.cwdRoot });
    assert.match(out, /exported 10 slides/);

    for (let i = 1; i <= 10; i++) {
      const p = join(r.dir, `slide-${String(i).padStart(2, '0')}.png`);
      assert.ok(existsSync(p), `missing ${p}`);
      const { w, h } = pngDim(p);
      assert.strictEqual(w, W);
      assert.strictEqual(h, H);
    }
    const all = readdirSync(r.dir);
    assert.strictEqual(all.length, 11);
  } finally { r.cleanup(); }
});

test('bad run-id exits 2', () => {
  assert.throws(() => execFileSync('node', [EXP, '../../../etc/passwd'], { timeout: 5000 }), { status: 2 });
  assert.throws(() => execFileSync('node', [EXP, ''], { timeout: 5000 }), { status: 2 });
});

test('missing deck.html exits 2', () => {
  const id = `missing-${Date.now()}`;
  const r = makeRun(id, '');
  rmSync(join(r.dir, 'deck.html'));
  try {
    assert.throws(() => execFileSync('node', [EXP, id], { stdio: 'pipe', timeout: 5000, cwd: r.cwdRoot }), { status: 2 });
  } finally { r.cleanup(); }
});

test('11 slides → exporter catches count', { skip: !hasChromium ? 'Chromium not available' : false }, () => {
  const html = deck(Array.from({length: 11}, (_, i) => slide({ idx: i + 1 })).join(''));
  const id = `count-${Date.now()}`;
  const r = makeRun(id, html);
  try {
    assert.throws(() => execFileSync('node', [EXP, id], { stdio: 'pipe', timeout: 30000, cwd: r.cwdRoot }), { status: 1 });
    const pngs = readdirSync(r.dir).filter(f => /^slide-\d{2}\.png$/.test(f));
    assert.strictEqual(pngs.length, 0);
  } finally { r.cleanup(); }
});

test('overflow slide → nonzero exit, zero PNGs', { skip: !hasChromium ? 'Chromium not available' : false }, () => {
  const html = deck(
    Array.from({length: 10}, (_, i) => {
      if (i === 2) return `<section class="slide" style="width:1080px;height:1350px;overflow:visible">slide 3<div style="width:2000px;height:1px"></div></section>`;
      return slide({ idx: i + 1 });
    }).join('')
  );
  const id = `overflow-${Date.now()}`;
  const r = makeRun(id, html);
  try {
    assert.throws(() => execFileSync('node', [EXP, id], { stdio: 'pipe', timeout: 30000, cwd: r.cwdRoot }), { status: 1 });
    const pngs = readdirSync(r.dir).filter(f => /^slide-\d{2}\.png$/.test(f));
    assert.strictEqual(pngs.length, 0);
  } finally { r.cleanup(); }
});

test('network fetch → blocked, nonzero exit, zero PNGs', { skip: !hasChromium ? 'Chromium not available' : false }, () => {
  const html = deck(good10) + '<img src="https://example.com/fake.png" style="display:none">';
  const id = `net-${Date.now()}`;
  const r = makeRun(id, html);
  try {
    assert.throws(() => execFileSync('node', [EXP, id], { stdio: 'pipe', timeout: 30000, cwd: r.cwdRoot }), { status: 1 });
    const pngs = readdirSync(r.dir).filter(f => /^slide-\d{2}\.png$/.test(f));
    assert.strictEqual(pngs.length, 0);
  } finally { r.cleanup(); }
});

test('dimension mismatch → IHDR catches, nonzero exit, zero PNGs', { skip: !hasChromium ? 'Chromium not available' : false }, () => {
  const slides = Array.from({length: 10}, (_, i) => slide({ idx: i + 1, w: i === 4 ? '800px' : '1080px' }));
  const id = `dim-${Date.now()}`;
  const r = makeRun(id, deck(slides.join('')));
  try {
    assert.throws(() => execFileSync('node', [EXP, id], { stdio: 'pipe', timeout: 30000, cwd: r.cwdRoot }), { status: 1 });
    const pngs = readdirSync(r.dir).filter(f => /^slide-\d{2}\.png$/.test(f));
    assert.strictEqual(pngs.length, 0);
  } finally { r.cleanup(); }
});

test('pre-export stale PNGs replaced with valid ones', { skip: !hasChromium ? 'Chromium not available' : false }, () => {
  const id = `stale-${Date.now()}`;
  const r = makeRun(id, deck(good10));
  try {
    for (let i = 1; i <= 10; i++)
      writeFileSync(join(r.dir, `slide-${String(i).padStart(2, '0')}.png`), 'not-a-png');
    const out = execFileSync('node', [EXP, id], { encoding: 'utf8', timeout: 30000, cwd: r.cwdRoot });
    assert.match(out, /exported 10 slides/);
    for (let i = 1; i <= 10; i++) {
      const { w, h } = pngDim(join(r.dir, `slide-${String(i).padStart(2, '0')}.png`));
      assert.strictEqual(w, W);
      assert.strictEqual(h, H);
    }
  } finally { r.cleanup(); }
});

test('run isolation: two runs do not leak', { skip: !hasChromium ? 'Chromium not available' : false }, () => {
  const id1 = `iso-a-${Date.now()}`, id2 = `iso-b-${Date.now() + 1}`;
  const r1 = makeRun(id1, deck(good10)), r2 = makeRun(id2, deck(good10));
  try {
    execFileSync('node', [EXP, id1], { timeout: 30000, cwd: r1.cwdRoot });
    execFileSync('node', [EXP, id2], { timeout: 30000, cwd: r2.cwdRoot });
    assert.strictEqual(readdirSync(r1.dir).filter(f => /^slide-\d{2}\.png$/.test(f)).length, 10);
    assert.strictEqual(readdirSync(r2.dir).filter(f => /^slide-\d{2}\.png$/.test(f)).length, 10);
    assert.strictEqual(readdirSync(r1.dir).length, 11);
    assert.strictEqual(readdirSync(r2.dir).length, 11);
  } finally { r1.cleanup(); r2.cleanup(); }
});
