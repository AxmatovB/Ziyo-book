// Shared helpers for the catalog ingestion scripts. Zero dependencies (Node 18+).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getJson(url, { tries = 4, timeout = 45000 } = {}) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeout), headers: { 'user-agent': 'ziyo-kutubxonasi-ingest/1.0' } });
      if (res.ok) return await res.json();
    } catch {
      /* retry */
    }
    await sleep(1200 * attempt);
  }
  return null;
}

export function readJson(path, fallback) {
  try {
    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data));
}

/** Tiny argv parser: --key value, --flag. */
export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { args._.push(a); continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) args[key] = true;
    else { args[key] = next; i++; }
  }
  return args;
}

export const titleKey = (title) =>
  title.toLowerCase().replace(/\(.*?\)/g, '').replace(/[;:,].*$/, '').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();

export function flipName(name) {
  const parts = name.split(', ');
  return parts.length < 2 ? name : `${parts[1]} ${parts[0]}`.replace(/\s+/g, ' ').trim();
}

/** Plain-text, whitespace-collapsed, cut at a word boundary (keeps the bundle small). */
export function shorten(text, max = 320) {
  const plain = String(text ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\(This is an automatically generated summary\.?\)/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 40)).replace(/[,;:\s]+$/, '') + '…';
}

export const LANGUAGE_NAMES = {
  en: 'Inglizcha', eng: 'Inglizcha', english: 'Inglizcha',
  ru: 'Ruscha', rus: 'Ruscha', russian: 'Ruscha',
  uz: 'O\'zbekcha', uzb: 'O\'zbekcha', uzbek: 'O\'zbekcha',
  fr: 'Fransuzcha', french: 'Fransuzcha',
  de: 'Nemischa', german: 'Nemischa',
  es: 'Ispancha', spanish: 'Ispancha',
  it: 'Italyancha', italian: 'Italyancha',
  pt: 'Portugalcha', portuguese: 'Portugalcha',
  nl: 'Gollandcha', dutch: 'Gollandcha',
  fi: 'Finlyandcha', hu: 'Vengercha', sv: 'Shvedcha', la: 'Lotincha', el: 'Yunoncha', zh: 'Xitoycha', eo: 'Esperanto',
  finnish: 'Finlyandcha', hungarian: 'Vengercha', swedish: 'Shvedcha', latin: 'Lotincha', greek: 'Yunoncha', chinese: 'Xitoycha', esperanto: 'Esperanto',
};

/** RFC 4180 CSV parser (quoted fields, embedded commas and newlines). Returns an array of rows. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Run `worker(item)` over `items` with limited concurrency; keeps result order. */
export async function pool(items, concurrency, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i], i);
      }
    }),
  );
  return results;
}

/** True if the URL answers 2xx to a HEAD request (follows redirects). */
export async function urlExists(url, timeout = 20000) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(timeout) });
      if (res.ok) return true;
      if (res.status === 404) return false;
    } catch {
      /* retry once */
    }
    await sleep(500);
  }
  return false;
}

export const languageName = (value) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  return LANGUAGE_NAMES[String(raw).toLowerCase()] ?? String(raw);
};

export const CATEGORY_LIST = [
  'Rus adabiyoti', 'Chet el adabiyoti', 'Ilm-fan va falsafa', 'Fantastika',
  'Sarguzasht va detektiv', 'She\'riyat va drama', 'Bolalar adabiyoti', 'Tarix va sayohat', 'O\'zbek adabiyoti',
  'Audiokitoblar',
];

/** Merge new books into a JSON array file, de-duplicated by id, sorted by popularity. */
export function mergeInto(path, incoming) {
  const existing = readJson(path, []);
  const byId = new Map(existing.map((b) => [b.id, b]));
  let added = 0;
  for (const book of incoming) {
    if (!byId.has(book.id)) added++;
    byId.set(book.id, book);
  }
  const all = [...byId.values()].sort((a, b) => b.downloads - a.downloads);
  writeJson(path, all);
  return { added, total: all.length };
}
