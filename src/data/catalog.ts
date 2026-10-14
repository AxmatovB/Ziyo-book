import type { Book } from '../types';

export interface Catalog {
  books: Book[];
  authorCount: number;
  /** Languages present in the catalog, most common first. */
  languages: { name: string; count: number }[];
}

let loading: Promise<Catalog> | null = null;

/** Loads the (large) catalog on demand so it ships as its own chunk instead of blocking first paint. */
export function loadCatalog(): Promise<Catalog> {
  loading ??= import('./books').then(({ BOOKS, AUTHOR_COUNT }) => {
    const counts = new Map<string, number>();
    for (const b of BOOKS) {
      const name = b.language ?? 'Inglizcha';
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const languages = [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    return { books: BOOKS, authorCount: AUTHOR_COUNT, languages };
  });
  return loading;
}
