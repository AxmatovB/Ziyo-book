// Runs every source parser one after another.
//
//   npm run books:sync                      all sources
//   npm run books:sync -- --only catalog    one or more of: catalog, librivox, ziyouz, manifest, gutenberg
//
// Each source writes its own file in src/data/, so a failing source never damages the others.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseArgs } from './lib.mjs';

const dir = dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));

const SOURCES = {
  catalog: { label: 'Gutenberg offline catalog (curated classics, 6 languages)', script: 'sync-gutenberg-catalog.mjs', args: [] },
  librivox: { label: 'LibriVox audiobooks', script: 'sync-librivox.mjs', args: [] },
  ziyouz: { label: 'Ziyouz.com (Uzbek literature, public-domain-safe)', script: 'sync-ziyouz.mjs', args: [] },
  manifest: { label: 'Manual manifest (Internet Archive / URLs)', script: 'add-sources.mjs', args: [] },
  // heavy and slow (Gutendex is rate limited); only runs when asked for explicitly
  gutenberg: { label: 'Gutendex popularity data', script: 'fetch-gutenberg.mjs', args: ['--lang', 'en', '--pages', '40'], optIn: true },
};

const only = args.only ? String(args.only).split(',').map((s) => s.trim()) : Object.keys(SOURCES).filter((k) => !SOURCES[k].optIn);
const unknown = only.filter((k) => !SOURCES[k]);
if (unknown.length) {
  console.error(`Unknown source(s): ${unknown.join(', ')}. Available: ${Object.keys(SOURCES).join(', ')}`);
  process.exit(1);
}

const summary = [];
for (const key of only) {
  const { label, script, args: scriptArgs } = SOURCES[key];
  console.log(`\n=== ${key}: ${label}`);
  const started = Date.now();
  const result = spawnSync(process.execPath, [join(dir, script), ...scriptArgs], { stdio: 'inherit' });
  summary.push({ key, ok: result.status === 0, seconds: Math.round((Date.now() - started) / 1000) });
}

console.log('\nSummary');
for (const s of summary) console.log(`  ${s.ok ? 'OK    ' : 'FAILED'} ${s.key} (${s.seconds}s)`);
process.exit(summary.every((s) => s.ok) ? 0 : 1);
