// Add books from Internet Archive or any URL. Results go to src/data/books-custom.json.
//
//   npm run books:add                       process src/data/sources.json (the manifest)
//   npm run books:ia -- --query "creator:(Tolstoy)" --language rus --category "Rus adabiyoti" --limit 20
//                                           searches the Archive and PRINTS candidates for review
//   npm run books:ia -- ...same flags... --save     ...and saves them
//   npm run books:ia -- --ids "id1,id2" --category "O'zbek adabiyoti" --save
//
// Archive items are shown in the reader through https://archive.org/embed/<id>. Only items that
// are freely readable are kept (no lending/borrow-restricted books). Check the rights yourself
// before adding a book: the Archive only tells us it is openly accessible, not that it is public domain.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CATEGORY_LIST, getJson, languageName, mergeInto, parseArgs, readJson, shorten } from './lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'src/data/books-custom.json');
const MANIFEST = join(root, 'src/data/sources.json');

const args = parseArgs(process.argv.slice(2));
const FIELDS = ['identifier', 'title', 'creator', 'language', 'description', 'downloads', 'year', 'subject'];

const one = (value) => (Array.isArray(value) ? value[0] : value);

async function searchArchive(query, limit) {
  const url = new URL('https://archive.org/advancedsearch.php');
  url.searchParams.set('q', `(${query}) AND mediatype:texts AND -access-restricted-item:true`);
  for (const f of FIELDS) url.searchParams.append('fl[]', f);
  url.searchParams.append('sort[]', 'downloads desc');
  url.searchParams.set('rows', String(limit));
  url.searchParams.set('output', 'json');
  const data = await getJson(url.toString());
  return data?.response?.docs ?? [];
}

function fromArchive(doc, { category, language, overrides = {} }) {
  const id = doc.identifier;
  const o = overrides[id] ?? {};
  const author = one(doc.creator);
  return {
    id: `ia-${id}`,
    title: o.title ?? String(one(doc.title) ?? id).replace(/\s+/g, ' ').trim(),
    author: o.author ?? (author ? String(author).replace(/\s+/g, ' ').trim() : 'Noma\'lum muallif'),
    years: o.years ?? '',
    description: shorten(o.description ?? one(doc.description)),
    category,
    // `language` is only a label when it is one plain code (not a search expression like "uzb OR uz")
    language: languageName(language && !/\s/.test(String(language)) ? language : doc.language),
    source: 'Internet Archive',
    coverImage: `https://archive.org/services/img/${encodeURIComponent(id)}`,
    contentUrl: `https://archive.org/embed/${encodeURIComponent(id)}`,
    downloads: Number(doc.downloads ?? 0),
  };
}

function fromUrl(entry) {
  return {
    id: entry.id ?? `url-${Buffer.from(entry.contentUrl).toString('base64url').slice(-14)}`,
    title: entry.title,
    author: entry.author ?? 'Noma\'lum muallif',
    years: entry.years ?? '',
    description: shorten(entry.description),
    category: entry.category,
    language: entry.language,
    source: entry.source ?? new URL(entry.contentUrl).hostname,
    coverImage: entry.coverImage ?? '',
    contentUrl: entry.contentUrl,
    downloads: Number(entry.downloads ?? 0),
  };
}

function checkCategory(category) {
  if (!CATEGORY_LIST.includes(category)) {
    console.error(`Unknown category "${category}". Use one of:\n  ${CATEGORY_LIST.join('\n  ')}`);
    process.exit(1);
  }
}

const found = [];

if (args.query || args.ids) {
  const category = String(args.category ?? 'Chet el adabiyoti');
  checkCategory(category);
  let docs;
  if (args.ids) {
    const ids = String(args.ids).split(',').map((s) => s.trim()).filter(Boolean);
    docs = await searchArchive(ids.map((id) => `identifier:"${id}"`).join(' OR '), ids.length);
  } else {
    const filter = args.language ? ` AND language:(${String(args.language)})` : '';
    docs = await searchArchive(`${args.query}${filter}`, Number(args.limit ?? 20));
  }
  docs.forEach((d) => found.push(fromArchive(d, { category, language: args.language })));
} else {
  const manifest = readJson(MANIFEST, { archive: [], urls: [] });
  for (const group of manifest.archive ?? []) {
    checkCategory(group.category);
    const docs = group.query
      ? await searchArchive(group.query, group.limit ?? 20)
      : await searchArchive(group.ids.map((id) => `identifier:"${id}"`).join(' OR '), group.ids.length);
    docs.forEach((d) => found.push(fromArchive(d, group)));
  }
  for (const entry of manifest.urls ?? []) {
    checkCategory(entry.category);
    found.push(fromUrl(entry));
  }
}

console.log(`${found.length} candidate book(s):`);
for (const b of found) console.log(`  [${b.category}] ${b.title} | ${b.author} | ${b.language ?? '?'} | ${b.contentUrl}`);

if (args.query || args.ids) {
  if (args.save) {
    const r = mergeInto(OUT, found);
    console.log(`Saved: +${r.added} new, ${r.total} total in books-custom.json`);
  } else {
    console.log('Preview only. Add --save to write them to books-custom.json.');
  }
} else {
  const r = mergeInto(OUT, found);
  console.log(`Manifest processed: +${r.added} new, ${r.total} total in books-custom.json`);
}
