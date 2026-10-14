import type { Book } from '../types';
import catalog from './books.json';
import extra from './books-extra.json';
import gutenberg from './books-gutenberg.json';
import custom from './books-custom.json';
import curated from './books-catalog.json';
import audio from './books-audio.json';
import ziyouz from './books-ziyouz.json';
import blocklist from './blocklist.json';

const titleKey = (title: string) =>
  title.toLowerCase().replace(/\(.*?\)/g, '').replace(/[;:,].*$/, '').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();

/**
 * Merges every source file. De-duplicates by id and by language+title (earlier lists win, so
 * hand-picked books beat automatic ones and sources with real download counts beat curated ones).
 * Sorted by popularity: real download counts first, then the curation rank.
 */
function merge(...lists: Book[][]): Book[] {
  // books removed on request of a rights holder (see legal/README.md); they stay out even after a re-sync
  const blocked = new Set((blocklist as { id: string }[]).map((entry) => entry.id));
  const ids = new Set<string>();
  const titles = new Set<string>();
  const result: Book[] = [];
  for (const book of lists.flat()) {
    const key = `${book.kind ?? 'text'}:${book.language ?? 'Inglizcha'}:${titleKey(book.title)}`;
    if (blocked.has(book.id) || ids.has(book.id) || titles.has(key)) continue;
    ids.add(book.id);
    titles.add(key);
    result.push(book);
  }
  return result.sort((a, b) => b.downloads - a.downloads || (b.rank ?? 0) - (a.rank ?? 0));
}

export const BOOKS = merge(
  custom as Book[],
  ziyouz as Book[],
  catalog as Book[],
  extra as Book[],
  gutenberg as Book[],
  curated as Book[],
  audio as Book[],
);

export const AUTHOR_COUNT = new Set(BOOKS.map((b) => b.author)).size;
