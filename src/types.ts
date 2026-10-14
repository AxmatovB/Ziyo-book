export const CATEGORIES = [
  'Barchasi',
  'O\'zbek adabiyoti',
  'Rus adabiyoti',
  'Chet el adabiyoti',
  'Ilm-fan va falsafa',
  'Fantastika',
  'Sarguzasht va detektiv',
  'She\'riyat va drama',
  'Bolalar adabiyoti',
  'Tarix va sayohat',
  'Audiokitoblar',
] as const;

export type Category = (typeof CATEGORIES)[number];

export type View = 'Home' | 'Saved' | 'About';

export type SortKey = 'popular' | 'title' | 'author';

export interface Book {
  id: string;
  title: string;
  author: string;
  years: string;
  description: string;
  category: Exclude<Category, 'Barchasi'>;
  /** Display name of the text language; missing means English. */
  language?: string;
  /** Where the text comes from (shown in the book details). */
  source?: string;
  /** The text lives on the source site and opens there in a new tab (it is not shown in our reader). */
  external?: boolean;
  /** 'audio' books are listened to instead of read. */
  kind?: 'audio';
  /** Audiobook length, e.g. "08:12:30". */
  duration?: string;
  coverImage: string;
  contentUrl: string;
  downloads: number;
  /** Curation score for sources without download counts (higher = shown earlier). */
  rank?: number;
}
