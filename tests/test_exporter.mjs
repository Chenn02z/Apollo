// Targeted path-resolution tests for export-carousel.mjs --category flag.
// Does not require Chromium; checks argument parsing and dir resolution.
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const EXE = 'node scripts/export-carousel.mjs';
const RUN = 'test-deadbeef-dead-beef-deadbeef0000';
const SLUG = 'ai-engineering';
const CWD = process.cwd();

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`PASS ${name}`); }
  catch (e) { failed++; console.error(`FAIL ${name}: ${e.message}`); }
}

// 1. Bad run-id → usage
test('usage on bad run-id', () => {
  try { execSync(`${EXE} bad!!!`, { cwd: CWD, stdio: 'pipe', timeout: 5000 }); }
  catch (e) {
    const stderr = e.stderr?.toString() || '';
    if (!stderr.includes('usage:')) throw new Error('expected usage message');
  }
});

// 2. Missing deck.html — flat path
test('missing deck.html shows flat path', () => {
  try { execSync(`${EXE} ${RUN}`, { cwd: CWD, stdio: 'pipe', timeout: 5000 }); }
  catch (e) {
    const stderr = e.stderr?.toString() || '';
    if (!stderr.includes(`runs/${RUN}/deck.html`)) throw new Error(`expected flat path, got: ${stderr.trim()}`);
  }
});

// 3. Missing deck.html — categorized path
test('missing deck.html shows categorized path', () => {
  try { execSync(`${EXE} ${RUN} --category ${SLUG}`, { cwd: CWD, stdio: 'pipe', timeout: 5000 }); }
  catch (e) {
    const stderr = e.stderr?.toString() || '';
    if (!stderr.includes(`runs/${SLUG}/${RUN}/deck.html`)) throw new Error(`expected categorized path, got: ${stderr.trim()}`);
  }
});

// 4. Wrong arg order — --category before run-id
test('--category before run-id still works', () => {
  try { execSync(`${EXE} --category ${SLUG} ${RUN}`, { cwd: CWD, stdio: 'pipe', timeout: 5000 }); }
  catch (e) {
    const stderr = e.stderr?.toString() || '';
    if (!stderr.includes(`runs/${SLUG}/${RUN}/deck.html`)) throw new Error(`expected categorized path with args swapped, got: ${stderr.trim()}`);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
