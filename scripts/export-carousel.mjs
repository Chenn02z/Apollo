import { chromium } from 'playwright';
import { readFileSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const RE = /^[A-Za-z0-9_-]{1,128}$/;
const W = 1080, H = 1350, N = 10;

const die = (c, m) => { console.error(m); process.exit(c); };

const runId = process.argv[2];
if (!runId || !RE.test(runId))
  die(2, 'usage: node scripts/export-carousel.mjs <run-id>');

const dir = join(process.cwd(), 'runs', runId);
const deck = join(dir, 'deck.html');
if (!existsSync(deck))
  die(2, `EXPORT_ERROR: missing runs/${runId}/deck.html`);

const s = i => `slide-${String(i).padStart(2, '0')}.png`;

// Pre-cleanup
for (let i = 1; i <= N; i++) try { unlinkSync(join(dir, s(i))); } catch {}

const pngDim = p => {
  const b = readFileSync(p);
  if (b.length < 24) throw new Error(`bad PNG: ${basename(p)}`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

let browser, exit = { c: 0, m: '' };
try {
  try { browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] }); }
  catch (e) { die(2, `EXPORT_ERROR: render chromium launch: ${e.message}`); }

  const ctx = await browser.newContext({
    viewport: { width: W, height: H }, deviceScaleFactor: 1, offline: true,
  });
  const page = await ctx.newPage();

  let netHit = false;
  page.on('request', req => { if (!req.url().startsWith('file://')) netHit = true; });

  await page.goto(`file://${deck}`, { waitUntil: 'load' });

  const slides = await page.$$('body > section.slide');
  if (slides.length !== N)
    exit = { c: 1, m: `EXPORT_ERROR: slide count ${slides.length} expected ${N}` };

  if (!exit.c) {
    for (let i = 0; i < slides.length; i++) {
      const idx = i + 1;
      const el = slides[i];
      const scr = await el.evaluate(n => ({
        sw: n.scrollWidth, sh: n.scrollHeight, cw: n.clientWidth, ch: n.clientHeight,
      }));
      if (scr.sw > scr.cw || scr.sh > scr.ch) {
        exit = { c: 1, m: `EXPORT_ERROR: overflow slide ${idx}: ${
          scr.sw > scr.cw ? `scrollWidth ${scr.sw} > clientWidth ${scr.cw}`
            : `scrollHeight ${scr.sh} > clientHeight ${scr.ch}`}` };
        break;
      }
      await el.screenshot({ path: join(dir, s(idx)) });
    }
  }

  if (!exit.c && netHit) exit = { c: 1, m: 'EXPORT_ERROR: render network request blocked' };

  if (!exit.c) {
    const files = readdirSync(dir).filter(f => /^slide-\d{2}\.png$/.test(f)).sort();
    const want = Array.from({ length: N }, (_, i) => s(i + 1));
    if (files.length !== N || !want.every((n, i) => n === files[i]))
      exit = { c: 1, m: `EXPORT_ERROR: slide file mismatch: got ${files.join(',')}` };

    if (!exit.c) {
      for (let i = 1; i <= N; i++) {
        const { w, h } = pngDim(join(dir, s(i)));
        if (w !== W || h !== H) {
          exit = { c: 1, m: `EXPORT_ERROR: dimension mismatch slide-${String(i).padStart(2, '0')}.png: ${w}x${h} expected ${W}x${H}` };
          break;
        }
      }
    }
  }
} catch (e) {
  exit = { c: exit.c || 2, m: exit.m || `EXPORT_ERROR: render ${e.message}` };
} finally {
  if (exit.c) for (let i = 1; i <= N; i++) try { unlinkSync(join(dir, s(i))); } catch {}
  await browser?.close();
}

if (!exit.c) console.log(`exported ${N} slides to runs/${runId}/`);
else die(exit.c, exit.m);
