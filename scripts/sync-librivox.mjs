// Source: LibriVox (free public-domain audiobooks, read by volunteers). The API cannot filter by
// language, so we page through the whole catalog (500 per request) and filter ourselves.
// Audio plays in the reader through the book's Internet Archive page: https://archive.org/embed/<id>.
//
//   npm run books:librivox                          defaults: all non-English + first 600 English
//   npm run books:librivox -- --max-en 1200 --lang Russian,English,French
//
// Output: src/data/books-audio.json (replaced on every run, saved after every page).
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getJson, languageName, parseArgs, shorten, writeJson } from './lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'src/data/books-audio.json');

const args = parseArgs(process.argv.slice(2));
const MAX_EN = Number(args['max-en'] ?? 600);
const ONLY = args.lang ? String(args.lang).split(',').map((s) => s.trim().toLowerCase()) : null;
const PAGE = 500;

// Languages we have a UI label for (anything else is skipped)
const KNOWN = new Set(['english', 'russian', 'french', 'german', 'spanish', 'italian', 'dutch', 'portuguese', 'finnish', 'hungarian', 'swedish', 'latin', 'greek', 'chinese', 'esperanto']);

const books = [];
let english = 0;

for (let offset = 0; ; offset += PAGE) {
  const data = await getJson(`https://librivox.org/api/feed/audiobooks/?format=json&extended=1&limit=${PAGE}&offset=${offset}`, { timeout: 90000 });
  const page = data?.books;
  if (!page) { console.log(`  offset ${offset}: no more data (${data ? 'empty' : 'no response'})`); break; }

  for (const b of page) {
    const language = String(b.language ?? '').toLowerCase();
    if (!KNOWN.has(language) || (ONLY && !ONLY.includes(language))) continue;
    if (language === 'english' && english >= MAX_EN) continue;

    const iaId = String(b.url_iarchive ?? '').split('/').filter(Boolean).pop();
    if (!iaId) continue;

    const a = b.authors?.[0];
    const author = a ? `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim() : '';
    if (!author || /various|anonymous/i.test(author)) continue;

    if (language === 'english') english++;
    books.push({
      id: `lv-${b.id}`,
      title: String(b.title).replace(/\s+/g, ' ').trim(),
      author,
      years: a.dob && a.dod ? `${a.dob}–${a.dod}` : '',
      description: shorten(b.description, 300),
      category: 'Audiokitoblar',
      language: languageName(language),
      source: 'LibriVox',
      kind: 'audio',
      duration: b.totaltime && b.totaltime !== '0:00:00' ? String(b.totaltime) : undefined,
      coverImage: `https://archive.org/services/img/${encodeURIComponent(iaId)}`,
      contentUrl: `https://archive.org/embed/${encodeURIComponent(iaId)}`,
      downloads: 0,
      rank: language === 'english' ? 0 : 1,
    });
  }

  writeJson(OUT, books);
  console.log(`  offset ${offset}: ${books.length} audiobooks kept (English ${english})`);
  if (page.length < PAGE) break;
}

writeJson(OUT, books);
const byLang = books.reduce((a, b) => ((a[b.language] = (a[b.language] || 0) + 1), a), {});
console.log('DONE', books.length, byLang);
