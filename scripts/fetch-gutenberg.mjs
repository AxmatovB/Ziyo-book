// Bulk-ingest popular public-domain books from Project Gutenberg (via the Gutendex API).
//
//   npm run books:gutenberg -- --lang en --pages 40
//   npm run books:gutenberg -- --lang ru --pages 5
//
// Resumable: remembers the next page per language in scripts/.state.json and saves after every
// page, so you can stop it any time (Ctrl+C) and run it again to continue.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getJson, mergeInto, parseArgs, readJson, shorten, flipName, languageName, writeJson } from './lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'src/data/books-gutenberg.json');
const STATE = join(root, 'scripts/.state.json');

const args = parseArgs(process.argv.slice(2));
const lang = String(args.lang ?? 'en');
const pages = Number(args.pages ?? 20);
const state = readJson(STATE, {});
const start = args.restart ? 1 : Number(args.start ?? state[`gutenberg:${lang}`] ?? 1);

const RUSSIAN_AUTHORS = [
  'dostoyevsky', 'dostoevsky', 'tolstoy', 'tolstoi', 'chekhov', 'pushkin', 'turgenev', 'gogol', 'lermontov',
  'gorky', 'goncharov', 'andreyev', 'kuprin', 'bunin', 'leskov', 'nabokov', 'zamyatin', 'bulgakov', 'pasternak',
  'saltykov', 'korolenko', 'krylov', 'ostrovsky', 'aksakov', 'fet,',
];

const RULES = [
  ['Fantastika', /science fiction|fantasy|horror|ghost|gothic|vampire|supernatural|utopia/],
  ['Sarguzasht va detektiv', /detective|mystery|crime|adventure|western stories|pirate|spy|thriller/],
  ['She\'riyat va drama', /poetry|poems|drama|plays|tragedies|comedies|sonnets|verse/],
  ['Bolalar adabiyoti', /juvenile|children|fairy tales|fables|nursery/],
  ['Ilm-fan va falsafa', /philosophy|science|mathematics|physics|biology|astronomy|economics|psychology|political science|ethics|logic|evolution/],
  ['Tarix va sayohat', /history|travel|description and travel|biography|voyages|exploration|war/],
  ['Chet el adabiyoti', /fiction|literature|short stories|novel|love stories|humor|satire|essays/],
];

function classify(book) {
  const author = (book.authors[0]?.name ?? '').toLowerCase();
  const text = [...(book.subjects ?? []), ...(book.bookshelves ?? [])].join(' | ').toLowerCase();
  const isRussian = book.languages.includes('ru') || RUSSIAN_AUTHORS.some((a) => author.includes(a)) || /russian fiction|russia/.test(text);
  if (isRussian && (book.languages.includes('ru') || /fiction|literature|plays|poetry|stories|novel|drama|poems/.test(text))) return 'Rus adabiyoti';
  for (const [category, pattern] of RULES) if (pattern.test(text)) return category;
  return null; // cookbooks, manuals, dictionaries, ... are skipped
}

const BAD_TITLE = /(volume|vol\.|complete works|collected|letters|selections|works of|index|catalog|encyclop|dictionary|cookbook|, and other)/i;
const BAD_AUTHOR = /(various|anonymous|unknown)/i;

const books = [];
let page = start;
let skipped = 0;

console.log(`Gutenberg [${lang}] pages ${start}..${start + pages - 1}`);
for (let i = 0; i < pages; i++, page++) {
  const data = await getJson(`https://gutendex.com/books/?languages=${lang}&copyright=false&page=${page}`);
  if (!data) { console.warn(`  page ${page}: no response, stopping (run again to resume)`); break; }

  for (const b of data.results) {
    const author = b.authors[0];
    const html = b.formats['text/html'];
    const cover = b.formats['image/jpeg'];
    const category = classify(b);
    if (!author || BAD_AUTHOR.test(author.name) || !html || !cover || BAD_TITLE.test(b.title) || !category) { skipped++; continue; }
    books.push({
      id: String(b.id),
      title: b.title.replace(/\s*;\s*or,?\s*/i, ': ').replace(/\r?\n/g, ' ').trim(),
      author: flipName(author.name),
      years: author.birth_year && author.death_year ? `${author.birth_year}–${author.death_year}` : '',
      description: shorten(b.summaries?.[0]),
      category,
      language: languageName(lang),
      source: 'Project Gutenberg',
      coverImage: cover.replace('http://', 'https://'),
      contentUrl: html.replace('http://', 'https://'),
      downloads: b.download_count,
    });
  }

  const result = mergeInto(OUT, books.splice(0));
  state[`gutenberg:${lang}`] = page + 1;
  writeJson(STATE, state);
  console.log(`  page ${page}: +${result.added} new, ${result.total} total in file (skipped ${skipped})`);
  if (!data.next) { console.log('  reached the last page'); break; }
}
console.log('DONE');
