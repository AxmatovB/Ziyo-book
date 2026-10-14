// Source: Project Gutenberg offline catalog (pg_catalog.csv, ~21 MB, ~78k texts, 14+ languages).
// No API and no rate limits, unlike Gutendex. The catalog has no popularity numbers, so we pick
// quality with Gutenberg's own curated shelves ("Classics of Literature", "Best Books Ever
// Listings", "Harvard Classics", ...) and rank by how many of them a book is on.
//
//   npm run books:catalog                      defaults: --max 2500 --lang en,ru,fr,de,es,it
//   npm run books:catalog -- --max 4000 --lang en,ru --no-verify
//
// Output: src/data/books-catalog.json (replaced on every run).
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { languageName, parseArgs, parseCsv, pool, shorten, urlExists, writeJson, flipName } from './lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'src/data/books-catalog.json');
const CACHE = join(root, 'scripts/.pg_catalog.csv');
const CSV_URL = 'https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv';

const args = parseArgs(process.argv.slice(2));
const MAX = Number(args.max ?? 4000);
const PER_CATEGORY = Number(args['per-category'] ?? 450);
const MIN_SCORE = Number(args['min-score'] ?? 0);
const LANGS = String(args.lang ?? 'en,ru,fr,de,es,it').split(',').map((s) => s.trim());
const VERIFY = !args['no-verify'];

// 1. Download (cached for a day)
const fresh = existsSync(CACHE) && Date.now() - statSync(CACHE).mtimeMs < 24 * 3600 * 1000;
if (!fresh) {
  console.log('Downloading Gutenberg catalog…');
  const res = await fetch(CSV_URL, { signal: AbortSignal.timeout(180000) });
  if (!res.ok) { console.error('Download failed:', res.status); process.exit(1); }
  writeFileSync(CACHE, Buffer.from(await res.arrayBuffer()));
}
const rows = parseCsv(readFileSync(CACHE, 'utf8'));
const head = rows.shift();
const col = Object.fromEntries(head.map((h, i) => [h, i]));
console.log(`Catalog: ${rows.length} rows`);

// 2. Classification
const RUSSIAN = ['dostoyevsky', 'dostoevsky', 'tolstoy', 'tolstoi', 'chekhov', 'pushkin', 'turgenev', 'gogol', 'lermontov',
  'gorky', 'goncharov', 'andreyev', 'kuprin', 'bunin', 'leskov', 'nabokov', 'zamyatin', 'saltykov', 'korolenko', 'krylov',
  'ostrovsky', 'aksakov', 'derzhavin', 'nekrasov', 'tyutchev', 'fet,'];

// first matching rule wins; order = priority
const RULES = [
  ['Fantastika', /Science-Fiction|Fantasy|Horror|Gothic|Ghost|Vampire/i],
  ['Sarguzasht va detektiv', /Crime, Thrillers|Mystery|Detective/i],
  ["She'riyat va drama", /Poetry|Plays\/Films|Drama|Sonnets/i],
  ['Bolalar adabiyoti', /Children|Fairy Tales|Fables|Nursery/i],
  ['Ilm-fan va falsafa', /Philosophy|Science -|Mathematics|Physics|Psychology|Politics|Economics|Evolution|Ethics|Logic/i],
  ['Tarix va sayohat', /History -|Travel Writing|Biograph|Archaeology|Exploration|Warfare/i],
  // national literatures come before the generic "Adventure" tag so classic novels stay together
  ['Chet el adabiyoti', /(British|American|French|German|Italian|Spanish|Irish|Scandinavian|Canadian|Australian|Japanese|Chinese|Portuguese|Dutch|Polish|Hungarian|Greek|Latin) Literature|Classics of Literature/i],
  ['Sarguzasht va detektiv', /Adventure|Western|Pirate/i],
  ['Chet el adabiyoti', /Novels|Short Stories|Literature|Humour|Romance|Classics|Essays|Satire/i],
];

const QUALITY = [
  [/Category: Classics of Literature/, 3],
  [/Best Books Ever Listings/, 3],
  [/Harvard Classics/, 2],
  [/Category: Children & Young Adult Reading/, 1],
];

const BAD_TITLE = /(volume|vol\.|complete works|collected|letters|selections|works of|index|catalog|encyclop|dictionary|cookbook|, and other|bibliograph)/i;

function parseAuthor(raw) {
  const first = raw.split('; ')[0].trim();
  if (!first || /\[[^\]]+\]\s*$/.test(first) || /various|anonymous|unknown/i.test(first)) return null;
  let name = first;
  let years = '';
  const m = /,\s*(\d{3,4})?\??\s*-\s*(\d{3,4})?\??\s*$/.exec(first);
  if (m) {
    name = first.slice(0, m.index);
    years = m[1] && m[2] ? `${m[1]}–${m[2]}` : '';
  }
  return { author: flipName(name), years, key: name.toLowerCase() };
}

const candidates = [];
for (const r of rows) {
  if (r[col.Type] !== 'Text') continue;
  const langs = r[col.Language].split(';');
  const lang = langs[0];
  if (!LANGS.includes(lang) || langs.length > 1) continue;

  const author = parseAuthor(r[col.Authors]);
  const title = r[col.Title].split('\n')[0].trim();
  if (!author || !title || BAD_TITLE.test(title)) continue;

  const shelves = r[col.Bookshelves];
  const score = QUALITY.reduce((sum, [re, pts]) => sum + (re.test(shelves) ? pts : 0), 0);
  const isRussian = lang === 'ru' || RUSSIAN.some((a) => author.key.includes(a)) || /Russian Literature/.test(shelves);
  if (score < MIN_SCORE) continue;

  let category = isRussian ? 'Rus adabiyoti' : null;
  if (!category) for (const [name, re] of RULES) if (re.test(shelves)) { category = name; break; }
  if (!category) continue;

  const subjects = r[col.Subjects].split('; ').map((s) => s.replace(/\s+--\s+.*$/, '')).filter(Boolean);
  const id = r[col['Text#']];
  candidates.push({
    score: score + (lang === 'ru' ? 1 : 0),
    book: {
      id,
      title,
      author: author.author,
      years: author.years,
      description: subjects.length ? shorten(`Mavzular: ${[...new Set(subjects)].slice(0, 4).join('; ')}.`, 200) : '',
      category,
      language: languageName(lang),
      source: 'Project Gutenberg',
      coverImage: `https://www.gutenberg.org/cache/epub/${id}/pg${id}.cover.medium.jpg`,
      contentUrl: `https://www.gutenberg.org/cache/epub/${id}/pg${id}-images.html`,
      downloads: 0,
      rank: score,
    },
  });
}

// de-duplicate by title+author; best score first (older Gutenberg ids break ties), capped per category
// so one huge category (children's books, adventure) can't crowd out the rest
candidates.sort((a, b) => b.score - a.score || Number(a.book.id) - Number(b.book.id));
const seen = new Set();
const picked = [];
const perCategory = {};
for (const { book } of candidates) {
  if ((perCategory[book.category] ?? 0) >= PER_CATEGORY) continue;
  const key = `${book.language}|${book.title.toLowerCase()}|${book.author.toLowerCase()}`;
  if (seen.has(key)) continue;
  seen.add(key);
  perCategory[book.category] = (perCategory[book.category] ?? 0) + 1;
  picked.push(book);
  if (picked.length >= MAX) break;
}
console.log(`Selected ${picked.length} of ${candidates.length} candidates`);

// 3. Verify the reader page really exists (a few Gutenberg books have no HTML edition)
let books = picked;
if (VERIFY) {
  console.log('Verifying reader pages…');
  let done = 0;
  const ok = await pool(picked, 12, async (book) => {
    const alt = book.contentUrl.replace('-images.html', '.html');
    let url = null;
    if (await urlExists(book.contentUrl)) url = book.contentUrl;
    else if (await urlExists(alt)) url = alt;
    if (++done % 250 === 0) console.log(`  ${done}/${picked.length}`);
    return url;
  });
  books = picked.flatMap((b, i) => (ok[i] ? [{ ...b, contentUrl: ok[i] }] : []));
  console.log(`  ${books.length} readable, ${picked.length - books.length} dropped`);
}

writeJson(OUT, books);
const byCat = books.reduce((a, b) => ((a[b.category] = (a[b.category] || 0) + 1), a), {});
const byLang = books.reduce((a, b) => ((a[b.language] = (a[b.language] || 0) + 1), a), {});
console.log('DONE', books.length, byCat, byLang);
