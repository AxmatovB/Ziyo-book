import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ArrowRight, BookMarked, BookOpen, Check, SearchX } from 'lucide-react';
import { CATEGORIES } from './types';
import type { Book, Category, SortKey } from './types';
import { loadCatalog } from './data/catalog';
import type { Catalog } from './data/catalog';
import { useBodyScrollLock, useHashView, useStoredState } from './hooks';
import Header from './components/Header';
import Footer from './components/Footer';
import BookCard from './components/BookCard';
import BookCover from './components/BookCover';
import BookModal from './components/BookModal';
import Reader from './components/Reader';
import SortSelect from './components/SortSelect';
import ScrollRow from './components/ScrollRow';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'Mashhurlik bo\'yicha' },
  { key: 'title', label: 'Nomi bo\'yicha (A–Z)' },
  { key: 'author', label: 'Muallif bo\'yicha (A–Z)' },
];

const PAGE_SIZE = 24;
const EASE = [0.22, 1, 0.36, 1] as const;

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Sort key: ignores quotes/punctuation and leading English articles ("The Raven" sorts under R)
const sortKeyOf = (s: string) => normalize(s).replace(/^[^\p{L}\p{N}]+/u, '').replace(/^(the|a|an) /, '');

/** Loads the catalog chunk first, then renders the library. */
export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadCatalog().then(setCatalog, () => setFailed(true));
  }, []);

  if (catalog) return <Library {...catalog} />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center" role="status">
      {failed ? (
        <>
          <p className="font-serif text-3xl font-semibold">Katalogni yuklab bo'lmadi</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-moss px-7 py-3 font-sans text-sm font-semibold text-white hover:bg-moss-deep"
          >
            Qayta urinish
          </button>
        </>
      ) : (
        <>
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-moss/20 border-t-moss motion-reduce:animate-none" />
          <p className="font-serif text-2xl">Kutubxona ochilmoqda…</p>
        </>
      )}
    </div>
  );
}

function Library({ books, authorCount, languages }: Catalog) {
  const [view, setView] = useHashView();
  const [category, setCategory] = useState<Category>('Barchasi');
  const [language, setLanguage] = useState('Barchasi');
  const keepCategory = useRef(false);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [sort, setSort] = useState<SortKey>('popular');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const [savedIds, setSavedIds] = useStoredState<string[]>('ziyo_saved_books', []);
  const [lastReadId, setLastReadId] = useStoredState<string | null>('ziyo_last_read_id', null);

  const [selected, setSelected] = useState<Book | null>(null);
  const [reading, setReading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);
  const lastRead = useMemo(() => books.find((b) => b.id === lastReadId) ?? null, [books, lastReadId]);

  // A few well-known books from different sections for the hero shelf.
  const heroBooks = useMemo(
    () =>
      (['Rus adabiyoti', 'Chet el adabiyoti', 'Ilm-fan va falsafa'] as const)
        .map((c) => books.find((b) => b.category === c))
        .filter((b): b is Book => Boolean(b)),
    [books],
  );

  useBodyScrollLock(selected !== null || reading);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const toggleSave = useCallback(
    (book: Book) => {
      const isSaved = savedSet.has(book.id);
      setSavedIds((prev) => (isSaved ? prev.filter((id) => id !== book.id) : [...prev, book.id]));
      showToast(isSaved ? 'Saqlanganlardan olib tashlandi' : 'Saqlanganlarga qo\'shildi');
    },
    [savedSet, setSavedIds, showToast],
  );

  const closeAll = useCallback(() => {
    if (reading) setReading(false);
    else setSelected(null);
  }, [reading]);

  // Escape closes the top-most layer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (selected || reading)) closeAll();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, reading, closeAll]);

  // Scroll to top and reset paging whenever the listing changes
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [category, deferredQuery, view, sort, language]);

  const navigate = useCallback(
    (next: typeof view) => {
      setView(next);
      if (next !== 'Home') setQuery('');
    },
    [setView],
  );

  const pickCategory = useCallback(
    (next: Category) => {
      // footer links choose a section on purpose; only needed when the view really changes
      keepCategory.current = view !== 'Home';
      setView('Home');
      setCategory(next);
      setLanguage('Barchasi');
      setQuery('');
      window.setTimeout(() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' }), 60);
    },
    [setView, view],
  );

  const handleQueryChange = (next: string) => {
    setQuery(next);
    if (view === 'About') setView('Home');
  };

  const openRead = (book: Book) => {
    setLastReadId(book.id);
    if (book.external) {
      // the text lives on the source site: open it there instead of inside our reader
      window.open(book.contentUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setSelected(book);
    setReading(true);
  };

  // Books matching the view + search, before the category filter (used for chip counts)
  const baseList = useMemo(() => {
    const q = normalize(deferredQuery.trim());
    return books.filter((b) => {
      if (view === 'Saved' && !savedSet.has(b.id)) return false;
      if (language !== 'Barchasi' && (b.language ?? 'Inglizcha') !== language) return false;
      return !q || normalize(b.title).includes(q) || normalize(b.author).includes(q);
    });
  }, [books, view, deferredQuery, savedSet, language]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
    result.Barchasi = baseList.length;
    for (const b of baseList) result[b.category]++;
    return result;
  }, [baseList]);

  const filtered = useMemo(() => {
    const list = category === 'Barchasi' ? baseList : baseList.filter((b) => b.category === category);
    if (sort === 'popular') return list; // BOOKS is already sorted by popularity
    const key = sort === 'title' ? 'title' : 'author';
    return [...list].sort((a, b) => sortKeyOf(a[key]).localeCompare(sortKeyOf(b[key])));
  }, [baseList, category, sort]);

  // Section list for the header's quick-jump menu (whole library, independent of filters)
  const sections = useMemo(() => {
    const totals = new Map<Category, number>();
    for (const b of books) totals.set(b.category, (totals.get(b.category) ?? 0) + 1);
    return CATEGORIES.filter((c) => c !== 'Barchasi')
      .map((name) => ({ name, count: totals.get(name) ?? 0 }))
      .filter((s) => s.count > 0);
  }, [books]);

  const shown = filtered.slice(0, visible);
  const showHero = view === 'Home' && query === '';
  const noSaved = view === 'Saved' && savedIds.length === 0;

  // Each view starts unfiltered, so a Catalog filter never leaks into Saved (and vice versa)
  useEffect(() => {
    if (keepCategory.current) keepCategory.current = false;
    else setCategory('Barchasi');
    setLanguage('Barchasi');
  }, [view]);

  // If the active section runs out of books (e.g. its last saved book was removed), fall back to "all"
  useEffect(() => {
    if (view === 'Saved' && category !== 'Barchasi' && counts[category] === 0) setCategory('Barchasi');
  }, [view, category, counts]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen selection:bg-moss selection:text-white">
        <a
          href="#main"
          className="sr-only z-[70] rounded-full bg-moss px-4 py-2 font-sans text-sm text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Asosiy tarkibga o'tish
        </a>

        <Header
          view={view}
          onNavigate={navigate}
          query={query}
          onQueryChange={handleQueryChange}
          savedCount={savedIds.length}
          sections={sections}
          onPickSection={pickCategory}
        />

        <main id="main" className="mx-auto max-w-7xl px-5 pb-8 pt-8 sm:px-6 sm:pt-12">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: EASE }}
            >
              {view === 'About' ? (
                <About total={books.length} authorCount={authorCount} onBrowse={() => navigate('Home')} />
              ) : (
                <>
                  {showHero && (
                    <Hero
                      total={books.length}
                      authorCount={authorCount}
                      heroBooks={heroBooks}
                      onBrowse={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}
                      onOpen={setSelected}
                    />
                  )}

                  {showHero && lastRead && (
                    <motion.button
                      type="button"
                      onClick={() => openRead(lastRead)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.99 }}
                      className="mb-16 flex w-full items-center gap-4 rounded-2xl border border-ink/10 bg-white p-3 pr-5 text-left shadow-sm transition-shadow hover:shadow-md"
                    >
                      <BookCover book={lastRead} className="h-20 w-14 shrink-0 rounded-md" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-sans text-xs text-moss">Oxirgi o'qilgan</span>
                        <span className="block truncate font-serif text-xl font-semibold">{lastRead.title}</span>
                        <span className="block truncate font-sans text-sm text-ink/55">{lastRead.author}</span>
                      </span>
                      <span className="hidden items-center gap-2 font-sans text-sm font-semibold text-moss sm:flex">
                        Davom ettirish <ArrowRight size={16} />
                      </span>
                    </motion.button>
                  )}

                  <section id="catalog" className="scroll-mt-24" aria-labelledby="catalog-title">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <h2 id="catalog-title" className="font-serif text-4xl font-semibold leading-none sm:text-5xl">
                          {view === 'Saved' ? 'Saqlangan kitoblar' : query ? `“${query}” bo'yicha natijalar` : 'Katalog'}
                        </h2>
                        <p className="mt-2 font-sans text-sm text-ink/55" aria-live="polite">
                          {filtered.length} ta kitob
                        </p>
                      </div>

                      {!noSaved && (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-3 sm:gap-x-6">
                          {languages.length > 1 && (
                            <SortSelect
                              label="Til:"
                              value={language}
                              options={[
                                { key: 'Barchasi', label: 'Barcha tillar' },
                                ...languages.map((l) => ({ key: l.name, label: `${l.name} (${l.count})` })),
                              ]}
                              onChange={setLanguage}
                            />
                          )}
                          <SortSelect label="Saralash:" value={sort} options={SORTS} onChange={setSort} />
                        </div>
                      )}
                    </div>

                    {!noSaved && (
                    <ScrollRow className="mb-10" label="Bo'limlar" activeKey={category}>
                      <div className="flex w-max gap-2.5">
                        {CATEGORIES.filter((cat) => view !== 'Saved' || cat === 'Barchasi' || counts[cat] > 0).map((cat) => {
                          const active = category === cat;
                          const empty = !active && counts[cat] === 0;
                          return (
                            <motion.button
                              key={cat}
                              type="button"
                              role="tab"
                              aria-selected={active}
                              disabled={empty}
                              onClick={() => setCategory(cat)}
                              whileTap={empty ? undefined : { scale: 0.95 }}
                              className={`relative shrink-0 snap-start rounded-full border px-5 py-2.5 font-sans text-sm font-medium transition-colors ${
                                active
                                  ? 'border-moss text-white'
                                  : empty
                                    ? 'cursor-not-allowed border-ink/5 bg-white/50 text-ink/30'
                                    : 'border-ink/10 bg-white text-ink/65 hover:border-moss hover:text-moss'
                              }`}
                            >
                              {active && (
                                <motion.span
                                  layoutId="category-pill"
                                  className="absolute inset-0 rounded-full bg-moss"
                                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                                />
                              )}
                              <span className="relative">
                                {cat} <span className={active ? 'text-white/70' : 'text-ink/35'}>{counts[cat]}</span>
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </ScrollRow>
                    )}

                    {filtered.length === 0 ? (
                      <EmptyState
                        noSaved={noSaved}
                        onClear={() => { setQuery(''); setCategory('Barchasi'); setLanguage('Barchasi'); }}
                        onBrowse={() => navigate('Home')}
                      />
                    ) : (
                      <>
                        <div
                          key={`${view}-${category}-${sort}`}
                          className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 sm:gap-x-7 md:grid-cols-4 lg:grid-cols-5"
                        >
                          {shown.map((book, i) => (
                            <BookCard
                              key={book.id}
                              book={book}
                              index={i}
                              saved={savedSet.has(book.id)}
                              onOpen={setSelected}
                              onToggleSave={toggleSave}
                            />
                          ))}
                        </div>

                        {filtered.length > visible && (
                          <div className="mt-16 text-center">
                            <p className="mb-4 font-sans text-sm text-ink/50">
                              {shown.length} / {filtered.length} ko'rsatildi
                            </p>
                            <motion.button
                              type="button"
                              onClick={() => setVisible((v) => v + PAGE_SIZE)}
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.96 }}
                              className="rounded-full border-2 border-moss px-9 py-3.5 font-sans font-semibold text-moss transition-colors hover:bg-moss hover:text-white"
                            >
                              Yana ko'rsatish
                            </motion.button>
                          </div>
                        )}
                      </>
                    )}
                  </section>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer onNavigate={navigate} onPickCategory={pickCategory} />

        <AnimatePresence>
          {selected && !reading && (
            <BookModal
              key={selected.id}
              book={selected}
              saved={savedSet.has(selected.id)}
              onClose={() => setSelected(null)}
              onRead={() => openRead(selected)}
              onToggleSave={() => toggleSave(selected)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {reading && selected && (
            <Reader
              key={selected.id}
              book={selected}
              saved={savedSet.has(selected.id)}
              onClose={() => setReading(false)}
              onToggleSave={() => toggleSave(selected)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="fixed bottom-6 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-ink px-5 py-3 font-sans text-sm text-white shadow-2xl"
            >
              <Check size={16} className="text-brass" />
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

function Hero({ total, authorCount, heroBooks, onBrowse, onOpen }: { total: number; authorCount: number; heroBooks: Book[]; onBrowse: () => void; onOpen: (book: Book) => void }) {
  const rotations = [-9, 2, 11];
  const offsets = ['0%', '23%', '46%'];

  return (
    <section className="mb-20 grid items-center gap-12 md:grid-cols-[1.15fr_1fr] md:gap-8" aria-labelledby="hero-title">
      <div>
        <motion.h1
          id="hero-title"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mb-6 font-serif text-5xl font-medium leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
        >
          Jahon adabiyoti, <br />
          <span className="italic text-moss">hammasi bepul</span> va bir joyda.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          className="mb-9 max-w-md font-sans text-lg leading-relaxed text-ink/65"
        >
          {authorCount} nafar muallifning {total} ta kitobi va audiokitobi: Dostoyevskiydan Darvingacha. Ro'yxatdan o'tmasdan, to'g'ridan-to'g'ri brauzerda o'qing.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
          className="flex flex-wrap items-center gap-3"
        >
          <motion.button
            type="button"
            onClick={onBrowse}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="group flex items-center gap-2 rounded-full bg-moss px-8 py-4 font-sans font-semibold text-white shadow-lg shadow-moss/25 transition-colors hover:bg-moss-deep"
          >
            Katalogni ochish
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </motion.button>
        </motion.div>
      </div>

      <div className="relative mx-auto hidden h-[420px] w-full max-w-md md:block" aria-label="Mashhur kitoblar">
        {heroBooks.map((book, i) => (
          <motion.button
            key={book.id}
            type="button"
            onClick={() => onOpen(book)}
            initial={{ opacity: 0, y: 60, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: rotations[i] }}
            transition={{ duration: 0.9, delay: 0.35 + i * 0.16, ease: EASE }}
            whileHover={{ y: -14, rotate: rotations[i] * 0.4, zIndex: 10, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
            whileTap={{ scale: 0.97 }}
            style={{ left: offsets[i], top: `${(i % 2) * 6}%` }}
            className="absolute w-[52%] text-left"
            aria-label={`${book.title} — ${book.author}`}
          >
            <BookCover book={book} eager className="aspect-[2/3] w-full rounded-xl shadow-[0_26px_40px_-16px_rgba(31,33,25,0.6)]" />
          </motion.button>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ noSaved, onClear, onBrowse }: { noSaved: boolean; onClear: () => void; onBrowse: () => void }) {
  const saved = noSaved;
  const Icon = saved ? BookMarked : SearchX;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-sm py-16 text-center"
    >
      <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-moss/10 text-moss">
        <Icon size={28} />
      </span>
      <h3 className="mb-2 font-serif text-3xl font-semibold">
        {saved ? 'Hali kitob saqlamagansiz' : 'Hech narsa topilmadi'}
      </h3>
      <p className="mb-6 font-sans text-sm leading-relaxed text-ink/60">
        {saved
          ? 'Kitob kartochkasidagi yurak belgisini bosing, u shu yerda paydo bo\'ladi.'
          : 'Boshqa so\'z bilan qidirib ko\'ring yoki filtrlarni tozalang.'}
      </p>
      <motion.button
        type="button"
        onClick={saved ? onBrowse : onClear}
        whileTap={{ scale: 0.95 }}
        className="rounded-full bg-moss px-7 py-3 font-sans text-sm font-semibold text-white transition-colors hover:bg-moss-deep"
      >
        {saved ? 'Katalogga o\'tish' : 'Filtrlarni tozalash'}
      </motion.button>
    </motion.div>
  );
}

function About({ total, authorCount, onBrowse }: { total: number; authorCount: number; onBrowse: () => void }) {
  const stats = [
    { value: total, label: 'ta kitob' },
    { value: authorCount, label: 'nafar muallif' },
    { value: 0, label: 'so\'m to\'lov' },
  ];
  const stack = [
    ['React 19', 'tezkor va reaktiv interfeys'],
    ['TypeScript', 'xatolardan himoya'],
    ['Tailwind CSS', 'yagona dizayn tizimi'],
    ['Motion', 'silliq animatsiyalar'],
    ['Project Gutenberg', 'kitoblar va muqovalar manbasi'],
  ];

  return (
    <article className="mx-auto max-w-3xl py-6">
      <h1 className="mb-8 font-serif text-5xl font-medium italic sm:text-6xl">Biz haqimizda</h1>
      <p className="mb-12 max-w-2xl font-sans text-lg leading-relaxed text-ink/75">
        Ziyo Kutubxonasi jahon adabiyoti durdonalarini har kim uchun ochiq, bepul va qulay qilish uchun yaratilgan.
        Barcha kitoblar ommaviy mulkka (public domain) o'tgan asarlar bo'lib, Project Gutenberg to'plamidan olinadi.
      </p>

      <dl className="mb-14 grid grid-cols-3 gap-4 border-y border-ink/10 py-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.6, ease: EASE }}
          >
            <dd className="font-serif text-5xl font-semibold text-moss sm:text-6xl">{s.value}</dd>
            <dt className="mt-1 font-sans text-sm text-ink/55">{s.label}</dt>
          </motion.div>
        ))}
      </dl>

      <h2 className="mb-5 font-serif text-3xl font-semibold">Nimalardan qurilgan</h2>
      <ul className="mb-14 divide-y divide-ink/10 font-sans">
        {stack.map(([name, note]) => (
          <li key={name} className="flex items-baseline justify-between gap-6 py-4">
            <span className="font-semibold">{name}</span>
            <span className="text-right text-sm text-ink/55">{note}</span>
          </li>
        ))}
      </ul>

      <h2 className="mb-4 font-serif text-3xl font-semibold">Manbalar va mualliflik huquqi</h2>
      <p className="mb-4 max-w-2xl font-sans leading-relaxed text-ink/75">
        Saytga faqat ommaviy mulkka o'tgan yoki ochiq ruxsatli asarlar kiritilgan. Kitoblar bizning serverimizda
        saqlanmaydi, matn va audio manba saytlardan ko'rsatiladi: Project Gutenberg, LibriVox, Internet Archive va
        Ziyouz.com. Har bir kitob oynasida manba ko'rsatilgan.
      </p>
      <p className="mb-14 max-w-2xl font-sans leading-relaxed text-ink/75">
        Agar siz huquq egasi bo'lsangiz va kitobni olib tashlashni xohlasangiz,{' '}
        <a href="mailto:gamer20061805@gmail.com" className="font-semibold text-moss underline underline-offset-2">
          gamer20061805@gmail.com
        </a>{' '}
        manziliga yozing, kitob tezda katalogdan chiqariladi.
      </p>

      <h2 className="mb-4 font-serif text-3xl font-semibold">Ko'z uchun qulay dizayn</h2>
      <p className="mb-10 max-w-2xl font-sans leading-relaxed text-ink/75">
        Iliq qog'oz tusi, yumshoq shakllar va o'qishga mos serif shrift uzoq mutolaada ko'zni charchatmaslik uchun tanlangan.
      </p>

      <motion.button
        type="button"
        onClick={onBrowse}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        className="inline-flex items-center gap-2 rounded-full bg-moss px-8 py-4 font-sans font-semibold text-white shadow-lg shadow-moss/25 transition-colors hover:bg-moss-deep"
      >
        <BookOpen size={18} />
        Kitob tanlash
      </motion.button>
    </article>
  );
}
