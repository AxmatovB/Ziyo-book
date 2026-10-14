// Source: Ziyouz.com kutubxonasi (ZiyoNET), the largest online library of Uzbek literature.
// It is a Joomla/PhocaDownload site: category pages list files as "Muallif. Asar nomi (yili)".
//
//   npm run books:ziyouz                  crawl the default public-domain-safe categories
//   npm run books:ziyouz -- --dry         only print what would be added
//   npm run books:ziyouz -- --categories 38,39 --delay 1000
//
// RIGHTS POLICY (read this before changing the defaults)
//   The site hosts works with mixed copyright status. We therefore only take
//     1. whole categories that are public domain by nature (folklore, classical literature,
//        Navoiy's works, classical Eastern literature), and
//     2. from modern prose / poetry / drama / anthologies, ONLY authors who died before 1956
//        (Uzbekistan protects works for 70 years after the author's death).
//   Books are NOT copied or embedded: each entry links out to Ziyouz.com (`external: true`), so
//   readers get the file from its source and the site keeps its own traffic and credit.
//   Editions and translations can carry their own rights; check before adding other categories.
//
// Crawling is polite: robots.txt allows these pages, one request at a time, 700 ms apart.
// Output: src/data/books-ziyouz.json (replaced on every run).
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseArgs, shorten, sleep, writeJson } from './lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'src/data/books-ziyouz.json');
const BASE = 'https://ziyouz.com';
const UA = 'ziyo-kutubxonasi-ingest/1.0';

const args = parseArgs(process.argv.slice(2));
const DELAY = Number(args.delay ?? 700);
const DRY = Boolean(args.dry);

// Categories that are public domain by nature: take everything.
const OPEN = {
  38: { slug: 'o-zbek-xalq-og-zaki-ijodi', author: 'Xalq og\'zaki ijodi', rank: 3 },
  39: { slug: 'o-zbek-mumtoz-adabiyoti', author: null, rank: 4 },
  40: { slug: 'alisher-navoiy-asarlari', author: 'Alisher Navoiy', rank: 5 },
  13: { slug: 'sharq-mumtoz-adabiyoti', author: null, rank: 4 },
};

// Modern categories: only authors from the public-domain list below.
const FILTERED = {
  41: { slug: 'o-zbek-nasri', rank: 4 },
  7: { slug: 'o-zbek-zamonaviy-she-riyati', rank: 3 },
  8: { slug: 'o-zbek-dramaturgiyasi', rank: 3 },
  26: { slug: 'adabiy-antologiya-va-toplamlar', rank: 2 },
  36: { slug: 'hajviyot', rank: 2 },
  17: { slug: 'bolalar-kutubxonasi', rank: 2 },
};

// Authors who died before 1956 (public domain in Uzbekistan). Match is on the author part of the title.
const PUBLIC_DOMAIN_AUTHORS = [
  ['Abdulla Qodiriy', '1894–1938'], ['Cho\'lpon', '1897–1938'], ['Abdurauf Fitrat', '1886–1938'], ['Fitrat', '1886–1938'],
  ['Hamza Hakimzoda', '1889–1929'], ['Hamza', '1889–1929'], ['Mahmudxo\'ja Behbudiy', '1875–1919'], ['Behbudiy', '1875–1919'],
  ['Abdulla Avloniy', '1878–1934'], ['Avloniy', '1878–1934'], ['Is\'hoqxon Ibrat', '1862–1937'], ['Muqimiy', '1850–1903'],
  ['Furqat', '1859–1909'], ['Zavqiy', '1853–1921'], ['Ogahiy', '1809–1874'], ['Munis', '1778–1829'], ['Nodira', '1792–1842'],
  ['Uvaysiy', '1779–1845'], ['Anbar Otin', '1870–1906'], ['Mashrab', '1657–1711'], ['Bobur', '1483–1530'],
  ['Ahmad Yassaviy', '1093–1166'], ['Alisher Navoiy', '1441–1501'], ['Lutfiy', '1366–1465'], ['Sadriddin Ayniy', '1878–1954'],
  ['Hamid Olimjon', '1909–1944'], ['Elbek', '1898–1939'], ['Botu', '1904–1938'], ['Usmon Nosir', '1912–1944'],
  ['Ulug\'bek', '1394–1449'], ['Gulxaniy', '1760–1830'], ['Amiriy', '1792–1842'], ['Nodir', '1792–1842'],
];

const norm = (s) => s.toLowerCase().replace(/[‘’ʻʼ`´]/g, '\'').replace(/\s+/g, ' ').trim();
const PD = PUBLIC_DOMAIN_AUTHORS.map(([name, years]) => ({ key: norm(name), name, years }));

function findPublicDomainAuthor(authorPart) {
  const a = norm(authorPart);
  // longest name first so "Abdulla Qodiriy" wins over a shorter overlap
  return PD.filter((p) => a.includes(p.key)).sort((x, y) => y.key.length - x.key.length)[0] ?? null;
}

/** "Muallif. Asar nomi (1992)" -> { author, title, year } (author null when it can't be told apart). */
function parseTitle(raw) {
  let text = raw.replace(/\s+/g, ' ').trim();
  let year = null;
  const y = /\s*\((\d{4})(?:[^)]*)\)\s*$/.exec(text);
  if (y) { year = y[1]; text = text.slice(0, y.index).trim(); }

  // split on the first ". " that follows a name-like part (initials like "A. Qodiriy." stay together;
  // lowercase particles such as "ibn" are allowed in the middle: "Abu Ali ibn Sino")
  const m = AUTHOR_RE.exec(text);
  if (m && m[1].split(' ').length <= 6) return { author: m[1], title: m[2], year, raw: text };
  return { author: null, title: text, year, raw: text };
}

const WORD = '[A-ZА-ЯЎҚҒҲ][\\p{L}\'‘’ʻʼ-]*';
const NAME = `(?:${WORD}\\.?|ibn|bin|ibni|al|ul|ud|ar|as|ash|at|abu)`;
const AUTHOR_RE = new RegExp(`^(${WORD}(?:\\s+${NAME}){0,4})\\.\\s+(.+)$`, 'u');

// Folklore titles start with the performer / collector: "Fozil Yo'ldosh o'g'li (aytuvchi). Balogardon (doston)"
const ROLE_RE = /^(.+?)\s*\((aytuvchi|to['ʻ’‘]plovchi|nashrga tayyorlovchi|tuzuvchi|nashr etuvchi)\)\.?\s+(.+)$/iu;
const NAMES_RE = /^([^.]+,[^.]+)\.\s+(.+)$/u;

function splitContributors(raw) {
  const role = ROLE_RE.exec(raw);
  if (role) return { contributor: `${role[2]}: ${role[1]}`, title: role[3] };
  const names = NAMES_RE.exec(raw);
  if (names && names[1].split(/[\s,]+/).length <= 8 && !/\d/.test(names[1])) return { contributor: names[1], title: names[2] };
  return { contributor: null, title: raw };
}

async function fetchText(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(45000) });
      if (res.ok) return await res.text();
    } catch { /* retry */ }
    await sleep(1500 * attempt);
  }
  return null;
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#039;|&apos;/g, '\'').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/** All file entries on one category page. */
function parsePage(html) {
  const entries = [];
  const seen = new Set();
  // each file: <div class="pd-document16" style="...icon-pdf.png..."><div class="pd-float"><a ... href="...?download=ID:slug" >Title</a>
  const re = /icon-([a-z0-9]+)\.png[^>]*>(?:<div class="pd-float">)?\s*<a[^>]*href="([^"]*\?download=(\d+):([^"]+))"[^>]*>([^<]+)<\/a>/g;
  // the "Haqida" tooltip of every file holds its size, date and download count (HTML-escaped inside an attribute)
  const tips = new Map();
  const tipRe = /pd-title\\'>([^<]+)<\/div>[\s\S]*?pd-fl-m\\'>([^<]+)<\/div>[\s\S]*?pd-fl-m\\'>([^<]+)<\/div>[\s\S]*?pd-fl-m\\'>(\d+) x<\/div>/g;
  for (const t of html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').matchAll(tipRe)) {
    tips.set(decode(t[1]).trim(), { size: t[2].trim(), downloads: Number(t[4]) });
  }
  for (const m of html.matchAll(re)) {
    const [, kind, href, id, slug, title] = m;
    if (seen.has(id)) continue;
    seen.add(id);
    const name = decode(title).trim();
    entries.push({ kind, href: decode(href), id, slug, title: name, ...tips.get(name) });
  }
  return entries;
}

/**
 * Works out how the file can be shown inside our reader.
 *  - some files redirect to a plain /books/...pdf URL: the browser displays those in an iframe;
 *  - others are streamed with "Content-Disposition: attachment" (an iframe would only download them),
 *    so they go through Google's embeddable document viewer instead.
 */
async function resolveReader(downloadUrl) {
  try {
    const res = await fetch(downloadUrl, { method: 'HEAD', redirect: 'manual', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30000) });
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      return { url: new URL(location, BASE).href.replace(/ /g, '%20'), mode: 'direct' };
    }
    if (res.ok && /pdf/i.test(res.headers.get('content-type') ?? '') && !/attachment/i.test(res.headers.get('content-disposition') ?? '')) {
      return { url: downloadUrl, mode: 'direct' };
    }
  } catch { /* fall through to the viewer */ }
  return { url: `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(downloadUrl)}`, mode: 'viewer' };
}

async function crawlCategory(id, info) {
  const items = [];
  for (let start = 0; start < 5000; start += 100) {
    const url = `${BASE}/kutubxona/category/${id}-${info.slug}${start ? `?start=${start}` : ''}`;
    const html = await fetchText(url);
    if (!html) { console.warn(`  [${id}] page start=${start}: no response`); break; }
    const page = parsePage(html).filter((e) => !items.some((x) => x.id === e.id));
    if (!page.length) break;
    items.push(...page);
    console.log(`  [${id}] start=${start}: ${page.length} files (${items.length} total)`);
    await sleep(DELAY);
  }
  return items;
}

const wanted = args.categories ? String(args.categories).split(',').map((s) => s.trim()) : null;
const books = [];
const stats = {};

for (const [id, info] of [...Object.entries(OPEN), ...Object.entries(FILTERED)]) {
  if (wanted && !wanted.includes(id)) continue;
  const open = id in OPEN;
  console.log(`Category ${id} (${open ? 'open' : 'public-domain authors only'})`);
  const items = await crawlCategory(id, info);
  let kept = 0;

  for (const e of items) {
    if (!['pdf', 'epub'].includes(e.kind)) continue; // audio and Word files are not readable inline
    const parsed = parseTitle(e.title);
    const { author: rawAuthor, year } = parsed;
    let title = parsed.title;
    const pd = rawAuthor ? findPublicDomainAuthor(rawAuthor) : null;

    if (!open && !pd) continue; // modern categories: public-domain authors only

    // Categories with a fixed author (folklore, Navoiy) keep it; the leading names are performers/collectors
    let contributor = null;
    if (info.author && !pd) ({ contributor, title } = splitContributors(parsed.raw));

    const author = pd?.name ?? (info.author ? info.author : rawAuthor) ?? 'Noma\'lum muallif';
    const years = pd?.years ?? '';
    books.push({
      id: `zy-${e.id}`,
      title,
      author,
      years,
      description: shorten(`Ziyouz.com kutubxonasidan${year ? `, ${year}-yil nashri` : ''}${e.size ? `, ${e.size}` : ''}.${contributor ? ` ${contributor[0].toUpperCase()}${contributor.slice(1)}.` : ''}`),
      category: 'O\'zbek adabiyoti',
      language: 'O\'zbekcha',
      source: 'Ziyouz.com',
      coverImage: '',
      contentUrl: BASE + e.href, // replaced below by the URL the reader can actually display
      downloads: e.downloads ?? 0,
      rank: info.rank,
    });
    kept++;
  }
  stats[id] = { found: items.length, kept };
}

// de-duplicate: the same book often appears in several categories
const byKey = new Map();
for (const b of books) {
  const key = `${b.author.toLowerCase()}|${b.title.toLowerCase()}`;
  if (!byKey.has(key)) byKey.set(key, b);
}
const unique = [...byKey.values()];

// Find out how each file can be displayed in the reader (one polite HEAD request per book)
if (!DRY && !args['no-resolve']) {
  console.log(`\nResolving reader URLs for ${unique.length} books…`);
  const modes = { direct: 0, viewer: 0 };
  for (let i = 0; i < unique.length; i++) {
    const r = await resolveReader(unique[i].contentUrl);
    unique[i].contentUrl = r.url;
    modes[r.mode]++;
    if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${unique.length}`, modes);
    await sleep(Math.min(DELAY, 400));
  }
  console.log('Reader modes:', modes);
}

console.log('\nPer category:', stats);
console.log(`Kept ${unique.length} unique books (${books.length - unique.length} duplicates removed)`);
console.log('Sample:', unique.slice(0, 8).map((b) => `${b.author}: ${b.title}`).join(' | '));

if (DRY) console.log('Dry run: nothing written.');
else { writeJson(OUT, unique); console.log('Written to src/data/books-ziyouz.json'); }
